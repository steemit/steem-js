import assert from "assert"
import Promise from 'bluebird';
import should from 'should';
import steem from '../src';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const activeWif = steem.auth.toWif(username, password, 'active');

describe('steem.hf21-accounts:', () => {
  it('has generated methods', () => {
    should.exist(steem.broadcast.createProposal);
    should.exist(steem.broadcast.updateProposalVotes);
    should.exist(steem.broadcast.removeProposal);
  });

  it('has promise methods', () => {
    should.exist(steem.broadcast.createProposalAsync);
    should.exist(steem.broadcast.updateProposalVotesAsync);
    should.exist(steem.broadcast.removeProposalAsync);
  });

  describe('create proposal ops', () => {
/*  Skip these tests. Steem-js test infrastructure not set up for testing active auths
    Blocked by Steem issue #3546
    it('signs and verifies create_proposal', function(done) {
      let permlink = 'test';

      let tx = {
        'operations': [[
          'create_proposal', {
            'creator': username,
            'receiver': username,
            'start_date': '2019-09-01T00:00:00',
            'end_date': '2019-10-01T00:00:00',
            'daily_pay': '1.000 SBD',
            'subject': 'testing',
            'permlink': permlink
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.22.0') return done();
        result.should.have.property('blockchain_version');

        steem.broadcast._prepareTransaction(tx).then(function(tx){
          tx = steem.auth.signTransaction(tx, [activeWif]);
          steem.api.verifyAuthorityAsync(tx).then(
            (result) => {result.should.equal(true); done();},
            (err)    => {done(err);}
          );
        });
      });
    })

    it('signs and verifies update_proposal_votes', function(done) {
      let tx = {
        'operations': [[
          'update_proposal_votes', {
            'voter': username,
            'proposal_ids': [7],
            'approve': true
        }]]
      }

      return done();

      steem.broadcast._prepareTransaction(tx).then(function(tx){
        tx = steem.auth.signTransaction(tx, [activeWif]);
        steem.api.verifyAuthorityAsync(tx).then(
          (result) => {result.should.equal(true); done();},
          (err)    => {done(err);}
        );
      });
    })
*/
  });
});
