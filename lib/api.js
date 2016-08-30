var isNode = require('detect-node');
if (isNode) var WS = require('ws');

var Steem = {
	url: 'wss://steemit.com/wspa',
	apiIds: {
		'database_api': 0,
		'login_api': 1,
		'follow_api': 2,
		'network_broadcast_api': 4
	},
	id: 0,
	reqs: [],
	isOpen: false,
	isReady: false
};

Steem.setWebSocket = function(url) {
	this.url = url;
};

Steem.init = function(callback) {
	if (!this.isReady) {
		if (isNode) {
			this.ws = new WS(this.url);
			this.ws.setMaxListeners(0);
		} else {
			this.ws = new WebSocket(this.url);
		}
		this.ws.addEventListener('close', function() {
			this.ws.close();
			this.isReady = false;
			this.isOpen = false;
		}.bind(this));
		this.isReady = true;
	}
	if (!this.isOpen) {
		this.ws.addEventListener('open', function() {
			this.isOpen = true;
			this.getApiByName('database_api', function() {});
			this.getApiByName('login_api', function() {});
			this.getApiByName('follow_api', function() {});
			this.getApiByName('network_broadcast_api', function() {});
			callback();
		}.bind(this));
	} else {
		callback();
	}
};

Steem.iterate = function() {
	this.id++;
	var id = this.id;
	this.reqs.push(id);
	return id;
};

Steem.getApi = function(api, callback) {
	if (this.apiIds[api] || this.apiIds[api] === 0) {
		callback('', this.apiIds[api]);
	} else {
		this.getApiByName(api, function(err, result) {
			this.apiIds[api] = result;
			callback('', result);
		}.bind(this));
	}
};

Steem.send = function(api, data, callback) {
	data.id = data.id || 0;
	data.params = data.params || [];
	this.init(function(){
		var call = {};
		call.id = data.id;
		call.method = 'call';
		call.params = [this.apiIds[api], data.method, data.params];
		this.ws.send(JSON.stringify(call));
	}.bind(this));

	this.ws.addEventListener('message', function(msg) {
		var data = JSON.parse(msg.data);
		var err = (data.error && data.error.data && data.error.data.stack)? data.error.data.stack : '';
		callback(err, data);
	}.bind(this));

	this.ws.addEventListener('error', function(error){
		callback(error, null);
	});
};


// [database_api]

// Subscriptions

