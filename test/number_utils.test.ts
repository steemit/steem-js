import { describe, it, expect } from 'vitest';
import { toImpliedDecimal, fromImpliedDecimal } from '../src/serializer/number_utils';

describe('Number Utils', () => {
  describe('toImpliedDecimal', () => {
    it('should convert numbers to implied decimal format', () => {
      expect(toImpliedDecimal(1, 0)).toBe('1');
      expect(toImpliedDecimal(1, 1)).toBe('10');
      expect(toImpliedDecimal(1, 2)).toBe('100');
      expect(toImpliedDecimal('.1', 2)).toBe('10');
      expect(toImpliedDecimal('0.1', 2)).toBe('10');
      expect(toImpliedDecimal('00.1', 2)).toBe('10');
      expect(toImpliedDecimal('00.10', 2)).toBe('10');
    });

    it('should throw error for invalid inputs', () => {
      expect(() => toImpliedDecimal('00.100', 2)).toThrow();
      expect(() => toImpliedDecimal(9007199254740991 + 1, 1)).toThrow();
    });
  });

  describe('fromImpliedDecimal', () => {
    it('should convert from implied decimal format', () => {
      expect(fromImpliedDecimal(1, 0)).toBe('1');
      expect(fromImpliedDecimal(1, 1)).toBe('0.1');
      expect(fromImpliedDecimal(1, 2)).toBe('0.01');
      expect(fromImpliedDecimal(100, 3)).toBe('0.100');
    });
  });
}); 