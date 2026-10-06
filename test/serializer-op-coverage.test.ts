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
 */
const UNIMPLEMENTED_MESSAGE = 'serialization not fully implemented';

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

  it('knows the full 0–54 operation range', () => {
    expect(mappedTypes.length).toBe(55);
    expect(Object.values(OPERATION_TYPE_INDEX).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 55 }, (_, i) => i)
    );
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
    expect([...UNSERIALIZED_OPERATION_TYPES]).toEqual(['report_over_production']);
    for (const opType of UNSERIALIZED_OPERATION_TYPES) {
      expect(mappedTypes).toContain(opType);
    }
  });

  it('rejects an unknown operation type with a distinct error', () => {
    expect(() => serializeTransaction(txWith('not_an_operation'))).toThrow(
      /Unknown operation type/
    );
  });
});
