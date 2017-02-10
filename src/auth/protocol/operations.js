const types = require('./types');
const SerializerImpl = require('./serializer');

const uint8 = types.uint8,
  uint16 = types.uint16,
  uint32 = types.uint32,
  int16 = types.int16,
  int64 = types.int64,
  uint64 = types.uint64,
  string = types.string,
  string_binary = types.string_binary,
  bytes = types.bytes,
  bool = types.bool,
  array = types.array,
  fixed_array = types.fixed_array,
  protocol_id_type = types.protocol_id_type,
  object_id_type = types.object_id_type,
  vote_id = types.vote_id,
  future_extensions = types.void,
  static_variant = types.static_variant,
  public_key = types.public_key,
  address = types.address,
  time_point_sec = types.time_point_sec,
  optional = types.optional,
  asset = types.asset,
  set = types.set,
  map = types.map;

/*
 When updating generated code
 Replace:  const operation = static_variant([
 with:   operation.st_operations = [
 Devare (these are custom types instead):
 const public_key = new Serializer(
 'public_key',
 {key_data: bytes(33)}
 );
 const asset = new Serializer(
 'asset',
 {amount: int64,
 symbol: uint64}
 );
 */

const operation = static_variant();
module.exports = { operation };

// For module.exports
const Serializer = (operation_name, serilization_types_object) => {
  const s = new SerializerImpl(operation_name, serilization_types_object);
  return module.exports[operation_name] = s;
};

// Custom-types after Generated code

// ##  Generated code follows
// # npm i -g decaffeinate
// # ./js_operation_serializer | decaffeinate > tmp.js
// ## -------------------------------
const signed_transaction = new Serializer(
  'signed_transaction',
  {
    ref_block_num: uint16,
    ref_block_prefix: uint32,
    expiration: time_point_sec,
    operations: array(operation),
    extensions: set(future_extensions),
    signatures: array(bytes(65)),
  }
);

const signed_block = new Serializer(
  'signed_block',
  {
    previous: bytes(20),
    timestamp: time_point_sec,
    witness: string,
    transaction_merkle_root: bytes(20),
    extensions: set(future_extensions),
    witness_signature: bytes(65),
    transactions: array(signed_transaction),
  }
);

const block_header = new Serializer(
  'block_header',
  {
    previous: bytes(20),
    timestamp: time_point_sec,
    witness: string,
    transaction_merkle_root: bytes(20),
    extensions: set(future_extensions),
  }
);

const signed_block_header = new Serializer(
  'signed_block_header',
  {
    previous: bytes(20),
    timestamp: time_point_sec,
    witness: string,
    transaction_merkle_root: bytes(20),
    extensions: set(future_extensions),
    witness_signature: bytes(65),
  }
);

const vote = new Serializer(
  'vote',
  {
    voter: string,
    author: string,
    permlink: string,
    weight: int16
  }
);

const comment = new Serializer(
  'comment',
  {
    parent_author: string,
    parent_permlink: string,
    author: string,
    permlink: string,
    title: string,
    body: string,
    json_metadata: string,
  }
);

const transfer = new Serializer(
  'transfer',
  {
    from: string,
    to: string,
    amount: asset,
    memo: string
  }
);

const transfer_to_vesting = new Serializer(
  'transfer_to_vesting',
  {
    from: string,
    to: string,
    amount: asset,
  }
);

const withdraw_vesting = new Serializer(
  'withdraw_vesting',
  {
    account: string,
    vesting_shares: asset,
  }
);

const limit_order_create = new Serializer(
  'limit_order_create',
  {
    owner: string,
    orderid: uint32,
    amount_to_sell: asset,
    min_to_receive: asset,
    fill_or_kill: bool,
    expiration: time_point_sec,
  }
);

const limit_order_cancel = new Serializer(
  'limit_order_cancel',
  {
    owner: string,
    orderid: uint32,
  }
);

const price = new Serializer(
  'price',
  {
    base: asset,
    quote: asset,
  }
);

const feed_publish = new Serializer(
  'feed_publish',
  {
    publisher: string,
    exchange_rate: price,
  }
);

const convert = new Serializer(
  'convert',
  {
    owner: string,
    requestid: uint32,
    amount: asset,
  }
);

const authority = new Serializer(
  'authority',
  {
    weight_threshold: uint32,
    account_auths: map((string), (uint16)),
    key_auths: map((public_key), (uint16)),
  }
);

const account_create = new Serializer(
  'account_create',
  {
    fee: asset,
    creator: string,
    new_account_name: string,
    owner: authority,
    active: authority,
    posting: authority,
    memo_key: public_key,
    json_metadata: string,
  }
);

const account_update = new Serializer(
  'account_update',
  {
    account: string,
    owner: optional(authority),
    active: optional(authority),
    posting: optional(authority),
    memo_key: public_key,
    json_metadata: string,
  }
);

const chain_properties = new Serializer(
  'chain_properties',
  {
    account_creation_fee: asset,
    maximum_block_size: uint32,
    sbd_interest_rate: uint16,
  }
);

const witness_update = new Serializer(
  'witness_update',
  {
    owner: string,
    url: string,
    block_signing_key: public_key,
    props: chain_properties,
    fee: asset,
  }
);

const account_witness_vote = new Serializer(
  'account_witness_vote',
  {
    account: string,
    witness: string,
    approve: bool,
  }
);

const account_witness_proxy = new Serializer(
  'account_witness_proxy',
  {
    account: string,
    proxy: string,
  }
);

const pow = new Serializer(
  'pow',
  {
    worker: public_key,
    input: bytes(32),
    signature: bytes(65),
    work: bytes(32),
  }
);

