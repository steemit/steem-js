export interface Operation {
    roles: string[];
    operation: string;
    params: string[];
}

export const operations: Operation[] = [
    {
        roles: ["posting", "active", "owner"],
        operation: "vote",
        params: [
            "voter",
            "author",
            "permlink",
            "weight"
        ]
    },
    {
        roles: ["posting", "active", "owner"],
        operation: "comment",
        params: [
            "parent_author",
            "parent_permlink",
            "author",
            "permlink",
            "title",
            "body",
            "json_metadata"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "transfer",
        params: [
            "from",
            "to",
            "amount",
            "memo"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "transfer_to_vesting",
        params: [
            "from",
            "to",
            "amount"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "withdraw_vesting",
        params: [
            "account",
            "vesting_shares"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "limit_order_create",
        params: [
            "owner",
            "orderid",
            "amount_to_sell",
            "min_to_receive",
            "fill_or_kill",
            "expiration"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "limit_order_cancel",
        params: [
            "owner",
            "orderid"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "price",
        params: [
            "base",
            "quote"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "feed_publish",
        params: [
            "publisher",
            "exchange_rate"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "convert",
        params: [
            "owner",
            "requestid",
            "amount"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "account_create",
        params: [
            "fee",
            "creator",
            "new_account_name",
            "owner",
            "active",
            "posting",
            "memo_key",
            "json_metadata"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "account_update",
        params: [
            "account",
            "owner",
            "active",
            "posting",
            "memo_key",
            "json_metadata"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "witness_update",
        params: [
            "owner",
            "url",
            "block_signing_key",
            "props",
            "fee"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "account_witness_vote",
        params: [
            "account",
            "witness",
            "approve"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "account_witness_proxy",
        params: [
            "account",
            "proxy"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "pow",
        params: [
            "worker",
            "input",
            "signature",
            "work"
        ]
    },
    {
        roles: ["active", "owner"],
        operation: "custom",
        params: [
            "required_auths",
            "id",
            "data"
        ]
    },
    {
        roles: ["posting", "active", "owner"],
        operation: "delete_comment",
        params: [
            "author",
            "permlink"
        ]
    },
    {
        roles: ["posting", "active", "owner"],
        operation: "custom_json",
        params: [
            "required_auths",
            "required_posting_auths",
            "id",
            "json"
        ]
    },
    {
        roles: ["posting", "active", "owner"],
        operation: "comment_options",
        params: [
            "author",
            "permlink",
            "max_accepted_payout",
            "percent_steem_dollars",
            "allow_votes",
            "allow_curation_rewards",
            "extensions"
        ]
    }
]; 