import Promise from 'bluebird';
import should from 'should';
import steem from '../src';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const postingWif = password
  ? steem.auth.toWif(username, password, 'posting')
  : '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

describe('steem.broadcast: Promise Support', () => {
  it('should support Promises without Async suffix', function() {
    this.timeout(10000);
    const votePromise = steem.broadcast.vote(
      postingWif,
      username,
      'yamadapc',
      'test-1-2-3-4-5-6-7-9',
      1000
    );
    
    should(votePromise).be.an.instanceof(Promise);
    
    return votePromise.then(tx => {
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
  
  it('should still support callbacks', function(done) {
    this.timeout(10000);
    steem.broadcast.vote(
      postingWif,
      username,
      'yamadapc',
      'test-1-2-3-4-5-6-7-9',
      1000,
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
  
  it('should support direct Promise on send method', function() {
    this.timeout(10000);
    const operations = [['vote', {
      voter: username,
      author: 'yamadapc',
      permlink: 'test-1-2-3-4-5-6-7-9',
      weight: 1000,
    }]];
    
    const sendPromise = steem.broadcast.send(
      { operations, extensions: [] },
      { posting: postingWif }
    );
    
    should(sendPromise).be.an.instanceof(Promise);
    
    return sendPromise.then(tx => {
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