import { describe, it, expect } from 'vitest';
import {
  OPERATION_TYPE_INDEX,
  UNSERIALIZED_OPERATION_TYPES,
  serializeTransaction,
} from '../src/auth/serializer/transaction';

/**
 * Regression tests for the serializer hardening follow-ups: the signing path
 * must throw on malformed input instead of silently degrading it into
 * valid-looking bytes.
 */
const header = {
  ref_block_num: 19297,
  ref_block_prefix: 1608085982,
  expiration: '2016-03-23T22:41:21',
  extensions: [] as unknown[],
};

function txWith(opType: string, data: Record<string, unknown>) {
  return serializeTransaction({ ...header, operations: [[opType, data]] });
}

function proposalVotes(data: Record<string, unknown>) {
  return txWith('update_proposal_votes', { voter: 'alice', proposal_ids: [42], ...data });
}

describe('bool fields reject non-boolean truthy input (signing path)', () => {
  it('signs approve: "false" as false, NOT as true', () => {
    const asString = proposalVotes({ approve: 'false' });
    const asFalse = proposalVotes({ approve: false });
    const asTrue = proposalVotes({ approve: true });
    expect(asString.equals(asFalse)).toBe(true);
    expect(asString.equals(asTrue)).toBe(false);
  });

  it('accepts the documented input set: boolean, 0/1 numbers, true/false/0/1 strings', () => {
    expect(proposalVotes({ approve: 'true' }).equals(proposalVotes({ approve: true }))).toBe(true);
    expect(proposalVotes({ approve: '1' }).equals(proposalVotes({ approve: true }))).toBe(true);
    expect(proposalVotes({ approve: 1 }).equals(proposalVotes({ approve: true }))).toBe(true);
    expect(proposalVotes({ approve: '0' }).equals(proposalVotes({ approve: false }))).toBe(true);
    expect(proposalVotes({ approve: 0 }).equals(proposalVotes({ approve: false }))).toBe(true);
  });

  it('serializes a missing approve as false (protocol `bool approve = false` default)', () => {
    const missing = proposalVotes({});
    expect(missing.equals(proposalVotes({ approve: false }))).toBe(true);
  });

  it('throws a field-level error for unrecognized bool input', () => {
    expect(() => proposalVotes({ approve: 'yes' })).toThrow(
      /Invalid boolean value for update_proposal_votes\.approve/
    );
    expect(() => proposalVotes({ approve: 'TRUE' })).toThrow(/Invalid boolean value/);
    expect(() => proposalVotes({ approve: 2 })).toThrow(/Invalid boolean value/);
    expect(() => proposalVotes({ approve: {} })).toThrow(/Invalid boolean value/);
  });

  it('applies the same rules to the other bool fields sharing the helper', () => {
    const witnessVote = (approve: unknown) =>
      txWith('account_witness_vote', { account: 'alice', witness: 'bob', approve });
    expect(witnessVote('false').equals(witnessVote(false))).toBe(true);
    expect(() => witnessVote('no')).toThrow(/Invalid boolean value for account_witness_vote\.approve/);

    expect(() =>
      txWith('decline_voting_rights', { account: 'alice', decline: 'yes' })
    ).toThrow(/Invalid boolean value for decline_voting_rights\.decline/);

    expect(() =>
      txWith('escrow_approve', {
        from: 'a',
        to: 'b',
        agent: 'c',
        who: 'a',
        escrow_id: 1,
        approve: 'perhaps',
      })
    ).toThrow(/Invalid boolean value for escrow_approve\.approve/);
  });
});

describe('delegate_vesting_shares requires an explicit amount', () => {
  const base = { delegator: 'alice', delegatee: 'bob' };

  it('throws when vesting_shares is missing instead of silently signing a revocation', () => {
    expect(() => txWith('delegate_vesting_shares', base)).toThrow(
      /delegate_vesting_shares\.vesting_shares is required/
    );
  });

  it('throws on a camelCase typo (vestingShares) when the real field is absent', () => {
    expect(() =>
      txWith('delegate_vesting_shares', { ...base, vestingShares: '10.000000 VESTS' })
    ).toThrow(/delegate_vesting_shares\.vesting_shares is required/);
  });

  it('still signs an explicit 0.000000 VESTS revocation (that IS valid input)', () => {
    const revoke = txWith('delegate_vesting_shares', { ...base, vesting_shares: '0.000000 VESTS' });
    expect(revoke.toString('hex')).toBe(
      '614bde71d95f911bf356012805616c69636503626f620000000000000000065645535453000000'
    );
  });
});

describe('extensions reject non-empty sets instead of silently dropping them', () => {
  const proposal = {
    creator: 'alice',
    receiver: 'bob',
    start_date: '2016-03-23T22:41:21',
    end_date: '2016-03-30T22:41:21',
    daily_pay: '10.000 SBD',
    subject: 's',
    permlink: 'p',
  };

  it('throws when the caller passes a non-empty extensions array', () => {
    expect(() => txWith('create_proposal', { ...proposal, extensions: [[0, {}]] })).toThrow(
      /Unsupported non-empty extensions/
    );
    expect(() =>
      txWith('update_proposal_votes', {
        voter: 'alice',
        proposal_ids: [1],
        approve: true,
        extensions: [[0, {}]],
      })
    ).toThrow(/Unsupported non-empty extensions/);
  });

  it('serializes absent and empty extensions identically (unchanged)', () => {
    const absent = txWith('create_proposal', proposal);
    const empty = txWith('create_proposal', { ...proposal, extensions: [] });
    expect(absent.equals(empty)).toBe(true);
  });
});

describe('uint64 array and time field nits', () => {
  it('validates holes in a sparse proposal_ids array instead of falling through to ByteBuffer', () => {
    // eslint-disable-next-line no-sparse-arrays
    const sparse = [1, , 2] as unknown[];
    expect(() =>
      txWith('update_proposal_votes', { voter: 'alice', proposal_ids: sparse, approve: true })
    ).toThrow(/Invalid uint64 array element/);
  });

  it('throws a field-level error for an unparseable create_proposal date', () => {
    expect(() =>
      txWith('create_proposal', {
        creator: 'alice',
        receiver: 'bob',
        start_date: 'not-a-date',
        end_date: '2016-03-30T22:41:21',
        daily_pay: '10.000 SBD',
        subject: 's',
        permlink: 'p',
      })
    ).toThrow(/Invalid time value for create_proposal\.start_date: "not-a-date"/);
  });

  it('freezes both operation-type constants', () => {
    expect(Object.isFrozen(OPERATION_TYPE_INDEX)).toBe(true);
    expect(Object.isFrozen(UNSERIALIZED_OPERATION_TYPES)).toBe(true);
  });
});