/* set_subscribe_callback */
Steem.setSubscribeCallback = function(cb, clearFilter, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'set_subscribe_callback',
		'params': [callback, clearFilter]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* set_pending_transaction_callback */
Steem.setPendingTransactionCallback = function(cb, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'set_pending_transaction_callback',
		'params': [cb]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* set_block_applied_callback */
Steem.setBlockAppliedCallback = function(cb, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'set_block_applied_callback',
		'params': [cb]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* cancel_all_subscriptions */
Steem.cancelAllSubscriptions = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'cancel_all_subscriptions'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// tags

/* get_trending_tags */
Steem.getTrendingTags = function(afterTag, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_trending_tags',
		'params': [afterTag, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_trending */
Steem.getDiscussionsByTrending = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_trending',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_created */
Steem.getDiscussionsByCreated = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_created',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_active */
Steem.getDiscussionsByActive = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_active',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_cashout */
Steem.getDiscussionsByCashout = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_cashout',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_payout */
Steem.getDiscussionsByPayout = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_payout',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_votes */
Steem.getDiscussionsByVotes = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_votes',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_children */
Steem.getDiscussionsByChildren = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_children',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_hot */
Steem.getDiscussionsByHot = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_hot',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_feed */
Steem.getDiscussionsByFeed = function(query, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_feed',
		'params': [query]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

// Blocks and transactions

/* get_block_header */
Steem.getBlockHeader = function(blockNum, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_block_header',
		'params': [blockNum]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_block */
Steem.getBlock = function(blockNum, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_block',
		'params': [blockNum]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_state */
Steem.getState = function(path, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_state',
		'params': [path]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_trending_categories */
Steem.getTrendingCategories = function(after, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_trending_categories',
		'params': [after, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_best_categories */
Steem.getBestCategories = function(after, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_best_categories',
		'params': [after, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_active_categories */
Steem.getActiveCategories = function(after, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_active_categories',
		'params': [after, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_recent_categories */
Steem.getRecentCategories = function(after, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_recent_categories',
		'params': [after, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// Globals

/* get_config */
Steem.getConfig = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_config',
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_dynamic_global_properties */
Steem.getDynamicGlobalProperties = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_dynamic_global_properties'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_chain_properties */
Steem.getChainProperties = function(after, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_chain_properties'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_feed_history */
Steem.getFeedHistory = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_feed_history'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_current_median_history_price */
Steem.getCurrentMedianHistoryPrice = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_current_median_history_price'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_witness_schedule */
Steem.getWitnessSchedule = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_recent_categories',
		'params': [after, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_hardfork_version */
Steem.getHardforkVersion = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_hardfork_version'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_next_scheduled_hardfork */
Steem.getNextScheduledHardfork = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_next_scheduled_hardfork'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// Keys

/* get_key_references */
Steem.getKeyReferences = function(key, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_key_references',
		'params': [key]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// Accounts

/* get_accounts */
Steem.getAccounts = function(names, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_accounts',
		'params': [names]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_account_references */
Steem.getAccountReferences = function(accountId , callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_account_references',
		'params': [accountId]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* lookup_account_names */
Steem.lookupAccountNames = function(accountNames, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'lookup_account_names',
		'params': [accountNames]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* lookup_accounts */
Steem.lookupAccounts = function(lowerBoundName, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'lookup_accounts',
		'params': [lowerBoundName, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_account_count */
Steem.getAccountCount = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_account_count'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_conversion_requests */
Steem.getConversionRequests = function(accountName, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_conversion_requests',
		'params': [accountName]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_account_history */
Steem.getAccountHistory = function(account, from, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_account_history',
		'params': [account, from, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_owner_history */
Steem.getOwnerHistory = function(account, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_owner_history',
		'params': [account]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_recovery_request */
Steem.getRecoveryRequest = function(account, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_recovery_request',
		'params': [account]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// Market

/* get_order_book */
Steem.getOrderBook = function(limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'getOrderBook',
		'params': [limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_open_orders */
Steem.getOpenOrders = function(owner, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_open_orders',
		'params': [owner]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_liquidity_queue */
Steem.getLiquidityQueue = function(startAccount, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_liquidity_queue',
		'params': [startAccount, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// Authority / validation

/* get_transaction_hex */
Steem.getTransactionHex = function(trx, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_transaction_hex',
		'params': [trx]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_transaction */
Steem.getTransaction = function(trxId, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_transaction',
		'params': [trxId]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_required_signatures */
Steem.getRequiredSignatures = function(trx, availableKeys, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_required_signatures',
		'params': [trx, availableKeys]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_potential_signatures */
Steem.getPotentialSignatures = function(trx, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_potential_signatures',
		'params': [trx]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* verify_authority */
Steem.verifyAuthority = function(trx, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'verify_authority',
		'params': [trx]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* verify_account_authority */
Steem.verifyAccountAuthority = function(nameOrId, signers, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'verify_account_authority',
		'params': [nameOrId, signers]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// votes

/* get_active_votes */
Steem.getActiveVotes = function(author, permlink, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_active_votes',
		'params': [author, permlink]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_account_votes */
Steem.getAccountVotes = function(voter, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_account_votes',
		'params': [voter]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// content

/* get_content */
Steem.getContent = function(author, permlink, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_content',
		'params': [author, permlink]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_content_replies */
Steem.getContentReplies = function(parent, parentPermlink, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_content_replies',
		'params': [parent, parentPermlink]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_discussions_by_author_before_date */
Steem.getDiscussionsByAuthorBeforeDate = function(author, startPermlink, beforeDate, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_discussions_by_author_before_date',
		'params': [author, startPermlink, beforeDate, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_replies_by_last_update */
Steem.getRepliesByLastUpdate = function(startAuthor, startPermlink, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_replies_by_last_update',
		'params': [startAuthor, startPermlink, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// Witnesses

/* get_witnesses */
Steem.getWitnesses = function(witnessIds, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_witnesses',
		'params': [witnessIds]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_witness_by_account */
Steem.getWitnessByAccount = function(accountName, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_witness_by_account',
		'params': [accountName]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_witnesses_by_vote */
Steem.getWitnessesByVote = function(from, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_witnesses_by_vote',
		'params': [from, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* lookup_witness_accounts */
Steem.lookupWitnessAccounts = function(lowerBoundName, limit, callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'lookup_witness_accounts',
		'params': [lowerBoundName, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_witness_count */
Steem.getWitnessCount = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_witness_count'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_active_witnesses */
Steem.getActiveWitnesses = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_active_witnesses'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_miner_queue */
Steem.getMinerQueue = function(callback) {
	var iterator = this.iterate();
	this.send('database_api', {
		'id': iterator,
		'method': 'get_miner_queue'
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// [login_api]

/* login */
Steem.login = function(username, password, callback) {
	var iterator = this.iterate();
	this.send('login_api', {
		'id': iterator,
		'method': 'login',
		'params': [username, password]
	}, function(err, data) {
		if (iterator == data.id) {
			this.getApiByName('network_broadcast_api', function() {});
			callback(err, data.result);
		}
	}.bind(this));
};

/* get_api_by_name */
Steem.getApiByName = function(apiName, callback) {
	var iterator = this.iterate();
	this.send('login_api', {
		'id': iterator,
		'method': 'get_api_by_name',
		'params': [apiName]
	}, function(err, data) {
		if (iterator == data.id) {
			this.apiIds[apiName] = data.result;
			callback(err, data.result);
		}
	}.bind(this));
};


// [follow_api]

/* get_followers */
Steem.getFollowers = function(following, startFollower, followType, limit, callback) {
	var iterator = this.iterate();
	this.send('follow_api', {
		'id': iterator,
		'method': 'get_followers',
		'params': [following, startFollower, followType, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* get_following */
Steem.getFollowing = function(follower, startFollowing, followType, limit, callback) {
	var iterator = this.iterate();
	this.send('follow_api', {
		'id': iterator,
		'method': 'get_following',
		'params': [follower, startFollowing, followType, limit]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// [network_broadcast_api]

/* broadcast_transaction */
Steem.broadcastTransaction = function(trx, callback) {
	var iterator = this.iterate();
	this.send('network_broadcast_api', {
		'id': iterator,
		'method': 'broadcast_transaction',
		'params': [trx]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* broadcast_transaction_synchronous */
Steem.broadcastTransactionSynchronous = function(trx , callback) {
	var iterator = this.iterate();
	this.send('network_broadcast_api', {
		'id': iterator,
		'method': 'broadcast_transaction_synchronous',
		'params': [trx]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* broadcast_block */
Steem.broadcastBlock = function(b, callback) {
	var iterator = this.iterate();
	this.send('network_broadcast_api', {
		'id': iterator,
		'method': 'broadcast_block',
		'params': [b]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};

/* broadcast_transaction_with_callback */
Steem.broadcastTransactionWithCallback = function(confirmationCallback, trx, callback) {
	var iterator = this.iterate();
	this.send('network_broadcast_api', {
		'id': iterator,
		'method': 'broadcast_transaction_with_callback',
		'params': [confirmationCallback, trx]
	}, function(err, data) {
		if (iterator == data.id) callback(err, data.result);
	});
};


// [Stream]

Steem.streamBlockNumber = function(callback) {
	var current = '';
	var self = this;
	setInterval(function() {
		self.getDynamicGlobalProperties(function(err, result) {
			var blockId = result.head_block_number;
			if (blockId != current) {
				current = blockId;
				callback(null, current);
			}
		});
	}, 200);
};

Steem.streamBlock = function(callback) {
	var current = '';
	var last = '';
	var self = this;
	this.streamBlockNumber(function(err, id) {
		current = id;
		if (current != last) {
			last = current;
			self.getBlock(current, function(err, result) {
				callback(null, result);
			});
		}
	});
};

Steem.streamTransactions = function(callback) {
	this.streamBlock(function(err, result) {
		if (!!result) {
			result.transactions.forEach(function(transaction) {
				callback(null, transaction);
			});
		}
	})
};

Steem.streamOperations = function(callback) {
	this.streamBlock(function(err, result) {
		if (!!result) {
			result.transactions.forEach(function(transaction) {
				transaction.operations.forEach(function (operation) {
					callback(null, operation);
				});
			});
		}
	})
};


module.exports = Steem;
