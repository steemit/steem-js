import { describe, it, expect } from 'vitest';
import { steem } from '../src';

describe('steem.format.reputation', () => {
  const reputation = steem.formatter.reputation;

  it('rep 0 => 25', () => {
    expect(reputation(0)).toBe(25);
  });
  it('rep 95832978796820 => 69', () => {
    expect(reputation(95832978796820)).toBe(69);
  });
  it('rep 10004392664120 => 61', () => {
    expect(reputation(10004392664120)).toBe(61);
  });
  it('rep 30999525306309 => 65', () => {
    expect(reputation(30999525306309)).toBe(65);
  });
  it('rep -37765258368568 => -16', () => {
    expect(reputation(-37765258368568)).toBe(-16);
  });
  it('rep 334486135407077 => 74', () => {
    expect(reputation(334486135407077)).toBe(74);
  });
  it('rep null => null', () => {
    expect(reputation(null)).toBe(null);
  });
  it('rep undefined => undefined', () => {
    expect(reputation(undefined)).toBe(undefined);
  });
  it('rep -1234123412342234 => -29', () => {
    expect(reputation(-1234123412342234)).toBe(-29);
  });
  it('rep -22233344455 => 12', () => {
    expect(reputation(-22233344455)).toBe(12);
  });

  // with decimal places
  it('rep 0 => 25', () => {
    expect(reputation(0, 1)).toBe(25);
  });
  it('rep 95832978796820 => 69.83', () => {
    expect(reputation(95832978796820, 2)).toBe(69.83);
  });
  it('rep 10004392664120 => 61.002', () => {
    expect(reputation(10004392664120, 3)).toBe(61.002);
  });
  it('rep 30999525306309 => 65.4222', () => {
    expect(reputation(30999525306309, 4)).toBe(65.4222);
  });
  it('rep -37765258368568 => -16.19383', () => {
    expect(reputation(-37765258368568, 5)).toBe(-16.19383);
  });
  it('rep 334486135407077 => 74.719403', () => {
    expect(reputation(334486135407077, 6)).toBe(74.719403);
  });
  it('rep null => null', () => {
    expect(reputation(null, 7)).toBe(null);
  });
  it('rep undefined => undefined', () => {
    expect(reputation(undefined, 8)).toBe(undefined);
  });
  it('rep -1234123412342234 => -29.822227322', () => {
    expect(reputation(-1234123412342234, 9)).toBe(-29.822227322);
  });
  it('rep -22233344455 => 12.8769568338', () => {
    expect(reputation(-22233344455, 10)).toBe(12.8769568338);
  });
}); 