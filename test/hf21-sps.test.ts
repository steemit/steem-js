import { describe, it, expect } from 'vitest';
import { steem } from '../src';
const { auth, broadcast, api } = steem;

const username = process.env.STEEM_USERNAME || 'guest123';
const password = process.env.STEEM_PASSWORD;
const activeWif = auth.toWif(username, password, 'active');

describe('HF21 SPS', () => {
  it('has generated methods', () => {
    expect(broadcast.createProposal).toBeDefined();
    expect(broadcast.updateProposalVotes).toBeDefined();
    expect(broadcast.removeProposal).toBeDefined();
  });

  it('has promise methods', () => {
    expect(broadcast.createProposalAsync).toBeDefined();
    expect(broadcast.updateProposalVotesAsync).toBeDefined();
    expect(broadcast.removeProposalAsync).toBeDefined();
  });

  describe('create proposal ops', () => {
    /* Skipped tests as per original:
     * - Steem-js test infrastructure not set up for testing active auths
     * - Blocked by Steem issue #3546
     */
    it.skip('signs and verifies create_proposal', async () => {
      const permlink = 'test';
      const tx = {
        operations: [[
          'create_proposal', {
            creator: username,
            receiver: username,
            start_date: '2019-09-01T00:00:00',
            end_date: '2019-10-01T00:00:00',
            daily_pay: '1.000 SBD',
            subject: 'testing',
            permlink: permlink
          }
        ]]
      };

      const result = await api.call('condenser_api.get_version', []);
      if (result.blockchain_version < '0.22.0') return;
      expect(result).toHaveProperty('blockchain_version');

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });

    it.skip('signs and verifies update_proposal_votes', async () => {
      const tx = {
        operations: [[
          'update_proposal_votes', {
            voter: username,
            proposal_ids: [7],
            approve: true
          }
        ]]
      };

      const preparedTx = await broadcast._prepareTransaction(tx);
      const signedTx = auth.signTransaction(preparedTx, [activeWif]);
      const verified = await api.verifyAuthority(signedTx);
      expect(verified).toBe(true);
    });
  });
}); 