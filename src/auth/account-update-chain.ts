/**
 * Chain-safe JSON normalization for `account_update` operations.
 *
 * Protocol types (steem/libraries/protocol):
 * - `authority` — weight_threshold (uint32), account_auths / key_auths (fc::flat_map)
 * - `account_update_operation` — account, optional owner/active/posting, memo_key, json_metadata (string)
 *
 * JSON-RPC (`condenser_api.broadcast_transaction` → fc::from_variant):
 * - `authority` is a variant_object, not a bare key_auths array.
 * - `fc::flat_map` serializes as an array of [key, weight] pairs (see fc/container/flat.hpp),
 *   not a JSON object `{ "key": weight }` — object maps cause bad_cast_exception.
 * - `json_metadata` must be a string (protocol `string`), not a parsed JSON object.
 *
 * Binary signing (transaction digest) uses the same logical fields; the serializer packs
 * flat_maps as sorted on-wire maps (see serializeAuthority in serializer/transaction.ts).
 */

/** One entry in an fc::flat_map after JSON (de)serialization: [key, weight]. */
export type AuthorityWeightPair = [string, number];

/**
 * `steem::protocol::authority` as returned by condenser / required for broadcast JSON.
 * account_auths: flat_map<account_name_type, uint16>
 * key_auths: flat_map<public_key_type, uint16> (keys are "STM..." strings in JSON)
 */
export type ChainAuthority = {
  weight_threshold: number;
  /** FC flat_map JSON: `[["account", weight], ...]` */
  account_auths: AuthorityWeightPair[];
  /** FC flat_map JSON: `[["STM...", weight], ...]` */
  key_auths: AuthorityWeightPair[];
};

/**
 * `steem::protocol::account_update_operation` payload for JSON broadcast and signing.
 * Operation tuple form: `["account_update", AccountUpdatePayload]`.
 */
export type AccountUpdatePayload = {
  account: string;
  owner: ChainAuthority;
  active: ChainAuthority;
  posting: ChainAuthority;
  memo_key: string;
  json_metadata: string;
};

export type OperationTuple = [string, Record<string, unknown>];

/**
 * Coerce `json_metadata` to protocol `string` (FC string field).
 * Node rejects object/array variants with bad_cast when broadcasting.
 */
export function normalizeChainJsonMetadata(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) return value.length === 0 ? '' : JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Parse fc::flat_map JSON (pair array) or mistaken object-map input into pair arrays.
 * Broadcast output always uses pair arrays per fc::from_variant(flat_map).
 */
function toAuthPairs(raw: unknown): AuthorityWeightPair[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((entry): entry is [unknown, unknown] => Array.isArray(entry) && entry.length >= 2)
      .map(([key, weight]) => [String(key), Number(weight)] as AuthorityWeightPair)
      .filter(([, weight]) => Number.isFinite(weight));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>)
      .map(([key, weight]) => [String(key), Number(weight)] as AuthorityWeightPair)
      .filter(([, weight]) => Number.isFinite(weight));
  }
  return [];
}

function toKeyAuthPairs(raw: unknown): AuthorityWeightPair[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((entry): entry is [unknown, unknown] => Array.isArray(entry) && entry.length >= 2)
      .map(([key, weight]) => [String(key), Number(weight)] as AuthorityWeightPair)
      .filter(([key, weight]) => key.startsWith('STM') && Number.isFinite(weight));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>)
      .map(([key, weight]) => [String(key), Number(weight)] as AuthorityWeightPair)
      .filter(([key, weight]) => key.startsWith('STM') && Number.isFinite(weight));
  }
  return [];
}

/** Normalize API authority data (get_accounts-style input; accepts pair arrays or object maps). */
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

/**
 * Coerce account_update operation payload to protocol JSON shape for signing and broadcast.
 * Emits fc::flat_map fields as pair arrays, not object maps.
 */
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
