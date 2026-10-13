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

  it('serializes a missing approve as false for update_proposal_votes (C++ default IS `bool approve = false`)', () => {
    // Scoped to update_proposal_votes: the false default is per-field, not
    // universal — see the "protocol bool defaults" block below.
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

/**
 * The C++ `bool x = ...` default is per-field (steem_operations.hpp /
 * sps_operations.hpp on origin/master). Fields defaulting to `false` keep the
 * missing → false shortcut; fields defaulting to `true` must throw on a
 * missing value, because silently writing 0 would sign the opposite of the
 * protocol default.
 */
describe('bool fields honor the per-field protocol default', () => {
  it('missing account_witness_vote.approve (default true) throws', () => {
    expect(() => txWith('account_witness_vote', { account: 'alice', witness: 'bob' })).toThrow(
      /Missing required boolean field account_witness_vote\.approve/
    );
  });

  it('missing comment_options.allow_votes / allow_curation_rewards (defaults true) throw', () => {
    const base = { author: 'alice', permlink: 'p' };
    expect(() => txWith('comment_options', base)).toThrow(
      /Missing required boolean field comment_options\.allow_votes/
    );
    expect(() => txWith('comment_options', { ...base, allow_votes: true })).toThrow(
      /Missing required boolean field comment_options\.allow_curation_rewards/
    );
  });

  it('missing escrow_approve.approve (default true) throws', () => {
    expect(() =>
      txWith('escrow_approve', { from: 'a', to: 'b', agent: 'c', who: 'a', escrow_id: 1 })
    ).toThrow(/Missing required boolean field escrow_approve\.approve/);
  });

  it('missing decline_voting_rights.decline (default true) throws', () => {
    expect(() => txWith('decline_voting_rights', { account: 'alice' })).toThrow(
      /Missing required boolean field decline_voting_rights\.decline/
    );
  });

  it('missing fill_or_kill / auto_vest (defaults false) still serialize as 0', () => {
    const order = {
      owner: 'alice',
      orderid: 1,
      amount_to_sell: '1.000 STEEM',
      min_to_receive: '1.000 SBD',
      expiration: '2016-03-30T22:41:21',
    };
    expect(txWith('limit_order_create', order).equals(txWith('limit_order_create', { ...order, fill_or_kill: false }))).toBe(
      true
    );
    const order2 = { ...order, exchange_rate: { base: '1.000 STEEM', quote: '1.000 SBD' } };
    expect(
      txWith('limit_order_create2', order2).equals(txWith('limit_order_create2', { ...order2, fill_or_kill: false }))
    ).toBe(true);

    const route = { from_account: 'alice', to_account: 'bob', percent: 100 };
    expect(
      txWith('set_withdraw_vesting_route', route).equals(
        txWith('set_withdraw_vesting_route', { ...route, auto_vest: false })
      )
    ).toBe(true);
  });
});

describe('delegate_vesting_shares requires an explicit amount', () => {
  const base = { delegator: 'alice', delegatee: 'bob' };

  it('throws when vesting_shares is missing instead of silently signing a revocation', () => {
    expect(() => txWith('delegate_vesting_shares', base)).toThrow(
      /delegate_vesting_shares\.vesting_shares is required/
    );
    expect(() => txWith('delegate_vesting_shares', { ...base, vesting_shares: '' })).toThrow(
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

  it('rejects malformed amounts that serializeAsset would degrade to a revocation', () => {
    // 'abc.000000 VESTS' → parseInt is NaN → || 0 → byte-identical to a full revoke.
    // ('' throws earlier, via the required-field check.)
    for (const bad of ['abc.000000 VESTS', '1.000000 STEEM', 10, '1.00000 VESTS', '-1.000000 VESTS']) {
      expect(() => txWith('delegate_vesting_shares', { ...base, vesting_shares: bad })).toThrow(
        /Invalid delegate_vesting_shares\.vesting_shares/
      );
    }
  });

  it('rejects a decimal-less amount (would serialize at precision 0, off by 10^6)', () => {
    expect(() => txWith('delegate_vesting_shares', { ...base, vesting_shares: '10 VESTS' })).toThrow(
      /Invalid delegate_vesting_shares\.vesting_shares/
    );
  });

  it('still serializes a normal amount', () => {
    const delegate = txWith('delegate_vesting_shares', { ...base, vesting_shares: '10.000000 VESTS' });
    expect(delegate.toString('hex')).toBe(
      '614bde71d95f911bf356012805616c69636503626f628096980000000000065645535453000000'
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

describe('serializeAsset rejects malformed and out-of-range amounts (global helper)', () => {
  const transfer = (amount: unknown) =>
    txWith('transfer', { from: 'alice', to: 'bob', amount, memo: '' });

  it('throws on a non-numeric amount instead of silently signing a zero amount', () => {
    // Previously 'abc.000 STEEM' → parseInt NaN → || 0 → byte-identical to '0.000 STEEM'.
    expect(() => transfer('abc.000 STEEM')).toThrow(/Invalid asset amount/);
    expect(() => transfer('abc.000000 VESTS')).toThrow(/Invalid asset amount/);
  });

  it('throws on amounts that parseInt would partially consume', () => {
    for (const bad of ['1.2.3 STEEM', '1..000 STEEM', '.000 STEEM', '1e3 STEEM', '0x10 STEEM', '1.0a0 STEEM']) {
      expect(() => transfer(bad)).toThrow(/Invalid asset amount/);
    }
  });

  it('throws on a decimal-less amount (would serialize at precision 0, off by 10^3)', () => {
    expect(() => transfer('10 STEEM')).toThrow(/Invalid asset amount/);
  });

  it('throws when the amount exceeds the int64 range instead of being clamped by writeInt64', () => {
    // '99999999999999999.000000 VESTS' ≈ 1e23 base units > int64 max (≈ 9.2e18);
    // previously signed as ff…ff7f (9223372036854775807) via writeInt64 clamping.
    expect(() => transfer('99999999999999999.000000 VESTS')).toThrow(/exceeds int64 range/);
    // Just past the exact boundary: 9223372036854775808 base units.
    expect(() => transfer('9223372036854775.808 STEEM')).toThrow(/exceeds int64 range/);
  });

  it('still serializes the exact int64 boundaries', () => {
    // int64 max = 9223372036854775807 base units; the 8-byte little-endian
    // int64 sits right after the from/to strings (offset 22 in this fixture).
    const max = transfer('9223372036854775.807 STEEM');
    expect(max.subarray(22, 30).toString('hex')).toBe('ffffffffffffff7f');
    expect(transfer('0.000 STEEM').subarray(22, 30).toString('hex')).toBe('0000000000000000');
  });

  it('keeps exact precision above 2^53 (no float rounding)', () => {
    // 9007199254740.993 STEEM = 9007199254740993 base units = 2^53 + 1.
    const tx = transfer('9007199254740.993 STEEM');
    expect(tx.subarray(22, 30).toString('hex')).toBe('0100000000002000');
  });

  it('still serializes normal amounts unchanged', () => {
    expect(transfer('1.234 STEEM').equals(transfer('1.234 STEEM'))).toBe(true);
    // Byte-level golden value: transfer 1.234 STEEM alice → bob.
    expect(transfer('1.234 STEEM').toString('hex')).toBe(
      '614bde71d95f911bf356010205616c69636503626f62d20400000000000003535445454d00000000'
    );
  });
});

describe('comment_options rejects unsupported extension tags', () => {
  const base = {
    author: 'alice',
    permlink: 'p',
    max_accepted_payout: '1000000.000 SBD',
    percent_steem_dollars: 10000,
    allow_votes: true,
    allow_curation_rewards: true,
  };

  it('throws on a non-tag-0 extension instead of silently dropping it', () => {
    expect(() => txWith('comment_options', { ...base, extensions: [[1, { foo: 'bar' }]] })).toThrow(
      /Unsupported comment_options extension: only tag 0/
    );
    // Mixed sets throw too — the tag-0 entry must not lull the check.
    expect(() =>
      txWith('comment_options', {
        ...base,
        extensions: [[0, { beneficiaries: [{ account: 'bob', weight: 1000 }] }], [1, {}]],
      })
    ).toThrow(/Unsupported comment_options extension/);
    // A malformed (non-pair) entry throws instead of being filtered out.
    expect(() => txWith('comment_options', { ...base, extensions: ['nonsense'] })).toThrow(
      /Unsupported comment_options extension/
    );
  });

  it('still serializes tag 0 (comment_payout_beneficiaries)', () => {
    const tx = txWith('comment_options', {
      ...base,
      extensions: [[0, { beneficiaries: [{ account: 'bob', weight: 1000 }] }]],
    });
    expect(tx.length).toBeGreaterThan(0);
  });
});

describe('time_point_sec fields reject missing, mistyped, and out-of-range values', () => {
  const proposal = {
    creator: 'alice',
    receiver: 'bob',
    start_date: '2016-03-23T22:41:21',
    end_date: '2016-03-30T22:41:21',
    daily_pay: '10.000 SBD',
    subject: 's',
    permlink: 'p',
  };
  const order = {
    owner: 'alice',
    orderid: 1,
    amount_to_sell: '1.000 STEEM',
    min_to_receive: '1.000 SBD',
    fill_or_kill: false,
    expiration: '2016-03-30T22:41:21',
  };

  it('throws when a required time field is missing instead of signing epoch 0', () => {
    const { start_date: _omitted, ...noStart } = proposal;
    expect(() => txWith('create_proposal', noStart)).toThrow(
      /Missing required time field create_proposal\.start_date/
    );
    const { expiration: _omitted2, ...noExpiry } = order;
    expect(() => txWith('limit_order_create', noExpiry)).toThrow(
      /Missing required time field limit_order_create\.expiration/
    );
    expect(() => txWith('create_proposal', { ...proposal, start_date: null })).toThrow(
      /Missing required time field create_proposal\.start_date/
    );
  });

  it('throws on wrong-typed values (object, boolean, array)', () => {
    for (const bad of [{}, true, []] as unknown[]) {
      expect(() => txWith('create_proposal', { ...proposal, start_date: bad })).toThrow(
        /Invalid time value for create_proposal\.start_date/
      );
    }
  });

  it('throws on values outside the uint32 seconds range instead of wrapping', () => {
    expect(() => txWith('create_proposal', { ...proposal, start_date: -1 })).toThrow(
      /outside the uint32 seconds range/
    );
    expect(() => txWith('create_proposal', { ...proposal, start_date: 0x100000000 })).toThrow(
      /outside the uint32 seconds range/
    );
  });

  it('still accepts ISO strings, Date objects, and seconds numbers', () => {
    const asString = txWith('limit_order_create', order);
    const asNumber = txWith('limit_order_create', { ...order, expiration: 1459377681 });
    const asDate = txWith('limit_order_create', { ...order, expiration: new Date('2016-03-30T22:41:21Z') });
    expect(asNumber.equals(asString)).toBe(true);
    expect(asDate.equals(asString)).toBe(true);
  });
});

describe('audit follow-ups: asset string shape, symbol, and call-site defaults', () => {
  const transfer = (amount: unknown) =>
    txWith('transfer', { from: 'alice', to: 'bob', amount, memo: '' });

  it('throws on amounts that would previously degrade to a signed zero payload', () => {
    // Each of these previously serialized byte-identical to '0.000 STEEM':
    // a leading/trailing/double space or empty value hit the `parts[0] || '0.000'`
    // fallback inside serializeAsset, and '' / ' ' / 0 / NaN hit the call-site
    // `String(x || '0.000 STEEM')` default.
    for (const bad of [' 1.000 STEEM', '1.000 STEEM ', '1.000  STEEM', '', ' ', 0, NaN]) {
      expect(() => transfer(bad)).toThrow(/Invalid asset amount/);
    }
  });

  it('throws on a symbol-less amount instead of silently defaulting to STEEM', () => {
    expect(() => transfer('1.000')).toThrow(/Invalid asset amount/);
  });

  it('throws when extra segments are present instead of ignoring them', () => {
    expect(() => transfer('1.000 STEEM EXTRA')).toThrow(/Invalid asset amount/);
  });

  it('throws on negative amounts (the chain rejects amount < 0)', () => {
    expect(() => transfer('-1.000 STEEM')).toThrow(/negative amounts cannot be serialized/);
  });

  it('throws on malformed symbols: case, charset, and the 6-byte layout limit', () => {
    // C++ asset_symbol_type layout is [decimals][<=6 symbol bytes][NUL]: a
    // 7th character lands in the NUL slot (chain-rejected bytes) and an 8th
    // would shift every following field of the byte stream.
    for (const bad of ['1.000 steem', '1.000 St3em', '1.000 STEEMX1', '1.000 STEEMX12', '1.000 $$']) {
      expect(() => transfer(bad)).toThrow(/Invalid asset symbol/);
    }
    expect(() => transfer('1.000 VESTS')).not.toThrow();
  });

  it('undefined/null amount fields still take the protocol-default zero asset', () => {
    const asUndefined = txWith('transfer', { from: 'alice', to: 'bob', memo: '' });
    const asNull = txWith('transfer', { from: 'alice', to: 'bob', amount: null, memo: '' });
    expect(asUndefined.equals(asNull)).toBe(true);
    // amount int64 sits at offset 22 in this fixture (10B header + ops varint
    // + op id + 'alice' + 'bob').
    expect(asUndefined.subarray(22, 30).toString('hex')).toBe('0000000000000000');
  });
});

describe('audit follow-ups: extensions shape and beneficiaries validation', () => {
  const base = {
    author: 'alice',
    permlink: 'p',
    max_accepted_payout: '1000000.000 SBD',
    percent_steem_dollars: 10000,
    allow_votes: true,
    allow_curation_rewards: true,
  };
  const withExt = (extensions: unknown) => txWith('comment_options', { ...base, extensions });

  it('throws on a non-array extensions value instead of signing an empty set', () => {
    // Previously an extensions object was silently signed as varint(0),
    // dropping every beneficiary it carried.
    expect(() => withExt({ 0: { beneficiaries: [{ account: 'bob', weight: 1000 }] } })).toThrow(
      /Invalid comment_options extensions: expected an array/
    );
    expect(() =>
      txWith('create_proposal', {
        creator: 'a',
        receiver: 'b',
        start_date: '2016-03-23T22:41:21',
        end_date: '2016-03-30T22:41:21',
        daily_pay: '10.000 SBD',
        subject: 's',
        permlink: 'p',
        extensions: { foo: 1 },
      })
    ).toThrow(/Invalid extensions: expected an array/);
    // Absent / empty / null still serialize as the empty set (unchanged).
    expect(() => withExt(undefined)).not.toThrow();
    expect(() => withExt(null)).not.toThrow();
    expect(() => withExt([])).not.toThrow();
  });

  it('beneficiaries: rejects an empty list, a missing account, and bad weights', () => {
    expect(() => withExt([[0, { beneficiaries: [] }]])).toThrow(/non-empty beneficiaries array/);
    expect(() => withExt([[0, {}]])).toThrow(/non-empty beneficiaries array/);
    expect(() => withExt([[0]])).toThrow(/non-empty beneficiaries array/);
    expect(() =>
      withExt([[0, { beneficiaries: [{ weight: 1000 }] }] as never])
    ).toThrow(/Invalid beneficiary account/);
    expect(() => withExt([[0, { beneficiaries: [{ account: '', weight: 1000 }] }]])).toThrow(
      /Invalid beneficiary account/
    );
    // Previously masked through `Number(w) & 0xffff` (65536 -> 0, NaN -> 0)
    // or signed as-is; the chain caps a single weight at STEEM_100_PERCENT.
    for (const bad of [65536, 10001, -1, 1.5, NaN, '1000']) {
      expect(() => withExt([[0, { beneficiaries: [{ account: 'bob', weight: bad }] }]])).toThrow(
        /Invalid beneficiary weight/
      );
    }
    // Boundary values still serialize: 0 and STEEM_100_PERCENT (10000).
    expect(() => withExt([[0, { beneficiaries: [{ account: 'bob', weight: 10000 }] }]])).not.toThrow();
    expect(() => withExt([[0, { beneficiaries: [{ account: 'bob', weight: 0 }] }]])).not.toThrow();
  });

  it('sorts beneficiaries in raw byte order (C++ flat_map ordering), not ICU collation', () => {
    const tx = withExt([
      [0, { beneficiaries: ['a1', 'a-1', 'b'].map((account) => ({ account, weight: 100 })) }],
    ]);
    const hex = tx.toString('hex');
    // vstring-encoded positions: 'a-1' = 03 61 2d 31, 'a1' = 02 61 31, 'b' = 01 62.
    // Byte order: 'a-' (0x2d) < 'a1' (0x31) < 'b'; localeCompare is
    // ICU-collation-dependent and can diverge from this ordering.
    const idxHyphen = hex.indexOf('03612d31');
    const idxA1 = hex.indexOf('026131');
    const idxB = hex.indexOf('0162');
    expect(idxHyphen).toBeGreaterThan(-1);
    expect(idxA1).toBeGreaterThan(idxHyphen);
    expect(idxB).toBeGreaterThan(idxA1);
  });
});

describe('audit follow-ups: time field integer and numeric-string handling', () => {
  const order = {
    owner: 'alice',
    orderid: 1,
    amount_to_sell: '1.000 STEEM',
    min_to_receive: '1.000 SBD',
    fill_or_kill: false,
  };

  it('throws a field-level error on fractional seconds instead of ByteBuffer opaque TypeError', () => {
    expect(() => txWith('limit_order_create', { ...order, expiration: 1760000000.5 })).toThrow(
      /Invalid time value for limit_order_create\.expiration: expected whole seconds/
    );
  });

  it('rejects numeric strings with an explicit hint (ambiguous with ISO dates)', () => {
    expect(() => txWith('limit_order_create', { ...order, expiration: '1760000000' })).toThrow(
      /numeric string is ambiguous/
    );
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
