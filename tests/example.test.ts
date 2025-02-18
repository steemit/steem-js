import { padZero } from '../src/padZero';

describe('padZero', () => {
  it('should return the correct result', () => {
    const result = padZero(1);
    expect(result).toBe('01');
  });
});
