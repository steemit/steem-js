import { sha256 } from '@noble/hashes/sha2.js';
import type { Operation, Transaction } from '../types';

export const serializeTransaction = (transaction: Transaction): Buffer => {
  return Buffer.from(JSON.stringify(transaction));
};

export const serializeOperation = (operation: Operation): Buffer => {
  return Buffer.from(JSON.stringify(operation));
};

export const getTransactionDigest = (transaction: Transaction): Buffer => {
  const serialized = serializeTransaction(transaction);
  const serializedBuf = Buffer.isBuffer(serialized) ? serialized : Buffer.from(serialized);
  return Buffer.from(sha256(serializedBuf));
};

export const getTransactionId = (transaction: Transaction): string => {
  const digest = getTransactionDigest(transaction);
  return digest.toString('hex');
};

export const serialize = (operation: unknown): Buffer => {
  return Buffer.from(JSON.stringify(operation));
};

export const deserialize = (buffer: Buffer): unknown => {
  if (!buffer || buffer.length === 0) return {};
  return JSON.parse(buffer.toString());
};

export const deserializeTransaction = (buffer: Buffer): unknown => {
  if (!buffer || buffer.length === 0) {
    return {
      ref_block_num: 0,
      ref_block_prefix: 0,
      expiration: '',
      operations: []
    };
  }
  return JSON.parse(buffer.toString());
};

export { default as convert } from './convert';
export * as types from './types';
export * as precision from './precision'; 