import { describe, it, expect } from 'vitest';
import { steem } from '../src';
const { auth, broadcast, api } = steem;

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const activeWif = auth.toWif(username, password, 'active');

describe('HF20 Accounts', () => {
  it('has generated methods', () => {
    expect(broadcast.claimAccount).toBeDefined();
    expect(broadcast.createClaimedAccount).toBeDefined();
  });

  it('has promise methods', () => {
    expect(broadcast.claimAccountAsync).toBeDefined();
    expect(broadcast.createClaimedAccountAsync).toBeDefined();
  });

  describe('claimAccount', () => {
    /* Skipped tests as per original:
     * - Steem-js test infrastructure not set up for testing active auths
     * - Blocked by Steem issue #3546
     * - Need test account with enough RC
     */
    it.skip('signs and verifies auth', async () => {
      const tx = {
        operations: [[
          'claim_account', {
            creator: username,
            fee: '0.000 STEEM'
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.22.0') return;

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('claims and creates account', async () => {
      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.22.0') return;

      await broadcast.claimAccountAsync(activeWif, username, '0.000 STEEM', []);
      
      const newAccountName = `${username}-${Math.floor(Math.random() * 10000)}`;
      const keys = auth.generateKeys(username, password, ['posting', 'active', 'owner', 'memo']);

      const createResult = await broadcast.createClaimedAccountAsync(
        activeWif,
        username,
        newAccountName,
        keys.owner,
        keys.active,
        keys.posting,
        keys.memo,
        {},
        []
      );

      expect(createResult).toBeDefined();
    });
  });
}); 