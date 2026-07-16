/**
 * Protocol type definitions for Steem RPC return values.
 *
 * These interfaces mirror the C++ node's condenser_api / database_api /
 * follow_api FC_REFLECT serialization structs and are cross-checked against
 * the dsteem TypeScript implementation. Field order follows JSON
 * serialization order. C++ prototype types are noted in comments:
 *   - time_point_sec / account_name_type / signature_type → string
 *   - fc::object_id (account_id_type, comment_id_type, etc.) → number
 *   - hash id types (block_id_type, transaction_id_type, etc.) → string
 *   - legacy_asset → string literal e.g. "1.000 STEEM" (condenser form)
 *   - share_type (fc::safe<int64_t>) → number | string (may exceed safe int)
 *   - uint128_t → string
 *   - flat_map<K,V> → array of [K, V] tuples
 *
 * Source of truth:
 *   steem/libraries/plugins/apis/condenser_api/include/steem/plugins/condenser_api/condenser_api.hpp
 */

import type { Authority, Transaction } from '../types';

// ============================================================================
// Shared / foundational types
// ============================================================================

/** steem::chain::util::manabar */
export interface Manabar {
  current_mana: number | string; // int64_t
  last_update_time: number; // uint32_t (seconds since epoch)
}

/** steem::protocol::beneficiary_route_type */
export interface BeneficiaryRoute {
  account: string; // account_name_type
  weight: number; // uint16_t
}

/**
 * steem::plugins::follow::api_follow_object (follow_api).
 * Returned by condenser_api.get_followers / get_following.
 */
export interface FollowApiObject {
  follower: string; // account_name_type
  following: string; // account_name_type
  /** Follow type tags: "blog", "ignore", or empty. */
  what: string[];
}

/** Vote entry inside Discussion.active_votes (steem::plugins::tags::vote_state). */
export interface ActiveVote {
  voter: string; // account_name_type
  percent: number; // int16_t
  reputation: number | string; // share_type
  rshares: number; // int64_t
  time: string; // time_point_sec
  weight: number; // uint64_t
}

/**
 * steem::plugins::condenser_api::api_operation_object.
 * The value element of get_account_history entries.
 */
export interface AppliedOperation {
  trx_id: string; // transaction_id_type
  block: number; // uint32_t
  trx_in_block: number; // uint32_t
  op_in_trx: number; // uint32_t
  virtual_op: number; // uint32_t
  timestamp: string; // time_point_sec
  /** [operation_name, operation_body] static_variant. */
  op: [string, unknown];
}

/**
 * condenser_api.get_account_history returns a map<uint32_t, api_operation_object>
 * serialized as an array of [index, operation] tuples.
 */
export type AccountHistoryEntry = [number, AppliedOperation];

// ============================================================================
// Account — condenser_api::extended_account (extends api_account_object)
// ============================================================================

/**
 * condenser_api::extended_account. Returned by get_accounts /
 * get_account_references. Fields common to api_account_object come first,
 * then the extended_account additions.
 *
 * Note: the *_history / comments / blog / feed / recent_replies fields are
 * lazily populated by specific RPC calls and are absent from get_accounts.
 */
