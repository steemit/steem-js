import { describe, it, expect } from 'vitest';
import {
  createTransfer,
  createVote,
  createComment,
  createCustomJson,
  type TransferOperation,
  type VoteOperation,
  type CommentOperation,
  type CustomJsonOperation
} from '../src/operations';

describe('Operations', () => {
  describe('createTransfer', () => {
    it('should create a transfer operation', () => {
      const operation = createTransfer('alice', 'bob', '1.000 STEEM', 'memo');
      expect(operation).toEqual({
        0: 'transfer',
        1: {
          from: 'alice',
          to: 'bob',
          amount: '1.000 STEEM',
          memo: 'memo'
        }
      });
    });

    it('should create a transfer operation without memo', () => {
      const operation = createTransfer('alice', 'bob', '1.000 STEEM');
      expect(operation).toEqual({
        0: 'transfer',
        1: {
          from: 'alice',
          to: 'bob',
          amount: '1.000 STEEM',
          memo: ''
        }
      });
    });
  });

  describe('createVote', () => {
    it('should create a vote operation', () => {
      const operation = createVote('alice', 'bob', 'post', 10000);
      expect(operation).toEqual({
        0: 'vote',
        1: {
          voter: 'alice',
          author: 'bob',
          permlink: 'post',
          weight: 10000
        }
      });
    });
  });

  describe('createComment', () => {
    it('should create a comment operation', () => {
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

    it('should create a comment operation with default metadata', () => {
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
  });

  describe('createCustomJson', () => {
    it('should create a custom json operation', () => {
      const operation = createCustomJson(
        ['alice'],
        ['bob'],
        'follow',
        '{"follower":"alice","following":"bob","what":["blog"]}'
      );
      expect(operation).toEqual({
        0: 'custom_json',
        1: {
          required_auths: ['alice'],
          required_posting_auths: ['bob'],
          id: 'follow',
          json: '{"follower":"alice","following":"bob","what":["blog"]}'
        }
      });
    });
  });
}); 