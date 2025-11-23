import { describe, it, expect, beforeAll, beforeEach, vi, afterAll } from 'vitest';
import { steem } from '../src';
import Promise from 'bluebird';

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const postingWif = password
  ? steem.auth.toWif(username, password, 'posting')
  : '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

describe('steem.broadcast:', () => {
  it('exists', () => {
    expect(steem.broadcast).toBeDefined();
  });

  it('has generated methods', () => {
    expect(steem.broadcast.vote).toBeDefined();
    expect(steem.broadcast.voteWith).toBeDefined();
    expect(steem.broadcast.comment).toBeDefined();
    expect(steem.broadcast.transfer).toBeDefined();
  });

  it('has backing methods', () => {
    expect(steem.broadcast.send).toBeDefined();
  });

  it('has promise methods', () => {
    expect(steem.broadcast.sendAsync).toBeDefined();
    expect(steem.broadcast.voteAsync).toBeDefined();
    expect(steem.broadcast.transferAsync).toBeDefined();
  });

  describe('patching transaction with default global properties', () => {
    it('works', async () => {
      const tx = await steem.broadcast._prepareTransaction({
        extensions: [],
        operations: [['vote', {
          voter: 'yamadapc',
          author: 'yamadapc',
          permlink: 'test-1-2-3-4-5-6-7-9',
        }]],
      });
      expect(tx).toHaveProperty('expiration');
      expect(tx).toHaveProperty('ref_block_num');
      expect(tx).toHaveProperty('ref_block_prefix');
      expect(tx).toHaveProperty('extensions');
      expect(tx).toHaveProperty('operations');
    });
  });

  describe('no blocks on chain', () => {
    it('works', async () => {
      const newAccountName = username + '-' + Math.floor(Math.random() * 10000);
      const keys = steem.auth.generateKeys(
        username, password, ['posting', 'active', 'owner', 'memo']);

      const getDynamicGlobalPropertiesSpy = vi.spyOn((steem.api as any), 'getDynamicGlobalPropertiesAsync').mockResolvedValue({
        time: '2019-04-14T21:30:56',
        last_irreversible_block_num: 32047459,
      });
      const getBlockAsyncSpy = vi.spyOn((steem.api as any), 'getBlockAsync').mockResolvedValue(null);

      try {
        const tx = await steem.broadcast._prepareTransaction({
          extensions: [],
          operations: [[
            'account_create',
            {
              fee: '0.000 STEEM',
              creator: username,
              new_account_name: newAccountName,
              owner: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[keys.owner, 1]],
              },
              active: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[keys.active, 1]],
              },
              posting: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[keys.posting, 1]],
              },
              memo_key: keys.memo,
              json_metadata: '',
              extensions: [],
            }
          ]],
        });
        expect(tx).toHaveProperty('expiration');
        expect(tx).toHaveProperty('ref_block_num');
        expect(tx).toHaveProperty('ref_block_prefix');
        expect(tx).toHaveProperty('extensions');
        expect(tx).toHaveProperty('operations');
      } finally {
        getDynamicGlobalPropertiesSpy.mockRestore();
        getBlockAsyncSpy.mockRestore();
      }
    });
  });

  describe('downvoting', () => {
    let oldSend: any;
    beforeAll(() => {
      oldSend = steem.api.send;
      steem.api.send = (method: any, params: any, cb: any) => {
        cb(null, {
          expiration: '2025-01-01T00:00:00',
          ref_block_num: 1234,
          ref_block_prefix: 5678,
          operations: [],
          extensions: [],
          signatures: []
        });
      };
    });
    afterAll(() => {
      steem.api.send = oldSend;
    });
    it('works', async () => {
      let tx;
      try {
        tx = await steem.broadcast.voteAsync(
          postingWif,
          username,
          'yamadapc',
          'test-1-2-3-4-5-6-7-9',
          -1000
        );
      } catch (e) {
        console.error('downvoting > works error:', e);
      }
      console.log('downvoting > works tx:', tx);
      expect(tx).toHaveProperty('expiration');
      expect(tx).toHaveProperty('ref_block_num');
      expect(tx).toHaveProperty('ref_block_prefix');
      expect(tx).toHaveProperty('extensions');
      expect(tx).toHaveProperty('operations');
      expect(tx).toHaveProperty('signatures');
    }, 10000);
  });

  describe('voting', () => {
    let oldSend: any;
    beforeAll(() => {
      oldSend = steem.api.send;
      steem.api.send = (method: any, params: any, cb: any) => {
        cb(null, {
          expiration: '2025-01-01T00:00:00',
          ref_block_num: 1234,
          ref_block_prefix: 5678,
          operations: [],
          extensions: [],
          signatures: []
        });
      };
    });
    afterAll(() => {
      steem.api.send = oldSend;
    });
    beforeEach(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }, 10000);
    it('works', async () => {
      let tx;
      try {
        tx = await steem.broadcast.voteAsync(
          postingWif,
          username,
          'yamadapc',
          'test-1-2-3-4-5-6-7-9',
          10000
        );
      } catch (e) {
        console.error('voting > works error:', e);
      }
      console.log('voting > works tx:', tx);
      expect(tx).toHaveProperty('expiration');
      expect(tx).toHaveProperty('ref_block_num');
      expect(tx).toHaveProperty('ref_block_prefix');
      expect(tx).toHaveProperty('extensions');
      expect(tx).toHaveProperty('operations');
      expect(tx).toHaveProperty('signatures');
    }, 10000);
    it('works with callbacks', async () => {
      await new Promise<void>((resolve, reject) => {
        steem.broadcast.vote(
          postingWif,
          username,
          'yamadapc',
          'test-1-2-3-4-5-6-7-9',
          5000,
          (err: any, tx: any) => {
            if (err) {
              console.error('voting > works with callbacks error:', err);
              reject(err);
              return;
            }
            console.log('voting > works with callbacks tx:', tx);
            expect(tx).toHaveProperty('expiration');
            expect(tx).toHaveProperty('ref_block_num');
            expect(tx).toHaveProperty('ref_block_prefix');
            expect(tx).toHaveProperty('extensions');
            expect(tx).toHaveProperty('operations');
            expect(tx).toHaveProperty('signatures');
            resolve();
          }
        );
      });
    }, 10000);
  });

  describe('customJson', () => {
    let oldSend: any;
    beforeAll(() => {
      oldSend = steem.api.send;
      steem.api.send = (method: any, params: any, cb: any) => {
        cb(null, {
          expiration: '2025-01-01T00:00:00',
          ref_block_num: 1234,
          ref_block_prefix: 5678,
          operations: [],
          extensions: [],
          signatures: []
        });
      };
    });
    afterAll(() => {
      steem.api.send = oldSend;
    });
    beforeAll(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }, 10000);
    it('works', async () => {
      let tx;
      try {
        tx = await steem.broadcast.customJsonAsync(
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
      } catch (e) {
        console.error('customJson > works error:', e);
      }
      console.log('customJson > works tx:', tx);
      expect(tx).toHaveProperty('expiration');
      expect(tx).toHaveProperty('ref_block_num');
      expect(tx).toHaveProperty('ref_block_prefix');
      expect(tx).toHaveProperty('extensions');
      expect(tx).toHaveProperty('operations');
      expect(tx).toHaveProperty('signatures');
    }, 10000);
  });

  describe('writeOperations', () => {
    it('receives a properly formatted error response', async () => {
      const wif = steem.auth.toWif('username', 'password', 'posting');
      try {
        await steem.broadcast.voteAsync(wif, 'voter', 'author', 'permlink', 0);
        throw new Error('writeOperation should have failed but it didn\'t');
      } catch (e: any) {
        expect(e.message).toBeDefined();
      }
    });
  });
}); 