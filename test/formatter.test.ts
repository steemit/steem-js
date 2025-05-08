import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  formatVests,
  formatReputation,
  formatPercent,
  formatTime,
  formatNumber
} from '../src/formatter';

describe('Formatter', () => {
  describe('formatAmount', () => {
    it('should format number amount', () => {
      expect(formatAmount(1.234)).toBe('1.234 STEEM');
    });

    it('should format string amount', () => {
      expect(formatAmount('1.234')).toBe('1.234 STEEM');
    });

    it('should format with custom symbol', () => {
      expect(formatAmount(1.234, 'SBD')).toBe('1.234 SBD');
    });
  });

  describe('formatVests', () => {
    it('should format number vests', () => {
      expect(formatVests(1.234567)).toBe('1.234567 VESTS');
    });

    it('should format string vests', () => {
      expect(formatVests('1.234567')).toBe('1.234567 VESTS');
    });
  });

  describe('formatReputation', () => {
    it('should format zero reputation', () => {
      expect(formatReputation(0)).toBe('25');
    });

    it('should format positive reputation', () => {
      expect(formatReputation(95832978796820)).toBe('69');
      expect(formatReputation(10004392664120)).toBe('61');
      expect(formatReputation(30999525306309)).toBe('65');
      expect(formatReputation(334486135407077)).toBe('74');
    });

    it('should format negative reputation', () => {
      expect(formatReputation(-37765258368568)).toBe('-16');
      expect(formatReputation(-1234123412342234)).toBe('-29');
      expect(formatReputation(-22233344455)).toBe('12');
    });

    it('should format string reputation', () => {
      expect(formatReputation('95832978796820')).toBe('69');
      expect(formatReputation('-37765258368568')).toBe('-16');
    });

    it('should handle invalid input', () => {
      expect(formatReputation(null)).toBe('25');
      expect(formatReputation(undefined)).toBe('25');
      expect(formatReputation('invalid')).toBe('25');
      expect(formatReputation(NaN)).toBe('25');
      expect(formatReputation(Infinity)).toBe('25');
      expect(formatReputation(-Infinity)).toBe('25');
    });

    it('should format with decimal places', () => {
      expect(formatReputation(95832978796820, 2)).toBe('69.83');
      expect(formatReputation(10004392664120, 3)).toBe('61.002');
      expect(formatReputation(30999525306309, 4)).toBe('65.4222');
      expect(formatReputation(-37765258368568, 5)).toBe('-16.19383');
      expect(formatReputation(334486135407077, 6)).toBe('74.719403');
      expect(formatReputation(-1234123412342234, 9)).toBe('-29.822227322');
      expect(formatReputation(-22233344455, 10)).toBe('12.8769568338');
    });
  });

  describe('formatPercent', () => {
    it('should format number percent', () => {
      expect(formatPercent(0.1234)).toBe('12.34%');
    });

    it('should format string percent', () => {
      expect(formatPercent('0.1234')).toBe('12.34%');
    });
  });

  describe('formatTime', () => {
    it('should format Date object', () => {
      const date = new Date('2024-02-20T12:00:00Z');
      expect(formatTime(date)).toBe('2024-02-20T12:00:00.000Z');
    });

    it('should format timestamp', () => {
      const timestamp = 1708430400000; // 2024-02-20T12:00:00Z
      expect(formatTime(timestamp)).toBe('2024-02-20T12:00:00.000Z');
    });

    it('should format date string', () => {
      expect(formatTime('2024-02-20T12:00:00Z')).toBe('2024-02-20T12:00:00.000Z');
    });
  });

  describe('formatNumber', () => {
    it('should format number with default decimals', () => {
      expect(formatNumber(1.23456)).toBe('1.23');
    });

    it('should format number with custom decimals', () => {
      expect(formatNumber(1.23456, 4)).toBe('1.2346');
    });

    it('should format string number', () => {
      expect(formatNumber('1.23456')).toBe('1.23');
    });
  });
}); 