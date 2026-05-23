/**
 * Chain-safe JSON normalization for account_update operations.
 * Matches steem::protocol::account_update_operation and authority (FC_REFLECT).
 * Broadcast via JSON-RPC uses fc::from_variant; malformed shapes cause bad_cast_exception.
 */

export type ChainAuthority = {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
};

export type AccountUpdatePayload = {
  account: string;
  owner: ChainAuthority;
  active: ChainAuthority;
  posting: ChainAuthority;
  memo_key: string;
  json_metadata: string;
};

export type OperationTuple = [string, Record<string, unknown>];

/** Steem broadcast JSON requires json_metadata to be a string (not object/array). */
export function normalizeChainJsonMetadata(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) return value.length === 0 ? '' : JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function toAuthPairs(raw: unknown): [string, number][] {
  if (Array.isArray(raw)) {
    return raw
      .filter((entry): entry is [unknown, unknown] => Array.isArray(entry) && entry.length >= 2)
      .map(([key, weight]) => [String(key), Number(weight)] as [string, number])
      .filter(([, weight]) => Number.isFinite(weight));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>)
      .map(([key, weight]) => [String(key), Number(weight)] as [string, number])
      .filter(([, weight]) => Number.isFinite(weight));
  }
  return [];
}

function toKeyAuthPairs(raw: unknown): [string, number][] {
  if (Array.isArray(raw)) {
    return raw
      .filter((entry): entry is [unknown, unknown] => Array.isArray(entry) && entry.length >= 2)
      .map(([key, weight]) => [String(key), Number(weight)] as [string, number])
      .filter(([key, weight]) => key.startsWith('STM') && Number.isFinite(weight));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>)
      .map(([key, weight]) => [String(key), Number(weight)] as [string, number])
      .filter(([key, weight]) => key.startsWith('STM') && Number.isFinite(weight));
  }
  return [];
}

/** Normalize API authority data (handles object-maps and malformed arrays). */
export function normalizeAuthoritySource(source: unknown): ChainAuthority {
  if (Array.isArray(source) || !source || typeof source !== 'object') {
    return { weight_threshold: 1, account_auths: [], key_auths: [] };
  }
  const obj = source as Record<string, unknown>;
  const weight_threshold = Math.max(1, Number(obj.weight_threshold) || 1);
  return {
    weight_threshold,
    account_auths: toAuthPairs(obj.account_auths),
    key_auths: toKeyAuthPairs(obj.key_auths),
  };
}

function sanitizeAuthority(value: unknown, field: string): ChainAuthority {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `Invalid ${field} authority: expected object with weight_threshold, account_auths, key_auths`
    );
  }
  const obj = value as Record<string, unknown>;
  const weight_threshold = Math.max(1, Number(obj.weight_threshold) || 1);
  const account_auths = toAuthPairs(obj.account_auths);
  const key_auths = toKeyAuthPairs(obj.key_auths);
  if (key_auths.length === 0) {
    throw new Error(`Invalid ${field} authority: key_auths is empty or malformed`);
  }
  return { weight_threshold, account_auths, key_auths };
}

/** Coerce account_update operation payload to chain-safe JSON (for signing and broadcast). */
export function sanitizeAccountUpdatePayload(payload: Record<string, unknown>): AccountUpdatePayload {
  return {
    account: String(payload.account || ''),
    owner: sanitizeAuthority(payload.owner, 'owner'),
    active: sanitizeAuthority(payload.active, 'active'),
    posting: sanitizeAuthority(payload.posting, 'posting'),
    memo_key: String(payload.memo_key || ''),
    json_metadata: normalizeChainJsonMetadata(payload.json_metadata),
  };
}

/**
 * Normalize an operation tuple before signing or JSON broadcast.
 * Only account_update is rewritten; other operations pass through unchanged.
 */
export function normalizeOperationForBroadcast(operation: unknown): unknown {
  if (!Array.isArray(operation) || operation.length !== 2) {
    return operation;
  }
  const [opType, opData] = operation;
  if (opType !== 'account_update') {
    return operation;
  }
  if (!opData || typeof opData !== 'object' || Array.isArray(opData)) {
    throw new Error('account_update payload must be an object');
  }
  return ['account_update', sanitizeAccountUpdatePayload(opData as Record<string, unknown>)];
}

/** Normalize transaction operations/extensions for JSON broadcast after signing. */
export function normalizeTransactionForBroadcast(trx: Record<string, unknown>): Record<string, unknown> {
  const operations = Array.isArray(trx.operations) ? trx.operations : [];
  const extensions = Array.isArray(trx.extensions) ? trx.extensions : [];
  return {
    ...trx,
    operations: operations.map((op) => normalizeOperationForBroadcast(op)),
    extensions,
  };
}

/**
 * Authority value for binary serialization (fail-fast on array mistaken for object).
 * Mirrors steem wallet_api::update_account which assigns authority structs, not key_auths arrays.
 */
export function resolveAuthorityForSerialize(auth: unknown, field: string): Record<string, unknown> {
  if (auth == null || auth === '') {
    throw new Error(`Invalid ${field} authority: value is required`);
  }
  if (Array.isArray(auth)) {
    throw new Error(
      `Invalid ${field} authority: expected object, got array (wrap key_auths inside an authority object)`
    );
  }
  if (typeof auth !== 'object') {
    throw new Error(`Invalid ${field} authority: expected object`);
  }
  return auth as Record<string, unknown>;
}
