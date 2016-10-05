import Promise from 'bluebird';
import should from 'should';

import steem from '../src/api';
import testPost from './test-post.json';

describe('steem', function () {
  this.timeout(10000);

  before(async () => {
    await steem.apiIdsP;
  });

  describe('getFollowers', () => {
    describe('getting ned\'s followers', () => {
      it('works', async () => {
        const result = await steem.getFollowersAsync('ned', 0, 'blog', 5);
        result.should.have.lengthOf(5);
      });

      it('clears listeners', async () => {
        steem.listeners('message').should.have.lengthOf(0);
      });
    });
  });

  describe('getContent', () => {
    describe('getting a random post', () => {
      it('works', async () => {
        const result = await steem.getContentAsync('yamadapc', 'test-1-2-3-4-5-6-7-9');
        result.should.have.properties(testPost);
      });

      it('clears listeners', async () => {
        steem.listeners('message').should.have.lengthOf(0);
      });
    });
  });

  describe('getFollowers', () => {
    describe('getting ned\'s followers', () => {
      it('works', async () => {
        const result = await steem.getFollowersAsync('ned', 0, 'blog', 5);
        result.should.have.lengthOf(5);
      });
    });
  });

  describe('streamBlockNumber', () => {
    it('streams steem transactions', (done) => {
      let i = 0;
      const release = steem.streamBlockNumber((err, block) => {
        should.exist(block);
        block.should.be.instanceOf(Number);
        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('streamBlock', () => {
    it('streams steem blocks', (done) => {
      let i = 0;
      const release = steem.streamBlock((err, block) => {
        try {
          should.exist(block);
          block.should.have.properties([
            'previous',
            'transactions',
            'timestamp',
          ]);
        } catch (err) {
          release();
          done(err);
          return;
        }

        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('streamTransactions', () => {
    it('streams steem transactions', (done) => {
      let i = 0;
      const release = steem.streamTransactions((err, transaction) => {
        try {
          should.exist(transaction);
          transaction.should.have.properties([
            'ref_block_num',
            'operations',
            'extensions',
          ]);
        } catch (err) {
          release();
          done(err);
          return;
        }

        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('streamOperations', () => {
    it('streams steem operations', (done) => {
      let i = 0;
      const release = steem.streamOperations((err, operation) => {
        try {
          should.exist(operation);
        } catch (err) {
          release();
          done(err);
          return;
        }

        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });
});
