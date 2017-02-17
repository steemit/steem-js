import Promise from 'bluebird';
import should from 'should';
import auth from '../src/auth';
import broadcast from '../src/broadcast';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const postingWif = password
  ? auth.toWif(username, password, 'posting')
  : '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

describe('steem.broadcast', () => {
  it('exists', () => {
    should.exist(broadcast);
  });

  it('has generated methods', () => {
    should.exist(broadcast.vote);
    should.exist(broadcast.voteWith);
    should.exist(broadcast.comment);
    should.exist(broadcast.transfer);
  });

  it('has backing methods', () => {
    should.exist(broadcast.send);
  });

  it('has promise methods', () => {
    should.exist(broadcast.sendAsync);
    should.exist(broadcast.voteAsync);
    should.exist(broadcast.transferAsync);
  });

  describe('patching transaction with default global properties', () => {
    it('works', async () => {
      const tx = await broadcast._prepareTransaction({
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
      const tx = await broadcast.voteAsync(
        postingWif,
        username,
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
      const tx = await broadcast.voteAsync(
        postingWif,
        username,
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
      broadcast.vote(
        postingWif,
        username,
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
      const tx = await broadcast.customJsonAsync(
        postingWif,
        [],
        [username],
        'follow',
        JSON.stringify([
          'follow',
          {
            follower: username,
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

  describe('writeOperations', () => {
    it('wrong', (done) => {
      const wif = auth.toWif('username', 'password', 'posting');
      broadcast.vote(wif, 'voter', 'author', 'permlink', 0, (err, result) => {
        if(err && /tx_missing_posting_auth/.test(err.message))
          done();
        else
          console.log(err, result);
      });
    });
  });
});
