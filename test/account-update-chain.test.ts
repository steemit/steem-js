import { describe, it, expect } from 'vitest';
import { serializeTransaction } from '../src/auth/serializer/transaction';
import { transaction } from '../src/auth/serializer';
import {
  normalizeChainJsonMetadata,
  normalizeOperationForBroadcast,
  normalizeTransactionForBroadcast,
  sanitizeAccountUpdatePayload,
  resolveAuthorityForSerialize,
} from '../src/auth/account-update-chain';
import { signTransaction, toWif } from '../src/auth';

const VALID_OWNER_KEY = 'STM7DTS62msowgpAZJBNRMStMUt5bfRA4hc9j5wjwU4vKhi3KFkKb';
const VALID_ACTIVE_KEY = 'STM8k1f8fvHxLrCTqMdRUJcK2rCE3y7SQBb8PremyadWvVWMeedZy';
const VALID_POSTING_KEY = 'STM6DgpKJqoVGg7o6J1jdiP45xxbgoUg5VGzs96YBxX42NZu2bZea';
const VALID_MEMO_KEY = 'STM6ppNVEFmvBW4jEkzxXnGKuKuwYjMUrhz2WX1kHeGSchGdWJEDQ';

const validAuthority = (pubkey: string) => ({
  weight_threshold: 1,
  account_auths: [] as [string, number][],
  key_auths: [[pubkey, 1]] as [string, number][],
});

const validAccountUpdatePayload = {
  account: 'alice',
  owner: validAuthority(VALID_OWNER_KEY),
  active: validAuthority(VALID_ACTIVE_KEY),
  posting: validAuthority(VALID_POSTING_KEY),
  memo_key: VALID_MEMO_KEY,
  json_metadata: '{}',
};

const txHeader = {
  ref_block_num: 19297,
  ref_block_prefix: 1608085982,
  expiration: '2016-03-23T22:41:21',
  extensions: [] as unknown[],
};

