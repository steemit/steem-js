(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"detect-node":5,"ws":4}],2:[function(require,module,exports){
steem = {
	api: require('./api'),
	formatter: require('./formatter'),
	connect: require('steemconnect'),
	embed: require('steemembed')
};
},{"./api":1,"./formatter":3,"steemconnect":7,"steemembed":9}],3:[function(require,module,exports){
module.exports = {
	reputation: function (reputation) {
		if (reputation == null) return reputation;
		reputation = parseInt(reputation);
		var rep = String(reputation);
		var neg = rep.charAt(0) === '-';
		rep = neg ? rep.substring(1) : rep;
		var str = rep;
		var leadingDigits = parseInt(str.substring(0, 4));
		var log = Math.log(leadingDigits) / Math.log(10);
		var n = str.length - 1;
		var out = n + (log - parseInt(log));
		if (isNaN(out)) out = 0;
		out = Math.max(out - 9, 0);
		out = (neg ? -1 : 1) * out;
		out = (out * 9) + 25;
		out = parseInt(out);
		return out;
	},
	vestToSteem: function(vestingShares, totalVestingShares, totalVestingFundSteem) {
		return parseFloat(totalVestingFundSteem) * (parseFloat(vestingShares) / parseFloat(totalVestingShares));
	},
	commentPermlink: function(parentAuthor, parentPermlink) {
		var timeStr = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '');
		parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '');
		return 're-' + parentAuthor + '-' + parentPermlink + '-' + timeStr;
	},
	amount: function(amount, asset) {
		return amount.toFixed(3) + ' ' + asset;
	}
};
},{}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
(function (global){
module.exports = false;

// Only Node.JS has a process variable that is of [[Class]] process
try {
 module.exports = Object.prototype.toString.call(global.process) === '[object process]' 
} catch(e) {}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0]
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.text(escape(this.smartypants(cap[0])));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
	// explicitly match decimal, hex, and named HTML entities 
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  sanitizer: null,
  mangle: true,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
module.exports = require('./lib/steemconnect');
},{"./lib/steemconnect":8}],8:[function(require,module,exports){
module.exports = {
	isAuthenticated: function(callback) {
		this.send('https://steemconnect.com/api/verify', {}, function (response) {
			callback('', response);
		});
	},
	vote: function(voter, author, permlink, weight, callback) {
		var params = {voter: voter, author: author, permlink: permlink, weight: weight};
		this.send('https://steemconnect.com/api/vote', params, function (response) {
			callback('', response);
		});
	},
	comment: function(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, callback) {
		var params = {parentAuthor: parentAuthor, parentPermlink: parentPermlink, author: author, permlink: permlink, title: title, body: body, jsonMetadata: jsonMetadata};
		this.send('https://steemconnect.com/api/comment', params, function (response) {
			callback('', response);
		});
	},
	send: function(url, params, callback) {
		params = params || {};
		params = this.params(params);
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.withCredentials = true;
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
				callback(JSON.parse(xmlHttp.responseText));
		};
		xmlHttp.open('GET', url + params, true);
		xmlHttp.send(null);
	},
	params: function(params) {
		return '?' + Object.keys(params).map(function(key){
				return key + '=' + params[key];
			}).join('&');
	}
};
},{}],9:[function(require,module,exports){
module.exports = require('./lib/steemembed');
},{"./lib/steemembed":10}],10:[function(require,module,exports){
var urlExtractor = require('url-extractor');

var SteemEmbed = {};

SteemEmbed.getUrls = function(text) {
	return urlExtractor.extractUrls(text, urlExtractor.SOURCE_TYPE_MARKDOWN);
};

SteemEmbed.getAll = function(text, options) {
	var embeds = [];
	var urls = this.getUrls(text);
	urls.forEach(function(url) {
		var embed = this.get(url, options);
		if (embed) {
			embeds.push(this.get(url, options));
		}
	}.bind(this));
	return embeds;
};

SteemEmbed.get = function(url, options) {
	var youtubeId = this.isYoutube(url);
	var twitchChannel = this.isTwitch(url);
	var periscopeId = this.isPeriscope(url);
	var soundcloudId = this.isSoundcloud(url);
	if (youtubeId) {
		return {
			'type': 'video',
			'url': url,
			'provider_name': 'YouTube',
			'id': youtubeId,
			'embed': this.youtube(url, youtubeId)
		}
	} else if (twitchChannel) {
		return {
			'type': 'video',
			'url': url,
			'provider_name': 'Twitch',
			'id': twitchChannel,
			'embed': this.twitch(url, twitchChannel)
		}
	} else if (periscopeId) {
		return {
			'type': 'video',
			'url': url,
			'provider_name': 'Periscope',
			'id': periscopeId,
			'embed': this.periscope(url, periscopeId)
		}
	} else if (soundcloudId) {
		return {
			'type': 'music',
			'url': url,
			'provider_name': 'SoundCloud',
			'id': soundcloudId,
			'embed': this.soundcloud(url, soundcloudId)
		}
	}
};

SteemEmbed.isYoutube = function(url) {
	var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
	return (url.match(p))? RegExp.$1 : false;
};

SteemEmbed.youtube = function(url, id) {
	return '<iframe width="100%" height="400" src="//www.youtube.com/embed/' + id + '" frameborder="0" scrolling="no" allowfullscreen></iframe>';
};

SteemEmbed.isTwitch = function(url) {
	var p = /^(?:https?:\/\/)?(?:www\.)?(?:twitch.tv\/)(.*)?$/;
	return (url.match(p))? RegExp.$1 : false;
};

SteemEmbed.twitch = function(url, channel) {
	return '<iframe width="100%" height="400" src="//player.twitch.tv/?channel=' + channel + '&autoplay=false" frameborder="0" scrolling="no" allowfullscreen></iframe>';
};

SteemEmbed.isPeriscope = function(url) {
	var p = /^(?:https?:\/\/)?(?:www\.)?(?:periscope.tv\/)(.*)?$/;
	var m = (url.match(p))? RegExp.$1.split('/') : [];
	var r = (m[1])? m[1] : false;
	return r;
};

SteemEmbed.periscope = function(url, id) {
	return '<iframe width="100%" height="400" src="//www.periscope.tv/w/' + id + '" frameborder="0" scrolling="no" allowfullscreen></iframe>';
};

SteemEmbed.isSoundcloud = function(url) {
	var p = /^(?:https?:\/\/)?(?:www\.)?(?:soundcloud.com\/)(.*)?$/;
	return (url.match(p))? RegExp.$1 : false;
};

SteemEmbed.soundcloud = function(url, id) {
	return '<iframe width="100%" height="400" src="//w.soundcloud.com/player/?url=' + encodeURIComponent(url + '?visual=true') + '" frameborder="0" scrolling="no" allowfullscreen></iframe>';
};


module.exports = SteemEmbed;
},{"url-extractor":14}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var SOURCE_TYPE_MARKDOWN = 'SOURCE_TYPE_MARKDOWN_' + Math.random();

exports.SOURCE_TYPE_MARKDOWN = SOURCE_TYPE_MARKDOWN;


},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extractUrlsFromMarkdown = require('./extractUrlsFromMarkdown');

