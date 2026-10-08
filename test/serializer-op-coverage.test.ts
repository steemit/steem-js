import { describe, it, expect } from 'vitest';
import {
  OPERATION_TYPE_INDEX,
  UNSERIALIZED_OPERATION_TYPES,
  serializeTransaction,
} from '../src/auth/serializer/transaction';

/**
 * Regression guard for the failure mode that shipped a broken "revoke delegation"
 * button: an operation type listed in OPERATION_TYPE_INDEX without a matching
 * serializer case signs fine in tests that mock `auth.signTransaction`, then
 * throws "Operation type <x> serialization not fully implemented" in the browser.
 *
 * Every type in the map must therefore either serialize a `[op, {}]` payload or
 * throw something *other* than the "not fully implemented" error.
 *
 * Scope: this proves DISPATCH, not ENCODING — any implemented serializer accepts
 * a `[opType, {}]` payload, since the serializers default missing fields. Byte-level
 * correctness is covered elsewhere: the golden fixtures in
 * `test/fixtures/serializer/` (loaded by `test/serializer-cross-lang.test.ts`) and
 * the real signing round-trips in `test/delegate-vesting-shares.test.ts`.
 */
const UNIMPLEMENTED_MESSAGE = 'serialization not fully implemented';

/**
 * The operations that have a serializer case in `serializeOperationData`.
 * This list is the manifest for the reverse direction of the map/switch
 * invariant: a case that exists in the switch but is absent from
 * OPERATION_TYPE_INDEX would throw "Unknown operation type" at signing time
 * while the dispatch guard below stays silent, so map entries, switch cases,
 * and this list must agree exactly (both directions). Adding a switch case
 * requires adding the name here AND to the map; the set-equality assertion
 * fails otherwise.
 */
const SERIALIZED_OPERATION_TYPES = [
  'vote',
  'comment',
  'transfer',
  'transfer_to_vesting',
  'withdraw_vesting',
  'limit_order_create',
  'limit_order_cancel',
  'feed_publish',
  'convert',
  'account_create',
  'account_update',
  'witness_update',
  'account_witness_vote',
  'account_witness_proxy',
  'pow',
  'custom',
  'delete_comment',
  'custom_json',
  'comment_options',
  'set_withdraw_vesting_route',
  'limit_order_create2',
  'claim_account',
  'create_claimed_account',
  'request_account_recovery',
  'recover_account',
  'change_recovery_account',
  'escrow_transfer',
  'escrow_dispute',
  'escrow_release',
  'pow2',
  'escrow_approve',
  'transfer_to_savings',
  'transfer_from_savings',
  'cancel_transfer_from_savings',
  'custom_binary',
  'decline_voting_rights',
  'reset_account',
  'set_reset_account',
  'claim_reward_balance',
  'delegate_vesting_shares',
  'account_create_with_delegation',
  'witness_set_properties',
  'account_update2',
  'create_proposal',
  'update_proposal_votes',
  'remove_proposal',
  'claim_reward_balance2',
  // Virtual operations (never signed by clients) that still have serializers
  // so their byte encoding stays verifiable:
  'fill_convert_request',
  'comment_reward',
  'liquidity_reward',
  'interest',
  'fill_vesting_withdraw',
  'fill_order',
  'fill_transfer_from_savings',
];

function txWith(opType: string) {
  return {
    ref_block_num: 1,
    ref_block_prefix: 1,
    expiration: '2016-03-23T22:41:21',
    operations: [[opType, {}]],
    extensions: [],
  };
}

describe('operation serializer coverage', () => {
  const mappedTypes = Object.keys(OPERATION_TYPE_INDEX);

  it('knows the full 0–65 operation range (legacy st_operations / C++ operations.hpp ordering)', () => {
    expect(mappedTypes.length).toBe(66);
    expect(Object.values(OPERATION_TYPE_INDEX).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 66 }, (_, i) => i)
    );
  });

  it('places indices 48–65 at the authoritative on-chain positions', () => {
    // Authoritative ordering: legacy steem-js 0.7 `operation.st_operations`
    // (origin/legacy src/auth/serializer/src/operations.js), cross-checked
    // against the C++ reference libraries/protocol/include/steem/protocol/operations.hpp.
    // A historical version of this map had the virtual ops shifted down to
    // 48–54 and lacked vote2 / smt_* entirely.
    const expected: Record<string, number> = {
      vote2: 48,
      smt_setup: 49,
      smt_setup_emissions: 50,
      smt_setup_ico_tier: 51,
      smt_set_setup_parameters: 52,
      smt_set_runtime_parameters: 53,
      smt_create: 54,
      smt_contribute: 55,
      fill_convert_request: 56,
      author_reward: 57,
      curation_reward: 58,
      comment_reward: 59,
      liquidity_reward: 60,
      interest: 61,
      fill_vesting_withdraw: 62,
      fill_order: 63,
      shutdown_witness: 64,
      fill_transfer_from_savings: 65,
    };
    for (const [opType, index] of Object.entries(expected)) {
      expect(OPERATION_TYPE_INDEX[opType]).toBe(index);
    }
  });

  it('serializes every mapped operation type (no runtime-only gaps)', () => {
    const missing: string[] = [];
    for (const opType of mappedTypes) {
      if (UNSERIALIZED_OPERATION_TYPES.includes(opType)) continue;
      try {
        serializeTransaction(txWith(opType));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes(UNIMPLEMENTED_MESSAGE)) {
          missing.push(opType);
        }
        // Any other error means the type IS dispatched to a serializer — the
        // payload was simply too minimal for that operation.
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps the intentionally-unsupported list explicit and minimal', () => {
    expect([...UNSERIALIZED_OPERATION_TYPES]).toEqual([
      // Disabled on chain; payload embeds two full signed_block_headers.
      'report_over_production',
      // Never enabled on mainnet.
      'vote2',
      'smt_setup',
      'smt_setup_emissions',
      'smt_setup_ico_tier',
      'smt_set_setup_parameters',
      'smt_set_runtime_parameters',
      'smt_create',
      'smt_contribute',
      // Virtual operations without a serializer (chain-produced, never signed).
      'author_reward',
      'curation_reward',
      'shutdown_witness',
    ]);
    for (const opType of UNSERIALIZED_OPERATION_TYPES) {
      expect(mappedTypes).toContain(opType);
    }
  });

  it('keeps the type map and the serializer switch in exact agreement (both directions)', () => {
    // Forward: every mapped, serializable type is in the switch manifest.
    const serializableMapped = mappedTypes.filter(
      (opType) => !UNSERIALIZED_OPERATION_TYPES.includes(opType)
    );
    expect(new Set(SERIALIZED_OPERATION_TYPES)).toEqual(new Set(serializableMapped));

    // Reverse: every switch case resolves through the map — otherwise signing
    // it would throw "Unknown operation type" while the dispatch guard above
    // stays silent — and actually dispatches to a serializer.
    for (const opType of SERIALIZED_OPERATION_TYPES) {
      expect(OPERATION_TYPE_INDEX[opType]).toBeDefined();
      try {
        serializeTransaction(txWith(opType));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).not.toContain('Unknown operation type');
        expect(message).not.toContain(UNIMPLEMENTED_MESSAGE);
      }
    }
  });

  it('rejects an unknown operation type with a distinct error', () => {
    expect(() => serializeTransaction(txWith('not_an_operation'))).toThrow(
      /Unknown operation type/
    );
  });
});
