import Promise from 'bluebird';
import should from 'should';
import steem from '../src';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const activeWif = steem.auth.toWif(username, password, 'active');

describe('steem.hf20-accounts:', () => {
  it('has generated methods', () => {
    should.exist(steem.broadcast.claimAccount);
    should.exist(steem.broadcast.createClaimedAccount);
  });

  it('has promise methods', () => {
    should.exist(steem.broadcast.claimAccountAsync);
    should.exist(steem.broadcast.createClaimedAccountAsync);
  });


  describe('claimAccount', () => {

/*  Skip these tests. Steem-js test infrastructure not set up for testing active auths
    Blocked by Steem issue #3546
    it('signs and verifies auth', function(done) {
      let tx = {
        'operations': [[
          'claim_account', {
            'creator': username,
            'fee': '0.000 STEEM'}]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.22.0') return done();

        steem.broadcast._prepareTransaction(tx).then(function(tx){
          tx = steem.auth.signTransaction(tx, [activeWif]);
          steem.api.verifyAuthorityAsync(tx).then(
            (result) => {result.should.equal(true); done();},
            (err)    => {done(err);}
          );
        });
      });

    });

    it('claims and creates account', function(done) {
      this.skip(); // (!) need test account with enough RC

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.22.0') return done();

        steem.broadcast.claimAccountAsync(activeWif, username, '0.000 STEEM', []).then((result) => {
            let newAccountName = username + '-' + Math.floor(Math.random() * 10000);
            let keys = steem.auth.generateKeys(
                username, password, ['posting', 'active', 'owner', 'memo']);

            steem.broadcast.createClaimedAccountAsync(
                activeWif,
                username,
                newAccountName,
                keys['owner'],
                keys['active'],
                keys['posting'],
                keys['memo'],
                {}, []
              ).then((result) => {
                should.exist(result);
                done();
            }, (err) => {done(err)});
        }, (err) => {done(err)});
      });
    });
*/
  });
});
