const Promise = require('bluebird');
const should = require('should');

const Steem = require('..');
Promise.promisifyAll(Steem.api);

describe('steem', () => {
  describe('getFollowers', () => {
    describe('getting ned\'s followers', () => {
      it('works', async () => {
        const result = await Steem.api.getFollowersAsync('ned', 0, 'blog', 5)
          result.should.have.lengthOf(5);
      });

      it.skip('the startFollower parameter has an impact on the result', async () => {
        // Get the first 5
        const result1 = await Steem.api.getFollowersAsync('ned', 0, 'blog', 5)
          result1.should.have.lengthOf(5);
        const result2 = await Steem.api.getFollowersAsync('ned', 5, 'blog', 5)
          result2.should.have.lengthOf(5);
        result1.should.not.be.eql(result2);
      });
    });
  });
});