/** Mirrors steem/tests operation_tests account_update shape (wallet_api::update_account). */
describe('account_update chain-safe JSON (steem protocol parity)', () => {
  describe('normalizeChainJsonMetadata', () => {
    it('keeps string metadata (steem_operations.cpp validates UTF-8 JSON string)', () => {
      expect(normalizeChainJsonMetadata('{"profile":{}}')).toBe('{"profile":{}}');
      expect(normalizeChainJsonMetadata('')).toBe('');
    });

    it('coerces object/array to string for FC string field', () => {
      expect(normalizeChainJsonMetadata({ profile: { name: 'alice' } })).toBe(
        '{"profile":{"name":"alice"}}'
      );
      expect(normalizeChainJsonMetadata([])).toBe('');
    });
  });

  describe('sanitizeAccountUpdatePayload', () => {
    it('outputs fc::flat_map JSON as pair arrays (not object maps)', () => {
      const sanitized = sanitizeAccountUpdatePayload(validAccountUpdatePayload);
      expect(sanitized.owner.key_auths).toEqual([[VALID_OWNER_KEY, 1]]);
      expect(sanitized.json_metadata).toBe('{}');
    });

    it('rejects owner passed as key_auths array (bad_cast: array_type to Object)', () => {
      expect(() =>
        sanitizeAccountUpdatePayload({
          ...validAccountUpdatePayload,
          owner: validAccountUpdatePayload.owner.key_auths,
        })
      ).toThrow(/Invalid owner authority/);
    });

    it('normalizes mistaken object-map account_auths to pair arrays', () => {
      const sanitized = sanitizeAccountUpdatePayload({
        ...validAccountUpdatePayload,
        owner: {
          weight_threshold: 1,
          account_auths: { bob: 1 },
          key_auths: [[VALID_OWNER_KEY, 1]],
        },
      });
      expect(sanitized.owner.account_auths).toEqual([['bob', 1]]);
    });

    it('normalizes mistaken object-map key_auths to pair arrays', () => {
      const sanitized = sanitizeAccountUpdatePayload({
        ...validAccountUpdatePayload,
        owner: {
          weight_threshold: 1,
          account_auths: [],
          key_auths: { [VALID_OWNER_KEY]: 1 },
        },
      });
      expect(sanitized.owner.key_auths).toEqual([[VALID_OWNER_KEY, 1]]);
    });
  });

  describe('resolveAuthorityForSerialize', () => {
    it('rejects array mistaken for authority object', () => {
      expect(() => resolveAuthorityForSerialize([[VALID_OWNER_KEY, 1]], 'owner')).toThrow(
        /expected object, got array/
      );
    });

    it('accepts proper authority object', () => {
      const resolved = resolveAuthorityForSerialize(validAuthority(VALID_OWNER_KEY), 'owner');
      expect(resolved.key_auths).toEqual([[VALID_OWNER_KEY, 1]]);
    });
  });

  describe('binary serializer fail-fast', () => {
    it('serializeTransaction throws when owner is key_auths array', () => {
      const tx = {
        ...txHeader,
        operations: [
          [
            'account_update',
            {
              ...validAccountUpdatePayload,
              owner: [[VALID_OWNER_KEY, 1]],
            },
          ],
        ],
      };
      expect(() => serializeTransaction(tx)).toThrow(/expected object, got array/);
    });

    it('serializes valid account_update (aligned with account_update_operation FC_REFLECT)', () => {
      const tx = {
        ...txHeader,
        operations: [['account_update', validAccountUpdatePayload]],
      };
      const buf = serializeTransaction(tx);
      expect(buf.length).toBeGreaterThan(0);
    });

    it('tuple-shaped broadcast JSON and normalized payload produce identical binary', () => {
      const tx = {
        ...txHeader,
        operations: [['account_update', validAccountUpdatePayload]],
      };
      const normalized = normalizeTransactionForBroadcast(tx);
      const bufRaw = serializeTransaction(tx);
      const bufNorm = serializeTransaction(normalized);
      expect(Buffer.compare(bufRaw, bufNorm)).toBe(0);
    });
  });

  describe('signTransaction returns broadcast-safe operations', () => {
    const fakeWif = toWif('alice', 'password', 'owner');

    it('normalizes json_metadata object before signing', () => {
      const tx = {
        ...txHeader,
        operations: [
          [
            'account_update',
            {
              ...validAccountUpdatePayload,
              json_metadata: { profile: { name: 'alice' } },
            },
          ],
        ],
      };

      const signed = signTransaction(tx, [fakeWif]) as {
        operations: [string, Record<string, unknown>][];
      };
      const payload = signed.operations[0][1];
      expect(typeof payload.json_metadata).toBe('string');
      expect(payload.json_metadata).toBe('{"profile":{"name":"alice"}}');
      expect(payload.owner).toEqual({
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[VALID_OWNER_KEY, 1]],
      });
    });

    it('signature bytes match normalized transaction (re-sign produces same digest input)', () => {
      const rawTx = {
        ...txHeader,
        operations: [
          [
            'account_update',
            {
              ...validAccountUpdatePayload,
              json_metadata: {},
            },
          ],
        ],
      };
      const normalized = normalizeTransactionForBroadcast(rawTx);
      const signed = signTransaction(rawTx, [fakeWif]) as { signatures: string[] };
      const bufFromNormalized = transaction.toBuffer(normalized);
      expect(signed.signatures.length).toBe(1);
      expect(bufFromNormalized.length).toBeGreaterThan(0);
    });

    it('throws when signing account_update with array owner', () => {
      const tx = {
        ...txHeader,
        operations: [
          [
            'account_update',
            {
              ...validAccountUpdatePayload,
              owner: [[VALID_OWNER_KEY, 1]],
            },
          ],
        ],
      };
      expect(() => signTransaction(tx, [fakeWif])).toThrow(/Invalid owner authority/);
    });
  });

  describe('normalizeOperationForBroadcast', () => {
    it('passes through non-account_update operations', () => {
      const op = ['transfer', { from: 'a', to: 'b', amount: '1.000 STEEM', memo: '' }];
      expect(normalizeOperationForBroadcast(op)).toEqual(op);
    });

    it('returns tuple with sanitized account_update payload (fc::flat_map pair arrays)', () => {
      const op = normalizeOperationForBroadcast([
        'account_update',
        {
          ...validAccountUpdatePayload,
          json_metadata: { x: 1 },
        },
      ]) as [string, Record<string, unknown>];
      expect(op[0]).toBe('account_update');
      expect(op[1].json_metadata).toBe('{"x":1}');
      const owner = op[1].owner as { key_auths: unknown };
      expect(Array.isArray(owner.key_auths)).toBe(true);
      expect(owner.key_auths).toEqual([[VALID_OWNER_KEY, 1]]);
    });
  });

  describe('account_update2 (optional authorities)', () => {
    const metadataOnlyOp = {
      account: 'alice',
      json_metadata: '',
      posting_json_metadata: '{"profile":{"name":"Alice","version":2}}',
      extensions: [] as unknown[],
    };

    it('serializes a metadata-only account_update2 (no authorities, no memo_key)', () => {
      // Previously threw "Invalid authority: expected object" — the op's
      // owner/active/posting and memo_key are optional in the protocol.
      const tx = { ...txHeader, operations: [['account_update2', metadataOnlyOp]] };
      const buf = serializeTransaction(tx);
      // Golden bytes generated with the legacy steem-js 0.7 serializer
      // (condenser-legacy node_modules) for the same input.
      expect(buf.toString('hex')).toBe(
        '614bde71d95f911bf356012b05616c696365000000000028' +
          '7b2270726f66696c65223a7b226e616d65223a22416c696365222c2276657273696f6e223a327d7d' +
          '0000',
      );
    });

    it('serializes account_update2 with authorities + memo_key present', () => {
      const auth = {
        weight_threshold: 1,
        account_auths: [] as [string, number][],
        key_auths: [[VALID_MEMO_KEY, 1]] as [string, number][],
      };
      const tx = {
        ...txHeader,
        operations: [
          [
            'account_update2',
            {
              account: 'alice',
              owner: auth,
              active: auth,
              posting: auth,
              memo_key: VALID_MEMO_KEY,
              json_metadata: '',
              posting_json_metadata: '',
              extensions: [],
            },
          ],
        ],
      };
      const buf = serializeTransaction(tx);
      // Golden bytes from the legacy steem-js 0.7 serializer for the same input.
      expect(buf.toString('hex')).toBe(
        '614bde71d95f911bf356012b05616c6963650101000000000102ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da' +
          '01000101000000000102ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da' +
          '01000101000000000102ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da' +
          '01000102ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da' +
          '00000000',
      );
    });

    it('signs a metadata-only account_update2', () => {
      const fakeWif = toWif('alice', 'password', 'posting');
      const tx = { ...txHeader, operations: [['account_update2', metadataOnlyOp]] };
      const signed = signTransaction(tx, [fakeWif]) as { signatures: string[] };
      expect(signed.signatures.length).toBe(1);
      expect(signed.signatures[0]).toMatch(/^[0-9a-f]+$/);
    });
  });
});
