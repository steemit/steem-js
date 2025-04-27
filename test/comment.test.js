import Promise from 'bluebird';
import should from 'should';
import steem from '../src';
import pkg from '../package.json';
import assert from 'assert'

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const postingWif = password
  ? steem.auth.toWif(username, password, 'posting')
  : '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

describe('steem.broadcast:', () => {

  describe('comment with options', () => {
    before(function() {
      this.timeout(10000);
      return Promise.delay(3000);
    });

    it('works', async function() {
      this.timeout(10000);
      const permlink = steem.formatter.commentPermlink('siol', 'test');
      const operations = [
        ['comment',
          {
            parent_author: 'siol',
            parent_permlink: 'test',
            author: username,
            permlink,
            title: 'Test',
            body: `This is a test using Steem.js v${pkg.version}.`,
            json_metadata : JSON.stringify({
              tags: ['test'],
              app: `steemjs/${pkg.version}`
            })
          }
        ],
        ['comment_options', {
          author: username,
          permlink,
          max_accepted_payout: '1000000.000 SBD',
          percent_steem_dollars: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [
            [0, {
              beneficiaries: [
                { account: 'good-karma', weight: 2000 },
                { account: 'null', weight: 5000 }
              ]
            }]
          ]
        }]
      ];

      const tx = await steem.broadcast.sendAsync(
        { operations, extensions: [] },
        { posting: postingWif }
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

describe('commentPermLink:', () => {
  it('does not return dots', () => {
    var commentPermlink = steem.formatter.commentPermlink(
      'foo.bar',
      'the-first-physical-foo-bar-ready-to-be-shipped'
    );
    console.log(commentPermlink);
    assert.equal(-1, commentPermlink.indexOf('.'));
  });
});