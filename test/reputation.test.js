import assert from 'assert';
import steem from '../src';

describe('steem.format.reputation', ()=> {
    const reputation = steem.formatter.reputation;
    it('rep 0 => 25', () => {
        assert.equal(reputation(0), 25);
    });
    it('rep 95832978796820 => 69', () => {
        assert.equal(reputation(95832978796820), 69);
    });
    it('rep 10004392664120 => 61', () => {
        assert.equal(reputation(10004392664120), 61);
    });
    it('rep 30999525306309 => 65', () => {
        assert.equal(reputation(30999525306309), 65);
    });
    it('rep -37765258368568 => -16', () => {
        assert.equal(reputation(-37765258368568), -16);
    });
    it('rep 334486135407077 => 74', () => {
        assert.equal(reputation(334486135407077), 74);
    });
    it('rep null => null', () => {
        assert.equal(reputation(null), null);
    });
    it('rep undefined => undefined', () => {
        assert.equal(reputation(undefined), undefined);
    });
    it('rep -1234123412342234 => -29', () => {
        assert.equal(reputation(-1234123412342234), -29);
    });
    it('rep -22233344455 => 12', () => {
        assert.equal(reputation(-22233344455), 12);
    });

    // with decimal places
    it('rep 0 => 25', () => {
        assert.equal(reputation(0, 1), 25);
    });
    it('rep 95832978796820 => 69', () => {
        assert.equal(reputation(95832978796820, 2), 69.83);
    });
    it('rep 10004392664120 => 61', () => {
        assert.equal(reputation(10004392664120, 3), 61.002);
    });
    it('rep 30999525306309 => 65', () => {
        assert.equal(reputation(30999525306309, 4), 65.4222);
    });
    it('rep -37765258368568 => -16', () => {
        assert.equal(reputation(-37765258368568, 5), -16.19383);
    });
    it('rep 334486135407077 => 74', () => {
        assert.equal(reputation(334486135407077, 6), 74.719403);
    });
    it('rep null => null', () => {
        assert.equal(reputation(null, 7), null);
    });
    it('rep undefined => undefined', () => {
        assert.equal(reputation(undefined, 8), undefined);
    });
    it('rep -1234123412342234 => -29', () => {
        assert.equal(reputation(-1234123412342234, 9), -29.822227322);
    });
    it('rep -22233344455 => 12', () => {
        assert.equal(reputation(-22233344455, 10), 12.8769568338);
    });
})
