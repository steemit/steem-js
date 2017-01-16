import Promise from 'bluebird';
import should from 'should';
import steemAuth from 'steemauth';

import steemApi from '../src/api';
import steemBroadcast from '../src/broadcast';

describe('steem.broadcast', () => {
  it('exists', () => {
    should.exist(steemBroadcast);
  });

  it('has generated methods', () => {
    should.exist(steemBroadcast.vote);
    should.exist(steemBroadcast.voteWith);
    should.exist(steemBroadcast.comment);
    should.exist(steemBroadcast.transfer);
  });

  it('has backing methods', () => {
    should.exist(steemBroadcast.send);
  });

  it('has promise methods', () => {
    should.exist(steemBroadcast.sendAsync);
    should.exist(steemBroadcast.voteAsync);
    should.exist(steemBroadcast.transferAsync);
  });

  describe('patching transaction with default global properties', () => {
    it('works', async () => {
      const tx = await steemBroadcast._prepareTransaction({
        extensions: [],
        operations: [['vote', {
          voter: 'yamadapc',
          author: 'yamadapc',
          permlink: 'test-1-2-3-4-5-6-7-9',
        }]],
      });

      tx.should.have.properties([
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
        'extensions',
        'operations',
      ]);
    });
  });

  describe('downvoting', () => {
    it('works', async () => {
      const tx = await steemBroadcast.voteAsync(
        steemAuth.toWif(process.env.STEEM_USERNAME, process.env.STEEM_PASSWORD, 'posting'),
        process.env.STEEM_USERNAME,
        'yamadapc',
        'test-1-2-3-4-5-6-7-9',
        -1000
      );

      tx.should.have.properties([
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
        'extensions',
        'operations',
        'signatures',
      ]);
    });
  });

  describe('voting', () => {
    beforeEach(() => {
      return Promise.delay(2000);
    });

    it('works', async () => {
      const tx = await steemBroadcast.voteAsync(
        steemAuth.toWif(process.env.STEEM_USERNAME, process.env.STEEM_PASSWORD, 'posting'),
        process.env.STEEM_USERNAME,
        'yamadapc',
        'test-1-2-3-4-5-6-7-9',
        10000
      );

      tx.should.have.properties([
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
        'extensions',
        'operations',
        'signatures',
      ]);
    });

    it('works with callbacks', (done) => {
      steemBroadcast.vote(
        steemAuth.toWif(process.env.STEEM_USERNAME, process.env.STEEM_PASSWORD, 'posting'),
        process.env.STEEM_USERNAME,
        'yamadapc',
        'test-1-2-3-4-5-6-7-9',
        10000,
        (err, tx) => {
          if (err) return done(err);
          tx.should.have.properties([
            'expiration',
            'ref_block_num',
            'ref_block_prefix',
            'extensions',
            'operations',
            'signatures',
          ]);
          done();
        }
      );
    });
  });

  describe('customJson', () => {
    before(() => {
      return Promise.delay(2000);
    });

    it('works', async () => {
      const tx = await steemBroadcast.customJsonAsync(
        steemAuth.toWif(process.env.STEEM_USERNAME, process.env.STEEM_PASSWORD, 'posting'),
        [],
        [process.env.STEEM_USERNAME],
        'follow',
        JSON.stringify([
          'follow',
          {
            follower: process.env.STEEM_USERNAME,
            following: 'fabien',
            what: ['blog'],
          },
        ])
      );

      tx.should.have.properties([
        'expiration',
        'ref_block_num',
        'ref_block_prefix',
        'extensions',
        'operations',
        'signatures',
      ]);
    });
  });
});
