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
})
