export default [
    {
      "api": "database_api",
      "method": "set_subscribe_callback",
      "params": ["callback", "clearFilter"]
    },
    {
      "api": "database_api",
      "method": "set_pending_transaction_callback",
      "params": ["cb"]
    },
    {
      "api": "database_api",
      "method": "set_block_applied_callback",
      "params": ["cb"]
    },
    {
      "api": "database_api",
      "method": "cancel_all_subscriptions"
    },
    {
      "api": "database_api",
      "method": "get_trending_tags",
      "params": ["afterTag", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_tags_used_by_author",
      "params": ["author"]
    },
    {
      "api": "database_api",
      "method": "get_post_discussions_by_payout",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_comment_discussions_by_payout",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_trending",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_trending30",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_created",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_active",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_cashout",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_payout",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_votes",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_children",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_hot",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_feed",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_blog",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_comments",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_promoted",
      "params": ["query"]
    },
    {
      "api": "database_api",
      "method": "get_block_header",
      "params": ["blockNum"]
    },
    {
      "api": "database_api",
      "method": "get_block",
      "params": ["blockNum"]
    },
    {
      "api": "database_api",
      "method": "get_ops_in_block",
      "params": ["blockNum", "onlyVirtual"]
    },
    {
      "api": "database_api",
      "method": "get_state",
      "params": ["path"]
    },
    {
      "api": "database_api",
      "method": "get_trending_categories",
      "params": ["after", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_best_categories",
      "params": ["after", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_active_categories",
      "params": ["after", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_recent_categories",
      "params": ["after", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_config"
    },
    {
      "api": "database_api",
      "method": "get_dynamic_global_properties"
    },
    {
      "api": "database_api",
      "method": "get_chain_properties"
    },
    {
      "api": "database_api",
      "method": "get_feed_history"
    },
    {
      "api": "database_api",
      "method": "get_current_median_history_price"
    },
    {
      "api": "database_api",
      "method": "get_witness_schedule"
    },
    {
      "api": "database_api",
      "method": "get_hardfork_version"
    },
    {
      "api": "database_api",
      "method": "get_next_scheduled_hardfork"
    },
    {
      "api": "account_by_key_api",
      "method": "get_key_references",
      "params": ["key"]
    },
    {
      "api": "database_api",
      "method": "get_accounts",
      "params": ["names"]
    },
    {
      "api": "database_api",
      "method": "get_account_references",
      "params": ["accountId"]
    },
    {
      "api": "database_api",
      "method": "lookup_account_names",
      "params": ["accountNames"]
    },
    {
      "api": "database_api",
      "method": "lookup_accounts",
      "params": ["lowerBoundName", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_account_count"
    },
    {
      "api": "database_api",
      "method": "get_conversion_requests",
      "params": ["accountName"]
    },
    {
      "api": "database_api",
      "method": "get_account_history",
      "params": ["account", "from", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_owner_history",
      "params": ["account"]
    },
    {
      "api": "database_api",
      "method": "get_recovery_request",
      "params": ["account"]
    },
    {
      "api": "database_api",
      "method": "get_escrow",
      "params": ["from", "escrowId"]
    },
    {
      "api": "database_api",
      "method": "get_withdraw_routes",
      "params": ["account", "withdrawRouteType"]
    },
    {
      "api": "database_api",
      "method": "get_account_bandwidth",
      "params": ["account", "bandwidthType"]
    },
    {
      "api": "database_api",
      "method": "get_savings_withdraw_from",
      "params": ["account"]
    },
    {
      "api": "database_api",
      "method": "get_savings_withdraw_to",
      "params": ["account"]
    },
    {
      "api": "database_api",
      "method": "get_order_book",
      "params": ["limit"]
    },
    {
      "api": "database_api",
      "method": "get_open_orders",
      "params": ["owner"]
    },
    {
      "api": "database_api",
      "method": "get_liquidity_queue",
      "params": ["startAccount", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_transaction_hex",
      "params": ["trx"]
    },
    {
      "api": "database_api",
      "method": "get_transaction",
      "params": ["trxId"]
    },
    {
      "api": "database_api",
      "method": "get_required_signatures",
      "params": ["trx", "availableKeys"]
    },
    {
      "api": "database_api",
      "method": "get_potential_signatures",
      "params": ["trx"]
    },
    {
      "api": "database_api",
      "method": "verify_authority",
      "params": ["trx"]
    },
    {
      "api": "database_api",
      "method": "verify_account_authority",
      "params": ["nameOrId", "signers"]
    },
    {
      "api": "database_api",
      "method": "get_active_votes",
      "params": ["author", "permlink"]
    },
    {
      "api": "database_api",
      "method": "get_account_votes",
      "params": ["voter"]
    },
    {
      "api": "database_api",
      "method": "get_content",
      "params": ["author", "permlink"]
    },
    {
      "api": "database_api",
      "method": "get_content_replies",
      "params": ["author", "permlink"]
    },
    {
      "api": "database_api",
      "method": "get_discussions_by_author_before_date",
      "params": ["author", "startPermlink", "beforeDate", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_replies_by_last_update",
      "params": ["startAuthor", "startPermlink", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_witnesses",
      "params": ["witnessIds"]
    },
    {
      "api": "database_api",
      "method": "get_witness_by_account",
      "params": ["accountName"]
    },
    {
      "api": "database_api",
      "method": "get_witnesses_by_vote",
      "params": ["from", "limit"]
    },
    {
      "api": "database_api",
      "method": "lookup_witness_accounts",
      "params": ["lowerBoundName", "limit"]
    },
    {
      "api": "database_api",
      "method": "get_witness_count"
    },
    {
      "api": "database_api",
      "method": "get_active_witnesses"
    },
    {
      "api": "database_api",
      "method": "get_miner_queue"
    },
    {
      "api": "database_api",
      "method": "get_reward_fund",
      "params": ["name"]
    },
    {
      "api": "database_api",
      "method": "get_vesting_delegations",
      "params": ["account", "from", "limit"]
    },
    {
      "api": "login_api",
      "method": "login",
      "params": ["username", "password"]
    },
    {
      "api": "login_api",
      "method": "get_api_by_name",
      "params": ["database_api"]
    },
    {
      "api": "login_api",
      "method": "get_version"
    },
    {
      "api": "follow_api",
      "method": "get_followers",
      "params": ["following", "startFollower", "followType", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_following",
      "params": ["follower", "startFollowing", "followType", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_follow_count",
      "params": ["account"]
    },
    {
      "api": "follow_api",
      "method": "get_feed_entries",
      "params": ["account", "entryId", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_feed",
      "params": ["account", "entryId", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_blog_entries",
      "params": ["account", "entryId", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_blog",
      "params": ["account", "entryId", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_account_reputations",
      "params": ["lowerBoundName", "limit"]
    },
    {
      "api": "follow_api",
      "method": "get_reblogged_by",
      "params": ["author", "permlink"]
    },
    {
      "api": "follow_api",
      "method": "get_blog_authors",
      "params": ["blogAccount"]
    },
    {
      "api": "network_broadcast_api",
      "method": "broadcast_transaction",
      "params": ["trx"]
    },
    {
      "api": "network_broadcast_api",
      "method": "broadcast_transaction_with_callback",
      "params": ["confirmationCallback", "trx"]
    },
    {
      "api": "network_broadcast_api",
      "method": "broadcast_transaction_synchronous",
      "params": ["trx"]
    },
    {
      "api": "network_broadcast_api",
      "method": "broadcast_block",
      "params": ["b"]
    },
    {
      "api": "network_broadcast_api",
      "method": "set_max_block_age",
      "params": ["maxBlockAge"]
    },
    {
      "api": "market_history_api",
      "method": "get_ticker",
      "params": []
    },
    {
      "api": "market_history_api",
      "method": "get_volume",
      "params": []
    },
    {
      "api": "market_history_api",
      "method": "get_order_book",
      "method_name": "getMarketOrderBook",
      "params": ["limit"]
    },
    {
      "api": "market_history_api",
      "method": "get_trade_history",
      "params": ["start", "end", "limit"]
    },
    {
      "api": "market_history_api",
      "method": "get_recent_trades",
      "params": ["limit"]
    },
    {
      "api": "market_history_api",
      "method": "get_market_history",
      "params": ["bucket_seconds", "start", "end"]
    },
    {
      "api": "market_history_api",
      "method": "get_market_history_buckets",
      "params": []
    },
    {
      "api": "condenser_api",
      "method": "find_proposals",
      "params": ["id_set"]
    },
    {
      "api": "condenser_api",
      "method": "list_proposals",
      "params": ["start", "limit", "order_by", "order_direction", "status"]
    },
    {
      "api": "condenser_api",
      "method": "list_proposal_votes",
      "params": ["start", "limit", "order_by", "order_direction", "status"]
    },
    {
      "api": "condenser_api",
      "method": "get_nai_pool",
      "params": []
    },
    {
      "api": "rc_api",
      "method": "find_rc_accounts",
      "params": ["accounts"],
      "is_object": true
    },
];
