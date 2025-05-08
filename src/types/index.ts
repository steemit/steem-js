export interface SteemConfig {
  addressPrefix: string;
  chainId: string;
  node?: string;
  nodes?: string[];
}

export interface Account {
  id: number;
  name: string;
  owner: Authority;
  active: Authority;
  posting: Authority;
  memo_key: string;
  json_metadata: string;
  proxy: string;
  last_owner_update: string;
  last_account_update: string;
  created: string;
  mined: boolean;
  recovery_account: string;
  reset_account: string;
  last_account_recovery: string;
  comment_count: number;
  lifetime_vote_count: number;
  post_count: number;
  can_vote: boolean;
  voting_power: number;
  last_vote_time: string;
  balance: string;
  savings_balance: string;
  sbd_balance: string;
  sbd_seconds: string;
  sbd_seconds_last_update: string;
  sbd_last_interest_payment: string;
  savings_sbd_balance: string;
  savings_sbd_seconds: string;
  savings_sbd_seconds_last_update: string;
  savings_sbd_last_interest_payment: string;
  savings_withdraw_requests: number;
  reward_sbd_balance: string;
  reward_steem_balance: string;
  reward_vesting_balance: string;
  reward_vesting_steem: string;
  vesting_shares: string;
  delegated_vesting_shares: string;
  received_vesting_shares: string;
  vesting_withdraw_rate: string;
  next_vesting_withdrawal: string;
  withdrawn: string;
  to_withdraw: string;
  withdraw_routes: number;
  curation_rewards: string;
  posting_rewards: string;
  proxied_vsf_votes: number[];
  witnesses_produced: number;
  last_post: string;
  last_root_post: string;
  average_bandwidth: string;
  lifetime_bandwidth: string;
  last_bandwidth_update: string;
  average_market_bandwidth: string;
  lifetime_market_bandwidth: string;
  last_market_bandwidth_update: string;
  vesting_balance: string;
  reputation: string;
  transfer_history: any[];
  market_history: any[];
  post_history: any[];
  vote_history: any[];
  other_history: any[];
  witness_votes: string[];
  tags_usage: any[];
  guest_bloggers: any[];
  blog_category: any;
}

export interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

export interface Transaction {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  operations: Operation[];
  extensions: any[];
  signatures?: string[];
}

export interface SignedTransaction extends Transaction {
  signatures: string[];
}

export interface TransferOperation {
  0: 'transfer';
  1: {
    from: string;
    to: string;
    amount: string;
    memo: string;
  };
}

export interface VoteOperation {
  0: 'vote';
  1: {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
  };
}

export interface CommentOperation {
  0: 'comment';
  1: {
    parent_author: string;
    parent_permlink: string;
    author: string;
    permlink: string;
    title: string;
    body: string;
    json_metadata: string;
  };
}

export interface CustomJsonOperation {
  0: 'custom_json';
  1: {
    required_auths: string[];
    required_posting_auths: string[];
    id: string;
    json: string;
  };
}

export type Operation = 
  | TransferOperation
  | VoteOperation
  | CommentOperation
  | CustomJsonOperation; 