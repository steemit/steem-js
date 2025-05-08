import { describe, it, expect } from 'vitest';
import {
  serialize,
  deserialize,
  serializeTransaction,
  deserializeTransaction
} from '../src/serializer';

describe('Serializer', () => {
  describe('serialize', () => {
    it('should serialize operation', () => {
      const operation = {
        0: 'transfer',
        1: {
          from: 'alice',
          to: 'bob',
          amount: '1.000 STEEM',
          memo: 'test'
        }
      };
      const serialized = serialize(operation);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });

    it('should handle empty operation', () => {
      const operation = {};
      const serialized = serialize(operation);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });
  });

  describe('deserialize', () => {
    it('should deserialize operation', () => {
      const operation = {
        0: 'transfer',
        1: {
          from: 'alice',
          to: 'bob',
          amount: '1.000 STEEM',
          memo: 'test'
        }
      };
      const serialized = serialize(operation);
      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(operation);
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const deserialized = deserialize(buffer);
      expect(deserialized).toEqual({});
    });
  });

  describe('serializeTransaction', () => {
    it('should serialize transaction', () => {
      const transaction = {
        ref_block_num: 1,
        ref_block_prefix: 2,
        expiration: '2024-02-20T12:00:00',
        operations: [{
          0: 'transfer',
          1: {
            from: 'alice',
            to: 'bob',
            amount: '1.000 STEEM',
            memo: 'test'
          }
        }]
      };
      const serialized = serializeTransaction(transaction);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });

    it('should handle empty transaction', () => {
      const transaction = {
        ref_block_num: 1,
        ref_block_prefix: 2,
        expiration: '2024-02-20T12:00:00',
        operations: []
      };
      const serialized = serializeTransaction(transaction);
      expect(serialized).toBeDefined();
      expect(Buffer.isBuffer(serialized)).toBe(true);
    });
  });

  describe('deserializeTransaction', () => {
    it('should deserialize transaction', () => {
      const transaction = {
        ref_block_num: 1,
        ref_block_prefix: 2,
        expiration: '2024-02-20T12:00:00',
        operations: [{
          0: 'transfer',
          1: {
            from: 'alice',
            to: 'bob',
            amount: '1.000 STEEM',
            memo: 'test'
          }
        }]
      };
      const serialized = serializeTransaction(transaction);
      const deserialized = deserializeTransaction(serialized);
      expect(deserialized).toEqual(transaction);
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const deserialized = deserializeTransaction(buffer);
      expect(deserialized).toEqual({
        ref_block_num: 0,
        ref_block_prefix: 0,
        expiration: '',
        operations: []
      });
    });
  });
}); 