const custom = new Serializer(
  'custom',
  {
    required_auths: set(string),
    id: uint16,
    data: bytes()
  }
);

const report_over_production = new Serializer(
  'report_over_production',
  {
    reporter: string,
    first_block: signed_block_header,
    second_block: signed_block_header,
  }
);

const devare_comment = new Serializer(
  'devare_comment',
  {
    author: string,
    permlink: string,
  }
);

const custom_json = new Serializer(
  'custom_json',
  {
    required_auths: set(string),
    required_posting_auths: set(string),
    id: string,
    json: string,
  }
);

const comment_options = new Serializer(
  'comment_options',
  {
    author: string,
    permlink: string,
    max_accepted_payout: asset,
    percent_steem_dollars: uint16,
    allow_votes: bool,
    allow_curation_rewards: bool,
    extensions: set(future_extensions),
  }
);

const set_withdraw_vesting_route = new Serializer(
  'set_withdraw_vesting_route',
  {
    from_account: string,
    to_account: string,
    percent: uint16,
    auto_vest: bool,
  }
);

const limit_order_create2 = new Serializer(
  'limit_order_create2',
  {
    owner: string,
    orderid: uint32,
    amount_to_sell: asset,
    exchange_rate: price,
    fill_or_kill: bool,
    expiration: time_point_sec,
  }
);

const challenge_authority = new Serializer(
  'challenge_authority',
  {
    challenger: string,
    challenged: string,
    require_owner: bool,
  }
);

const prove_authority = new Serializer(
  'prove_authority',
  {
    challenged: string,
    require_owner: bool,
  }
);

const request_account_recovery = new Serializer(
  'request_account_recovery',
  {
    recovery_account: string,
    account_to_recover: string,
    new_owner_authority: authority,
    extensions: set(future_extensions),
  }
);

const recover_account = new Serializer(
  'recover_account',
  {
    account_to_recover: string,
    new_owner_authority: authority,
    recent_owner_authority: authority,
    extensions: set(future_extensions),
  }
);

const change_recovery_account = new Serializer(
  'change_recovery_account',
  {
    account_to_recover: string,
    new_recovery_account: string,
    extensions: set(future_extensions),
  }
);

const escrow_transfer = new Serializer('escrow_transfer', {
  from: string,
  to: string,
  agent: string,
  escrow_id: uint32,
  sbd_amount: asset,
  steem_amount: asset,
  fee: asset,
  ratification_deadline: time_point_sec,
  escrow_expiration: time_point_sec,
  json_meta: string,
});

const escrow_approve = new Serializer('escrow_approve', {
  from: string,
  to: string,
  agent: string,
  who: string,
  escrow_id: uint32,
  approve: bool,
});

const escrow_dispute = new Serializer('escrow_dispute', {
  from: string,
  to: string,
  agent: string,
  who: string,
  escrow_id: uint32,
});

const escrow_release = new Serializer('escrow_release', {
  from: string,
  to: string,
  agent: string,
  who: string,
  receiver: string,
  escrow_id: uint32,
  sbd_amount: asset,
  steem_amount: asset,
});

const fill_convert_request = new Serializer(
  'fill_convert_request',
  {
    owner: string,
    requestid: uint32,
    amount_in: asset,
    amount_out: asset,
  }
);

const comment_reward = new Serializer(
  'comment_reward',
  {
    author: string,
    permlink: string,
    sbd_payout: asset,
    vesting_payout: asset,
  }
);

const curate_reward = new Serializer(
  'curate_reward',
  {
    curator: string,
    reward: asset,
    comment_author: string,
    comment_permlink: string,
  }
);

const liquidity_reward = new Serializer(
  'liquidity_reward',
  {
    owner: string,
    payout: asset
  }
);

const interest = new Serializer(
  'interest',
  {
    owner: string,
    interest: asset,
  }
);

const fill_vesting_withdraw = new Serializer(
  'fill_vesting_withdraw',
  {
    from_account: string,
    to_account: string,
    withdrawn: asset,
    deposited: asset,
  }
);

const fill_order = new Serializer(
  'fill_order',
  {
    current_owner: string,
    current_orderid: uint32,
    current_pays: asset,
    open_owner: string,
    open_orderid: uint32,
    open_pays: asset,
  }
);

const comment_payout = new Serializer(
  'comment_payout',
  {
    author: string,
    permlink: string,
    payout: asset,
  }
);

operation.st_operations = [
  vote,
  comment,
  transfer,
  transfer_to_vesting,
  withdraw_vesting,
  limit_order_create,
  limit_order_cancel,
  feed_publish,
  convert,
  account_create,
  account_update,
  witness_update,
  account_witness_vote,
  account_witness_proxy,
  pow,
  custom,
  report_over_production,
  devare_comment,
  custom_json,
  comment_options,
  set_withdraw_vesting_route,
  limit_order_create2,
  challenge_authority,
  prove_authority,
  request_account_recovery,
  recover_account,
  change_recovery_account,
  escrow_transfer,
  escrow_approve,
  escrow_dispute,
  escrow_release,
  fill_convert_request,
  comment_reward,
  curate_reward,
  liquidity_reward,
  interest,
  fill_vesting_withdraw,
  fill_order,
  comment_payout,
];

const transaction = new Serializer(
  'transaction',
  {
    ref_block_num: uint16,
    ref_block_prefix: uint32,
    expiration: time_point_sec,
    operations: array(operation),
    extensions: set(future_extensions),
  }
);

//# -------------------------------
//#  Generated code end
//# -------------------------------

// Custom Types

const encrypted_memo = new Serializer(
  'encrypted_memo',
  {
    from: public_key,
    to: public_key,
    nonce: uint64,
    check: uint32,
    encrypted: string_binary,
  }
);
