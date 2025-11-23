import { describe, it, expect, beforeAll } from 'vitest';
import { createComment } from '../src/operations';
import { steem } from '../src';
import pkg from '../package.json';

const broadcast = steem.broadcast;
const formatter = steem.formatter;
const auth = steem.auth;

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const postingWif = password
  ? auth.toWif(username, password, 'posting')
  : '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

describe('Comment', () => {
  describe('createComment', () => {
    it('should create comment operation', () => {
      const operation = createComment(
        'bob',
        'parent-post',
        'alice',
        'my-comment',
        'Title',
        'Body',
        '{"tags":["test"]}'
      );
      expect(operation).toEqual({
        0: 'comment',
        1: {
          parent_author: 'bob',
          parent_permlink: 'parent-post',
          author: 'alice',
          permlink: 'my-comment',
          title: 'Title',
          body: 'Body',
          json_metadata: '{"tags":["test"]}'
        }
      });
    });

    it('should create comment operation with default metadata', () => {
      const operation = createComment(
        'bob',
        'parent-post',
        'alice',
        'my-comment',
        'Title',
        'Body'
      );
      expect(operation).toEqual({
        0: 'comment',
        1: {
          parent_author: 'bob',
          parent_permlink: 'parent-post',
          author: 'alice',
          permlink: 'my-comment',
          title: 'Title',
          body: 'Body',
          json_metadata: '{}'
        }
      });
    });

    it('should create root comment', () => {
      const operation = createComment(
        '',
        '',
        'alice',
        'my-post',
        'Title',
        'Body'
      );
      expect(operation).toEqual({
        0: 'comment',
        1: {
          parent_author: '',
          parent_permlink: '',
          author: 'alice',
          permlink: 'my-post',
          title: 'Title',
          body: 'Body',
          json_metadata: '{}'
        }
      });
    });

    it('should handle empty title and body', () => {
      const operation = createComment(
        'bob',
        'parent-post',
        'alice',
        'my-comment',
        '',
        ''
      );
      expect(operation).toEqual({
        0: 'comment',
        1: {
          parent_author: 'bob',
          parent_permlink: 'parent-post',
          author: 'alice',
          permlink: 'my-comment',
          title: '',
          body: '',
          json_metadata: '{}'
        }
      });
    });
  });
});

describe('steem.broadcast:', () => {
  describe('comment with options', () => {
    beforeAll(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }, 10000);

    it('works', async () => {
      const permlink = formatter.commentPermlink('siol', 'test');
      const operations = [
        ['comment', {
          parent_author: 'siol',
          parent_permlink: 'test',
          author: username,
          permlink,
          title: 'Test',
          body: `This is a test using Steem.js v${pkg.version}.`,
          json_metadata: JSON.stringify({
            tags: ['test'],
            app: `steemjs/${pkg.version}`
          })
        }],
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
      console.log('About to call broadcast.sendAsync');
      const tx = await broadcast.sendAsync({ operations, extensions: [] }, { posting: postingWif });
      console.log('broadcast.sendAsync returned:', tx);
      expect(tx).toHaveProperty('expiration');
      expect(tx).toHaveProperty('ref_block_num');
      expect(tx).toHaveProperty('ref_block_prefix');
      expect(tx).toHaveProperty('extensions');
      expect(tx).toHaveProperty('operations');
      expect(tx).toHaveProperty('signatures');
    }, 10000);
  });
});

describe('commentPermLink:', () => {
  it('does not return dots', () => {
    const commentPermlink = formatter.commentPermlink(
      'foo.bar',
      'the-first-physical-foo-bar-ready-to-be-shipped'
    );
    expect(commentPermlink.includes('.')).toBe(false);
  });
}); 