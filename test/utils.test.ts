import { describe, it, expect, vi } from 'vitest';
import {
  sleep,
  retry,
  chunk,
  unique,
  flatten,
  isValidAddress,
  isValidAmount,
  isValidPermlink
} from '../src/utils';

describe('Utils', () => {
  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      };

      const result = await retry(fn, 3, 100);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Failed');
      };

      await expect(retry(fn, 2, 100)).rejects.toThrow('Failed');
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const array = [1, 2, 3, 4, 5, 6];
      expect(chunk(array, 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle uneven chunks', () => {
      const array = [1, 2, 3, 4, 5];
      expect(chunk(array, 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      const array = [1, 2, 2, 3, 3, 3];
      expect(unique(array)).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      const array = [[1, 2], [3, 4], [5, 6]];
      expect(flatten(array)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle empty arrays', () => {
      expect(flatten([])).toEqual([]);
    });
  });

  describe('isValidAddress', () => {
    it('should validate correct addresses', () => {
      expect(isValidAddress('ned')).toBe(true);
      expect(isValidAddress('dan')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('ned!')).toBe(false);
      expect(isValidAddress('ned@')).toBe(false);
      expect(isValidAddress('ned#')).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    it('should validate correct amounts', () => {
      expect(isValidAmount('1.000 STEEM')).toBe(true);
      expect(isValidAmount('1.000 SBD')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount('1.000')).toBe(false);
      expect(isValidAmount('1.000 USD')).toBe(false);
      expect(isValidAmount('1 STEEM')).toBe(false);
    });
  });

  describe('isValidPermlink', () => {
    it('should validate correct permlinks', () => {
      expect(isValidPermlink('my-post')).toBe(true);
      expect(isValidPermlink('my-post-123')).toBe(true);
    });

    it('should reject invalid permlinks', () => {
      expect(isValidPermlink('my post')).toBe(false);
      expect(isValidPermlink('my@post')).toBe(false);
      expect(isValidPermlink('my#post')).toBe(false);
    });
  });
}); 