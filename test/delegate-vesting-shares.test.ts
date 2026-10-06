import { describe, it, expect } from 'vitest';
import { signTransaction, toWif, wifToPublic, verifyTransaction } from '../src/auth';
import { serializeTransaction } from '../src/auth/serializer/transaction';

/**
 * Regression tests for operations that the type-index map listed but had no
 * serializer, so signing threw "Operation type <x> serialization not fully
 * implemented" in the browser. Reported symptom: the wallet UI's
 * "Revoke Delegation" button failed for every account.
 *
 * Both delegating and revoking use `delegate_vesting_shares` (revoke is the same
 * operation with 0.000000 VESTS), so one gap broke both directions.
 * create/update/remove_proposal were the other three gaps hit by a wallet UI.
 */
const DELEGATOR = 'alice';
const DELEGATEE = 'bob';
const ACTIVE_WIF = toWif(DELEGATOR, 'correct horse battery staple', 'active');
const ACTIVE_PUBLIC_KEY = wifToPublic(ACTIVE_WIF);

const header = {
  ref_block_num: 19297,
  ref_block_prefix: 1608085982,
  expiration: '2016-03-23T22:41:21',
  extensions: [] as unknown[],
};

type SignedTx = { signatures: string[]; operations: unknown[] };

function headerOnly() {
  return { ...header, operations: [] as unknown[] };
}

describe('delegate_vesting_shares signing', () => {
  it('signs a delegation without throwing', () => {
    const tx = {
      ...headerOnly(),
      operations: [
        ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '10.000000 VESTS' }],
      ],
    };

    const signed = signTransaction(tx, [ACTIVE_WIF]) as SignedTx;

    expect(signed.signatures).toHaveLength(1);
    expect(signed.signatures[0]).toMatch(/^[0-9a-f]{130}$/i);
    expect(verifyTransaction(signed, ACTIVE_PUBLIC_KEY)).toBe(true);
  });

  it('signs a revocation (0.000000 VESTS) — the reported failing case', () => {
    const tx = {
      ...headerOnly(),
      operations: [
        ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '0.000000 VESTS' }],
      ],
    };

    const signed = signTransaction(tx, [ACTIVE_WIF]) as SignedTx;

    expect(signed.signatures).toHaveLength(1);
    expect(verifyTransaction(signed, ACTIVE_PUBLIC_KEY)).toBe(true);
  });

  it('encodes operation type index 40 and distinguishes amount from revoke', () => {
    const delegate = serializeTransaction({
      ...header,
      operations: [
        ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '10.000000 VESTS' }],
      ],
    });
    const revoke = serializeTransaction({
      ...header,
      operations: [
        ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '0.000000 VESTS' }],
      ],
    });

    // Header is 10 bytes: ref_block_num (2) + ref_block_prefix (4) + expiration (4),
    // then varint32 operations count (1), then varint32 operation type (40 = delegate_vesting_shares).
    expect(delegate.readUInt8(10)).toBe(1);
    expect(delegate.readUInt8(11)).toBe(40);
    expect(revoke.readUInt8(11)).toBe(40);
    expect(delegate.equals(revoke)).toBe(false);
    // 10 VESTS and 0 VESTS differ only in the int64 amount field.
    expect(delegate.length).toBe(revoke.length);
  });

  it('matches the golden wire bytes for delegate and revoke', () => {
    const delegate = serializeTransaction({
      ...header,
      operations: [
        ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '10.000000 VESTS' }],
      ],
    });
    const revoke = serializeTransaction({
      ...header,
      operations: [
        ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '0.000000 VESTS' }],
      ],
    });

    expect(delegate.toString('hex')).toBe(
      '614bde71d95f911bf356012805616c69636503626f628096980000000000065645535453000000'
    );
    expect(revoke.toString('hex')).toBe(
      '614bde71d95f911bf356012805616c69636503626f620000000000000000065645535453000000'
    );
  });

  it('is deterministic for an identical transaction', () => {
    const op = ['delegate_vesting_shares', { delegator: DELEGATOR, delegatee: DELEGATEE, vesting_shares: '1.234567 VESTS' }];
    const a = serializeTransaction({ ...header, operations: [op] });
    const b = serializeTransaction({ ...header, operations: [op] });
    expect(a.equals(b)).toBe(true);
  });
});

describe('proposal operation signing', () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    [
      'create_proposal',
      {
        creator: DELEGATOR,
        receiver: DELEGATEE,
        start_date: '2016-03-23T22:41:21',
        end_date: '2016-03-30T22:41:21',
        daily_pay: '10.000 SBD',
        subject: 'Proposal subject',
        permlink: 'proposal-permlink',
      },
    ],
    ['update_proposal_votes', { voter: DELEGATOR, proposal_ids: [1, 42], approve: true }],
    ['remove_proposal', { proposal_owner: DELEGATOR, proposal_ids: [7, 8] }],
  ];

  for (const [opType, data] of cases) {
    it(`signs ${opType} (no extensions field supplied by the caller)`, () => {
      const tx = { ...headerOnly(), operations: [[opType, data]] };
      const signed = signTransaction(tx, [ACTIVE_WIF]) as SignedTx;

      expect(signed.signatures).toHaveLength(1);
      expect(verifyTransaction(signed, ACTIVE_PUBLIC_KEY)).toBe(true);
    });
  }
});