export interface ExtendedAccount {
  // --- api_account_object base fields ---
  id: number; // account_id_type
  name: string; // account_name_type
  owner: Authority;
  active: Authority;
  posting: Authority;
  memo_key: string; // public_key_type
  json_metadata: string;
  posting_json_metadata: string;
  proxy: string; // account_name_type
  last_owner_update: string; // time_point_sec
  last_account_update: string; // time_point_sec
  created: string; // time_point_sec
  mined: boolean;
  recovery_account: string; // account_name_type
  last_account_recovery: string; // time_point_sec
  reset_account: string; // account_name_type
  comment_count: number; // uint32_t
  lifetime_vote_count: number; // uint32_t
  post_count: number; // uint32_t
  can_vote: boolean;
  voting_manabar: Manabar;
  downvote_manabar: Manabar;
  voting_power: number; // uint16_t
  balance: string; // legacy_asset
  savings_balance: string; // legacy_asset
  sbd_balance: string; // legacy_asset
  sbd_seconds: string; // uint128_t
  sbd_seconds_last_update: string; // time_point_sec
  sbd_last_interest_payment: string; // time_point_sec
  savings_sbd_balance: string; // legacy_asset
  savings_sbd_seconds: string; // uint128_t
  savings_sbd_seconds_last_update: string; // time_point_sec
  savings_sbd_last_interest_payment: string; // time_point_sec
  savings_withdraw_requests: number; // uint8_t
  reward_sbd_balance: string; // legacy_asset
  reward_steem_balance: string; // legacy_asset
  reward_vesting_balance: string; // legacy_asset
  reward_vesting_steem: string; // legacy_asset
  vesting_shares: string; // legacy_asset
  delegated_vesting_shares: string; // legacy_asset
  received_vesting_shares: string; // legacy_asset
  vesting_withdraw_rate: string; // legacy_asset
  next_vesting_withdrawal: string; // time_point_sec
  withdrawn: number | string; // share_type
  to_withdraw: number | string; // share_type
  withdraw_routes: number; // uint16_t
  curation_rewards: number | string; // share_type
  posting_rewards: number | string; // share_type
  proxied_vsf_votes: (number | string)[]; // vector<share_type>
  witnesses_voted_for: number; // uint16_t
  last_post: string; // time_point_sec
  last_root_post: string; // time_point_sec
  last_vote_time: string; // time_point_sec
  post_bandwidth: number; // uint32_t
  pending_claimed_accounts: number | string; // share_type

  // --- extended_account additions (lazily populated) ---
  vesting_balance: string; // legacy_asset
  reputation: number | string; // share_type
  transfer_history: unknown[]; // map<uint64_t, api_operation_object>
  market_history: unknown[]; // map<uint64_t, api_operation_object>
  post_history: unknown[]; // map<uint64_t, api_operation_object>
  vote_history: unknown[]; // map<uint64_t, api_operation_object>
  other_history: unknown[]; // map<uint64_t, api_operation_object>
  witness_votes: string[]; // set<account_name_type>
  tags_usage: unknown[]; // vector<tags::tag_count_object>
  guest_bloggers: unknown[]; // vector<follow::reblog_count>
  open_orders?: unknown[]; // optional<map<uint32_t, api_limit_order_object>>
  comments?: unknown[]; // optional<vector<string>> permlinks
  blog?: unknown[]; // optional<vector<string>> permlinks
  feed?: unknown[]; // optional<vector<string>> permlinks
  recent_replies?: unknown[]; // optional<vector<string>> permlinks
  recommended?: unknown[]; // optional<vector<string>> permlinks
}

// ============================================================================
// Dynamic global properties — database_api / condenser_api
// extended_dynamic_global_properties
// ============================================================================

/**
 * extended_dynamic_global_properties.
 * Returned by get_dynamic_global_properties.
 */
export interface DynamicGlobalProperties {
  id: number;
  head_block_number: number; // uint32_t
  head_block_id: string; // block_id_type
  time: string; // time_point_sec
  current_witness: string; // account_name_type
  total_pow: number; // uint64_t
  num_pow_witnesses: number; // uint32_t
  virtual_supply: string; // legacy_asset
  current_supply: string; // legacy_asset
  confidential_supply: string; // legacy_asset
  init_sbd_supply: string; // legacy_asset
  current_sbd_supply: string; // legacy_asset
  confidential_sbd_supply: string; // legacy_asset
  total_vesting_fund_steem: string; // legacy_asset
  total_vesting_shares: string; // legacy_asset
  total_reward_fund_steem: string; // legacy_asset
  total_reward_shares2: string; // uint128_t
  pending_rewarded_vesting_shares: string; // legacy_asset
  pending_rewarded_vesting_steem: string; // legacy_asset
  sbd_interest_rate: number; // uint16_t
  sbd_print_rate: number; // uint16_t
  maximum_block_size: number; // uint32_t
  required_actions_partition_percent: number; // uint16_t
  current_aslot: number; // uint64_t
  recent_slots_filled: string; // uint128_t
  participation_count: number; // uint8_t
  last_irreversible_block_num: number; // uint32_t
  vote_power_reserve_rate: number; // uint32_t
  delegation_return_period: number; // uint32_t
  reverse_auction_seconds: number; // uint64_t
  available_account_subsidies: number; // int64_t
  sbd_stop_percent: number; // uint16_t
  sbd_start_percent: number; // uint16_t
  next_maintenance_time: string; // time_point_sec
  last_budget_time: string; // time_point_sec
  content_reward_percent: number; // uint16_t
  vesting_reward_percent: number; // uint16_t
  sps_fund_percent: number; // uint16_t
  sps_interval_ledger: string; // legacy_asset
  downvote_pool_percent: number; // uint16_t
}

