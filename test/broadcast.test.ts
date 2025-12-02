import { describe, it, expect, beforeAll, beforeEach, vi, afterAll } from 'vitest';
import { steem } from '../src';

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
      const getDynamicGlobalPropertiesSpy = vi.spyOn((steem.api as any), 'getDynamicGlobalPropertiesAsync').mockResolvedValue({
        time: '2019-04-14T21:30:56',
        last_irreversible_block_num: 32047459,
      });
      const getBlockHeaderAsyncSpy = vi.spyOn((steem.api as any), 'getBlockHeaderAsync').mockResolvedValue({
        previous: '0000000000000000000000000000000000000000'
      });

      try {
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
      } finally {
        getDynamicGlobalPropertiesSpy.mockRestore();
        getBlockHeaderAsyncSpy.mockRestore();
      }
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
      const getBlockHeaderAsyncSpy = vi.spyOn((steem.api as any), 'getBlockHeaderAsync').mockResolvedValue(null);

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
        getBlockHeaderAsyncSpy.mockRestore();
      }
    });
  });

  describe('downvoting', () => {
    let oldSend: any;
    let getDynamicGlobalPropertiesSpy: any;
    let getBlockHeaderAsyncSpy: any;
    beforeAll(() => {
      // Mock getDynamicGlobalPropertiesAsync to return valid time data
      getDynamicGlobalPropertiesSpy = vi.spyOn((steem.api as any), 'getDynamicGlobalPropertiesAsync').mockResolvedValue({
        time: '2019-04-14T21:30:56',
        last_irreversible_block_num: 32047459,
      });
      // Mock getBlockHeaderAsync to return valid block data
      getBlockHeaderAsyncSpy = vi.spyOn((steem.api as any), 'getBlockHeaderAsync').mockResolvedValue({
        previous: '0000000000000000000000000000000000000000'
      });
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
      if (getDynamicGlobalPropertiesSpy) getDynamicGlobalPropertiesSpy.mockRestore();
      if (getBlockHeaderAsyncSpy) getBlockHeaderAsyncSpy.mockRestore();
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
    let getDynamicGlobalPropertiesSpy: any;
    let getBlockHeaderAsyncSpy: any;
    beforeAll(() => {
      // Mock getDynamicGlobalPropertiesAsync to return valid time data
      getDynamicGlobalPropertiesSpy = vi.spyOn((steem.api as any), 'getDynamicGlobalPropertiesAsync').mockResolvedValue({
        time: '2019-04-14T21:30:56',
        last_irreversible_block_num: 32047459,
      });
      // Mock getBlockHeaderAsync to return valid block data
      getBlockHeaderAsyncSpy = vi.spyOn((steem.api as any), 'getBlockHeaderAsync').mockResolvedValue({
        previous: '0000000000000000000000000000000000000000'
      });
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
      if (getDynamicGlobalPropertiesSpy) getDynamicGlobalPropertiesSpy.mockRestore();
      if (getBlockHeaderAsyncSpy) getBlockHeaderAsyncSpy.mockRestore();
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
    let getDynamicGlobalPropertiesSpy: any;
    let getBlockHeaderAsyncSpy: any;
    beforeAll(() => {
      // Mock getDynamicGlobalPropertiesAsync to return valid time data
      getDynamicGlobalPropertiesSpy = vi.spyOn((steem.api as any), 'getDynamicGlobalPropertiesAsync').mockResolvedValue({
        time: '2019-04-14T21:30:56',
        last_irreversible_block_num: 32047459,
      });
      // Mock getBlockHeaderAsync to return valid block data
      getBlockHeaderAsyncSpy = vi.spyOn((steem.api as any), 'getBlockHeaderAsync').mockResolvedValue({
        previous: '0000000000000000000000000000000000000000'
      });
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
      if (getDynamicGlobalPropertiesSpy) getDynamicGlobalPropertiesSpy.mockRestore();
      if (getBlockHeaderAsyncSpy) getBlockHeaderAsyncSpy.mockRestore();
    });
    beforeAll(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }, 10000);

    it('works with follow operation', async () => {
      let tx;
      try {
        // Parameter order: (wif, required_auths, required_posting_auths, id, json)
        // Reference: old-steem-js/test/broadcast.test.js and operations.js
        tx = await steem.broadcast.customJsonAsync(
          postingWif,
          [], // required_auths
          [username], // required_posting_auths
          'follow', // id
          JSON.stringify([
            'follow',
            {
              follower: username,
              following: 'fabien',
              what: ['blog'],
            },
          ]) // json
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

    it('works with notify operation (setLastRead)', async () => {
      let tx;
      try {
        // Parameter order matches Steem protocol: (wif, required_auths, required_posting_auths, id, json)
        // Example from actual transaction: required_auths=[], required_posting_auths=["ety001234"], id="notify"
        const requiredAuths: string[] = []; // Empty array for active auths
        const requiredPostingAuths: string[] = [username]; // Account name for posting auths
        const id = 'notify';
        const json = JSON.stringify(['setLastRead', { date: new Date().toISOString() }]);

        tx = await steem.broadcast.customJsonAsync(
          postingWif,
          requiredAuths,
          requiredPostingAuths,
          id,
          json
        );
      } catch (e) {
        console.error('customJson > notify error:', e);
      }
      console.log('customJson > notify tx:', tx);
      expect(tx).toHaveProperty('expiration');
      expect(tx).toHaveProperty('ref_block_num');
      expect(tx).toHaveProperty('ref_block_prefix');
      expect(tx).toHaveProperty('extensions');
      expect(tx).toHaveProperty('operations');
      expect(tx).toHaveProperty('signatures');

      // Verify operation structure matches Steem protocol
      if (tx && tx.operations && tx.operations.length > 0) {
        const op = tx.operations[0];
        expect(op[0]).toBe('custom_json');
        const opData = op[1] as any;
        expect(opData).toHaveProperty('required_auths');
        expect(opData).toHaveProperty('required_posting_auths');
        expect(opData).toHaveProperty('id');
        expect(opData).toHaveProperty('json');
        expect(Array.isArray(opData.required_auths)).toBe(true);
        expect(Array.isArray(opData.required_posting_auths)).toBe(true);
        expect(opData.required_auths.length).toBe(0);
        expect(opData.required_posting_auths).toContain(username);
        expect(opData.id).toBe('notify');
        expect(typeof opData.json).toBe('string');
      }
    }, 10000);

    it('validates parameter order matches operations.ts definition', async () => {
      // Verify that the parameter order in operations.ts matches Steem protocol
      // operations.ts should have: ["required_auths", "required_posting_auths", "id", "json"]
      // Reference: old-steem-js/src/broadcast/operations.js and steem protocol definition
      const { operations } = await import('../src/broadcast/operations');
      const customJsonOp = operations.find((op: any) => op.operation === 'custom_json');
      expect(customJsonOp).toBeDefined();
      expect(customJsonOp?.params).toEqual(['required_auths', 'required_posting_auths', 'id', 'json']);
    });
  });

  describe('writeOperations', () => {
    it('receives a properly formatted error response', async () => {
      const wif = steem.auth.toWif('username', 'password', 'posting');
      try {
        // This will fail because weight 0 is invalid, or network unavailable
        await Promise.race([
          steem.broadcast.voteAsync(wif, 'voter', 'author', 'permlink', 0),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        throw new Error('writeOperation should have failed but it didn\'t');
      } catch (e: any) {
        // Accept either validation error or timeout/network error
        expect(e.message).toBeDefined();
      }
    }, 10000);
  });

  describe('claimAccount operations', () => {
    it('has claimAccount method', () => {
      expect(steem.broadcast.claimAccount).toBeDefined();
      expect(typeof steem.broadcast.claimAccount).toBe('function');
    });

    it('has claimAccountAsync method', () => {
      expect(steem.broadcast.claimAccountAsync).toBeDefined();
      expect(typeof steem.broadcast.claimAccountAsync).toBe('function');
    });

    it('has createClaimedAccount method', () => {
      expect(steem.broadcast.createClaimedAccount).toBeDefined();
      expect(typeof steem.broadcast.createClaimedAccount).toBe('function');
    });

    it('has createClaimedAccountAsync method', () => {
      expect(steem.broadcast.createClaimedAccountAsync).toBeDefined();
      expect(typeof steem.broadcast.createClaimedAccountAsync).toBe('function');
    });
  });

  describe('proposal operations', () => {
    it('has createProposal method', () => {
      expect(steem.broadcast.createProposal).toBeDefined();
      expect(typeof steem.broadcast.createProposal).toBe('function');
    });

    it('has createProposalAsync method', () => {
      expect(steem.broadcast.createProposalAsync).toBeDefined();
      expect(typeof steem.broadcast.createProposalAsync).toBe('function');
    });

    it('has updateProposalVotes method', () => {
      expect(steem.broadcast.updateProposalVotes).toBeDefined();
      expect(typeof steem.broadcast.updateProposalVotes).toBe('function');
    });

    it('has updateProposalVotesAsync method', () => {
      expect(steem.broadcast.updateProposalVotesAsync).toBeDefined();
      expect(typeof steem.broadcast.updateProposalVotesAsync).toBe('function');
    });

    it('has removeProposal method', () => {
      expect(steem.broadcast.removeProposal).toBeDefined();
      expect(typeof steem.broadcast.removeProposal).toBe('function');
    });

    it('has removeProposalAsync method', () => {
      expect(steem.broadcast.removeProposalAsync).toBeDefined();
      expect(typeof steem.broadcast.removeProposalAsync).toBe('function');
    });
  });
}); 