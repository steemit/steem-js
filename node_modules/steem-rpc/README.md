[![npm version](https://badge.fury.io/js/steem-rpc.svg)](https://www.npmjs.com/package/steem-rpc)
[![npm downloads](https://img.shields.io/npm/dm/steem-rpc.svg)](https://www.npmjs.com/package/steem-rpc)
## steem-rpc

A simple websocket wrapper enabling RPC communication with the steem client `steemd` for node.js and browsers.

## Installation
This library is available as an NPM module:

```
npm install steem-rpc
```

If you would like to use it in a browser, browser builds are available in /build. An example is provided in [examples/index.html](examples/index.html)

## Node/Webpack/Browserify usage

The library needs to initialize a connection and retrieve some api references before it is ready to be used. A simple init and use case can be seen in example/example.js and can be launched with `npm run example`

```
const options = {
	// user: "username",
	// pass: "password",
	// url: "ws://localhost:9090",
	// debug: false
};
var {Client} = require("steem-rpc");
var Api = Client.get(options, true);

Api.initPromise.then(response => {
	console.log("Api ready:", response);

	Api.database_api().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
	})
});

```

By default the library will connect to Steemit's public websocket api at wss://steemit.com/ws. If you'd like to use another server, simply pass it in the options object:

```
const options = {
	url: "ws://localhost:9090"
}
```

This library borrows heavily from [James Calfee](https://github.com/jcalfee)'s websocket RPC implementation for the [Bitshares GUI](https://github.com/cryptonomex/graphene-ui/) which can be found here: https://github.com/cryptonomex/graphene-ui/tree/master/dl/src/rpc_api


### Example api commands

There's a handy "shortcut" api call that will get you a global state object:

```
get_state(string route)
```

You can call this with an empty string, or with a category like `trending`.

```
Api.database_api().exec("get_state", ["trending"]).then(response => {
	console.log("get_state", response);
})
```

The full list of api calls is this:

```
	cancel_all_subscriptions
	get_account_count
	get_account_history
	get_account_references
	get_account_votes
	get_accounts
	get_active_categories
	get_active_votes
	get_active_witnesses
	get_best_categories
	get_block
	get_block_header
	get_chain_properties
	get_config
	get_content
	get_content_replies
	get_conversion_requests
	get_current_median_history_price
	get_discussions_by_active
	get_discussions_by_author_before_date
	get_discussions_by_cashout
	get_discussions_by_children
	get_discussions_by_created
	get_discussions_by_hot
	get_discussions_by_payout
	get_discussions_by_trending
	get_discussions_by_votes
	get_dynamic_global_properties
	get_feed_history
	get_hardfork_version
	get_key_references
	get_miner_queue
	get_next_scheduled_hardfork
	get_order_book
	get_potential_signatures
	get_recent_categories
	get_recommended_for
	get_replies_by_last_update
	get_required_signatures
	get_state
	get_transaction
	get_transaction_hex
	get_trending_categories
	get_trending_tags
	get_witness_by_account
	get_witness_count
	get_witness_schedule
	get_witnesses
	get_witnesses_by_vote
	lookup_account_names
	lookup_accounts
	lookup_witness_accounts
	set_block_applied_callback
	set_pending_transaction_callback
	set_subscribe_callback
	verify_account_authority
	verify_authority
```