// ============================================================================
// Content — condenser_api::discussion (extends api_comment_object)
// ============================================================================

/**
 * condenser_api::discussion. Returned by get_content.
 * Includes api_comment_object base fields + discussion additions.
 */
export interface Discussion {
  // --- api_comment_object base fields ---
  id: number; // comment_id_type
  author: string; // account_name_type
  permlink: string;
  category: string;
  parent_author: string; // account_name_type
  parent_permlink: string;
  title: string;
  body: string;
  json_metadata: string;
  last_update: string; // time_point_sec
  created: string; // time_point_sec
  active: string; // time_point_sec
  last_payout: string; // time_point_sec
  depth: number; // uint8_t
  children: number; // uint32_t
  net_rshares: number | string; // share_type
  abs_rshares: number | string; // share_type
  vote_rshares: number | string; // share_type
  children_abs_rshares: number | string; // share_type
  cashout_time: string; // time_point_sec
  max_cashout_time: string; // time_point_sec
  total_vote_weight: number; // uint64_t
  reward_weight: number; // uint16_t
  total_payout_value: string; // legacy_asset
  curator_payout_value: string; // legacy_asset
  author_rewards: number | string; // share_type
  net_votes: number; // int32_t
  root_author: string; // account_name_type
  root_permlink: string;
  max_accepted_payout: string; // legacy_asset
  percent_steem_dollars: number; // uint16_t
  allow_replies: boolean;
  allow_votes: boolean;
  allow_curation_rewards: boolean;
  beneficiaries: BeneficiaryRoute[];

  // --- discussion additions ---
  url: string;
  root_title: string;
  pending_payout_value: string; // legacy_asset
  total_pending_payout_value: string; // legacy_asset
  active_votes: ActiveVote[];
  replies: string[]; // author/permlink references
  author_reputation: number | string; // share_type
  promoted: string; // legacy_asset
  body_length: number; // uint32_t
  reblogged_by: string[]; // vector<account_name_type>
  first_reblogged_by?: string; // optional<account_name_type>
  first_reblogged_on?: string; // optional<time_point_sec>
}

// ============================================================================
// Block — condenser_api::legacy_signed_block
// ============================================================================

/**
 * condenser_api::legacy_signed_block (BlockHeader → SignedBlockHeader →
 * SignedBlock merged). Returned by get_block.
 */
export interface SignedBlock {
  // --- block_header fields ---
  previous: string; // block_id_type
  timestamp: string; // time_point_sec
  witness: string;
  transaction_merkle_root: string; // checksum_type
  extensions: unknown[]; // block_header_extensions_type

  // --- signed_block_header fields ---
  witness_signature: string; // signature_type

  // --- signed_block fields ---
  block_id: string; // block_id_type
  signing_key: string; // public_key_type
  transaction_ids: string[]; // vector<transaction_id_type>
  /**
   * Transactions in this block. NOTE: this reuses the broadcast-input
   * `Transaction` type, which omits the `transaction_id` / `block_num` /
   * `transaction_num` annotation fields that condenser's
   * legacy_signed_transaction includes on every block transaction. A
   * dedicated annotated-output transaction type should replace this in a
   * follow-up (see PR #542 review).
   */
  transactions: Transaction[];
}
