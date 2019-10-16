import assert from "assert"
import Promise from 'bluebird';
import should from 'should';
import steem from '../src';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const activeWif = steem.auth.toWif(username, password, 'active');

describe('steem.smt:', () => {

  describe('smt creation ops', () => {
    it('signs and verifies smt_create', function(done) {
      let tx = {
        'operations': [[
          'create_proposal', {
            'creator': username,
            'symbol': '@@123456789',
            'smt_creation_fee': '10.000 STEEM',
            'precision': '3',
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies smt_setup', function(done) {
      let tx = {
        'operations': [[
          'smt_setup', {
            'control_account' : username,
            'symbol' : '@@123456789',
            'max_supply' : '1000000000000000',
            'initial_generation_policy' : {
              'type' : 'smt_capped_generation_policy',
              'value': {
                'pre_soft_cap_unit' : {
                  'steem_unit' : [
                    ['$!alice.vesting',2],
                    ['$market_maker',2],
                    ['alice',2]
                  ],
                  'token_unit' : [
                    ['$!alice.vesting',2],
                    ['$from',2],
                    ['$from.vesting',2],
                    ['$market_maker',2],
                    ['$rewards',2],
                    ['alice',2]
                  ]
                },
                'post_soft_cap_unit' : {
                  'steem_unit' : [
                    ['$!alice.vesting',1],
                    ['$market_maker',1],
                    ['alice',1]
                ],
                'token_unit' : [
                  ['$!alice.vesting',1],
                  ['$from',1],
                  ['$from.vesting',1],
                  ['$market_maker',1],
                  ['$rewards',1],
                  ['alice',1]
                ]
              },
              'min_unit_ratio' : 50,
              'max_unit_ratio' : 100,
              'extensions':[]
            }
          },
          'contribution_begin_time' : '2020-12-21T00:00:00',
          'contribution_end_time' : '2021-12-21T00:00:00',
          'launch_time' : '2021-12-22T00:00:00',
          'steem_units_soft_cap' : 2000,
          'steem_units_hard_cap' : 10000,
          'extensions':[]
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies smt_setup_emissions', function(done) {
      let tx = {
        'operations': [[
          'smt_setup_emissions', {
            'control_account' : 'alice',
            'symbol' : '@@123456789',
            'schedule_time' : '2019-10-16T19:47:05',
            'emissions_unit' : {
              'token_unit' : [
                ['$market_maker',1],
                ['$rewards',1],
                ['$vesting',1]
              ]
            },
            'interval_seconds' : 21600,
            'interval_count' : 1,
            'lep_time' : '1970-01-01T00:00:00',
            'rep_time' : '1970-01-01T00:00:00',
            'lep_abs_amount' : '0',
            'rep_abs_amount': '0',
            'lep_rel_amount_numerator' : 1,
            'rep_rel_amount_numerator' : 0,
            'rel_amount_denom_bits' : 0,
            'remove' : false,
            'floor_emissions' : false,
            'extensions':[]
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies smt_set_setup_parameters', function(done) {
      let tx = {
        'operations': [[
          'smt_set_setup_parameters', {
            'control_account' : 'alice',
            'symbol' : '@@123456789',
            'setup_parameters' : [[
              'smt_param_allow_voting', {
                'value':false
            }]],
          'extensions':[]
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies smt_set_runtime_parameters', function(done) {
      let tx = {
        'operations': [[
          'smt_set_runtime_parameters', {
            'control_account' : 'alice',
            'symbol' : '@@123456789',
            'runtime_parameters' : [[
              'smt_param_vote_regeneration_period_seconds_v1', {
                'vote_regeneration_period_seconds' : 604800,
                'votes_per_regeneration_period' : 6999
            }]],
            'extensions':[]
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies smt_contribute', function(done) {
      let tx = {
        'operations': [[
          'smt_contribute', {
            'contributor' : 'alice',
            'symbol' : '@@123456789',
            'contribution_id' : 1,
            'contribution': '1.000 STEEM',
            'extensions':[]
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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
  });

  describe('smt extended ops', () => {
    let permlink = 'test';

    it('signs and verifies claim_rewards2', function(done) {
      let tx = {
        'operations': [[
          'claim_rewards2', {
            "account" : "alice",
            "reward_tokens" : [
              "1.000 STEEM",
              "1.000 SBD",
              "1.000000 VESTS",
              "0.1 @@631672482",
              "1 @@642246725",
              "1 @@678264426"
        ]}]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies comment_options', function(done) {
      let tx = {
        'operations': [[
          'comment_options', {
            "author" : username,
            "permlink" : permlink,
            "max_accepted_payout" : "1000000.000 STEEM",
            "percent_steem_dollars" : 10000,
            "allow_votes" : true,
            "allow_curation_rewards" : true,
            "extensions" : [[
              "allowed_vote_assets", {
                "votable_assets":[[
                  "@@123456789", {
                    "max_accepted_payout" : 10,
                    "allow_curation_rewards" : true,
                    "beneficiaries" : {
                      "beneficiaries" : [
                        { "account" : "alice", "weight" : 100 },
                        { "account": "bob" , "weight" : 100 }
        ]}}]]}]]}]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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

    it('signs and verifies vote2', function(done) {
      let tx = {
        'operations': [[
          'vote2', {
            "voter" : username,
            "author" : username,
            "permlink" : permlink,
            "rshares": [
              ["@@833798768","2000000000"],
              ["STEEM","81502331182"]
            ],
            "extensions":[]
        }]]
      }

      steem.api.callAsync('condenser_api.get_version', []).then((result) => {
        if(result['blockchain_version'] < '0.23.0') return done(); /* SKIP AS THIS WILL ONLY PASS ON A TESTNET CURRENTLY */
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
  });
});
