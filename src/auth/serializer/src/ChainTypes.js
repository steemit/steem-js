var ChainTypes;

module.exports = ChainTypes = {};

ChainTypes.reserved_spaces = {
  relative_protocol_ids: 0,
  protocol_ids: 1,
  implementation_ids: 2
};

ChainTypes.operations= {
    vote: 0,
    comment: 1,
    transfer: 2,
    transfer_to_vesting: 3,
    withdraw_vesting: 4,
    limit_order_create: 5,
    limit_order_cancel: 6,
    feed_publish: 7,
    convert: 8,
    account_create: 9,
    account_update: 10,
    witness_update: 11,
    account_witness_vote: 12,
    account_witness_proxy: 13,
    pow: 14,
    custom: 15,
    report_over_production: 16,
    delete_comment: 17,
    custom_json: 18,
    comment_options: 19,
    set_withdraw_vesting_route: 20,
    limit_order_create2: 21,
    claim_account: 22,
    create_claimed_account: 23,
    request_account_recovery: 24,
    recover_account: 25,
    change_recovery_account: 26,
    escrow_transfer: 27,
    escrow_dispute: 28,
    escrow_release: 29,
    pow2: 30,
    escrow_approve: 31,
    transfer_to_savings: 32,
    transfer_from_savings: 33,
    cancel_transfer_from_savings: 34,
    custom_binary: 35,
    decline_voting_rights: 36,
    reset_account: 37,
    set_reset_account: 38,
    claim_reward_balance: 39,
    delegate_vesting_shares: 40,
    account_create_with_delegation: 41,
    create_proposal: 42,
    update_proposal_votes: 43,
    remove_proposal: 44,
    fill_convert_request: 45,
    author_reward: 46,
    curation_reward: 47,
    comment_reward: 48,
    liquidity_reward: 49,
    interest: 50,
    fill_vesting_withdraw: 51,
    fill_order: 52,
    shutdown_witness: 53,
    fill_transfer_from_savings: 54,
    hardfork: 55,
    comment_payout_update: 56,
    return_vesting_delegation: 57,
    comment_benefactor_reward: 58
};

//types.hpp
ChainTypes.object_type = {
  "null": 0,
  base: 1,
};