var _extractUrlsFromMarkdown2 = _interopRequireDefault(_extractUrlsFromMarkdown);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {string} input
 * @param {SOURCE_TYPE_*} sourceType
 */

exports.default = function (input, sourceType) {
    var urls = void 0;

    if (!sourceType) {
        throw new Error('Must set source type.');
    } else if (sourceType === _constants.SOURCE_TYPE_MARKDOWN) {
        urls = (0, _extractUrlsFromMarkdown2.default)(input);
    } else {
        throw new Error('Unknown source type.');
    }

    return urls.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
};

module.exports = exports['default'];


},{"./constants":11,"./extractUrlsFromMarkdown":13}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (input) {
    var renderer = new _marked2.default.Renderer();
    var urls = [];

    renderer.image = function (href) {
        urls.push(href);
    };

    renderer.link = function (href) {
        urls.push(href);
    };

    (0, _marked2.default)(input, {
        renderer: renderer
    });

    return urls;
};

module.exports = exports['default'];


},{"marked":6}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SOURCE_TYPE_MARKDOWN = exports.extractUrls = undefined;

var _extractUrls = require('./extractUrls');

var _extractUrls2 = _interopRequireDefault(_extractUrls);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.extractUrls = _extractUrls2.default;
exports.SOURCE_TYPE_MARKDOWN = _constants.SOURCE_TYPE_MARKDOWN;


},{"./constants":11,"./extractUrls":12}]},{},[2]);
