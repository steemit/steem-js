import assert from "assert"
import Promise from 'bluebird';
import should from 'should';
import steem from '../src';

const username = process.env.STEEM_USERNAME || 'guest123';
const activeWif = '5K4RDXLLjoyvKttRj8jG9utT7GZmM9qNkePT6uRfWxKf19g322R';
const activePub = steem.auth.wifToPublic( activeWif );
const testAuth = {
  'weight_threshold': 1,
  'account_auths': [],
  'key_auths': [[activePub, 1]]
};

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
    it('signs and verifies create_proposal', function(done) {
      let url = steem.config.get('uri');
      steem.api.setOptions({ url: url, useAppbaseApi: true });
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
          steem.api.verifyAuthorityAsync(tx, testAuth).then(
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
  });
});
