import Promise from 'bluebird';
import should from 'should';
import steem from '../src';
import pkg from '../package.json';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const postingWif = password
  ? steem.auth.toWif(username, password, 'posting')
  : '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

describe('steem.broadcast:', () => {

  describe('comment with options', () => {
    before(() => {
      return Promise.delay(2000);
    });

    it('works', async () => {
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
