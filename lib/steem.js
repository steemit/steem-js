var Ws = require('ws');
var apiIds = {
	'database_api': 0,
	'login_api': 1,
	'follow_api': 2
};

var Steem = function(url){
	this.url = url || 'wss://this.piston.rocks';
};

Steem.prototype.send = function(api, data, callback) {
	data.id = data.id || 0;
	var ws = new Ws(this.url);

	ws.onmessage = function(msg) {
		var data = JSON.parse(msg.data);
		var err = data.error || '';
		callback(err, data.result);
	};

	ws.onopen = function() {
		data.params = data.params || [];
		var call = {};
		call.id = data.id;
		call.method = 'call';
		call.params = [apiIds[api], data.method, data.params];
		ws.send(JSON.stringify(call));
	};

	ws.onerror = function(error){
		callback(error, null);
	}
};

// [login_api]

/* login */
Steem.prototype.login = function(username, password, callback) {
	this.send('login_api', {
		'method': 'login',
		'params': [username, password]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_api_by_name */
Steem.prototype.getApiByName = function(apiName, callback) {
	this.send('login_api', {
		'method': 'get_api_by_name',
		'params': [apiName]
	}, function(err, result) {
		callback(err, result);
	});
};


// [database_api]

// Subscriptions

/* set_subscribe_callback */
Steem.prototype.setSubscribeCallback = function(cb, clearFilter, callback) {
	this.send('database_api', {
		'method': 'set_subscribe_callback',
		'params': [cb, clearFilter]
	}, function(err, result) {
		callback(err, result);
	});
};

/* set_pending_transaction_callback */
Steem.prototype.setPendingTransactionCallback = function(cb, callback) {
	this.send('database_api', {
		'method': 'set_pending_transaction_callback',
		'params': [cb]
	}, function(err, result) {
		callback(err, result);
	});
};

/* set_block_applied_callback */
Steem.prototype.setBlockAppliedCallback = function(cb, callback) {
	this.send('database_api', {
		'method': 'set_block_applied_callback',
		'params': [cb]
	}, function(err, result) {
		callback(err, result);
	});
};

/* cancel_all_subscriptions */
Steem.prototype.cancelAllSubscriptions = function(callback) {
	this.send('database_api', {
		'method': 'cancel_all_subscriptions'
	}, function(err, result) {
		callback(err, result);
	});
};


// tags

/* get_trending_tags */
Steem.prototype.getTrendingTags = function(afterTag, limit, callback) {
	this.send('database_api', {
		'method': 'get_trending_tags',
		'params': [afterTag, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_trending */
Steem.prototype.getDiscussionsByTrending = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_trending',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_created */
Steem.prototype.getDiscussionsByCreated = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_created',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_active */
Steem.prototype.getDiscussionsByActive = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_active',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_cashout */
Steem.prototype.getDiscussionsByCashout = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_cashout',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_payout */
Steem.prototype.getDiscussionsByPayout = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_payout',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_votes */
Steem.prototype.getDiscussionsByVotes = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_votes',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_children */
Steem.prototype.getDiscussionsByChildren = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_children',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_hot */
Steem.prototype.getDiscussionsByHot = function(query, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_hot',
		'params': [query]
	}, function(err, result) {
		callback(err, result);
	});
};


// Blocks and transactions

/* get_block_header */
Steem.prototype.getBlockHeader = function(blockNum, callback) {
	this.send('database_api', {
		'method': 'get_block_header',
		'params': [blockNum]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_block */
Steem.prototype.getBlock = function(blockNum, callback) {
	this.send('database_api', {
		'method': 'get_block',
		'params': [blockNum]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_state */
Steem.prototype.getState = function(path, callback) {
	this.send('database_api', {
		'method': 'get_state',
		'params': [path]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_trending_categories */
Steem.prototype.getTrendingCategories = function(after, limit, callback) {
	this.send('database_api', {
		'method': 'get_trending_categories',
		'params': [after, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_best_categories */
Steem.prototype.getBestCategories = function(after, limit, callback) {
	this.send('database_api', {
		'method': 'get_best_categories',
		'params': [after, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_active_categories */
Steem.prototype.getActiveCategories = function(after, limit, callback) {
	this.send('database_api', {
		'method': 'get_active_categories',
		'params': [after, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_recent_categories */
Steem.prototype.getRecentCategories = function(after, limit, callback) {
	this.send('database_api', {
		'method': 'get_recent_categories',
		'params': [after, limit]
	}, function(err, result) {
		callback(err, result);
	});
};


// Globals

/* get_config */
Steem.prototype.getConfig = function(callback) {
	this.send('database_api', {
		'method': 'get_config',
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_dynamic_global_properties */
Steem.prototype.getDynamicGlobalProperties = function(callback) {
	this.send('database_api', {
		'method': 'get_dynamic_global_properties'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_chain_properties */
Steem.prototype.getChainProperties = function(after, limit, callback) {
	this.send('database_api', {
		'method': 'get_chain_properties'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_feed_history */
Steem.prototype.getFeedHistory = function(callback) {
	this.send('database_api', {
		'method': 'get_feed_history'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_current_median_history_price */
Steem.prototype.getCurrentMedianHistoryPrice = function(callback) {
	this.send('database_api', {
		'method': 'get_current_median_history_price'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_witness_schedule */
Steem.prototype.getWitnessSchedule = function(callback) {
	this.send('database_api', {
		'method': 'get_recent_categories',
		'params': [after, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_hardfork_version */
Steem.prototype.getHardforkVersion = function(callback) {
	this.send('database_api', {
		'method': 'get_hardfork_version'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_next_scheduled_hardfork */
Steem.prototype.getNextScheduledHardfork = function(callback) {
	this.send('database_api', {
		'method': 'get_next_scheduled_hardfork'
	}, function(err, result) {
		callback(err, result);
	});
};


// Keys

/* get_key_references */
Steem.prototype.getKeyReferences = function(key, callback) {
	this.send('database_api', {
		'method': 'get_key_references',
		'params': [key]
	}, function(err, result) {
		callback(err, result);
	});
};


// Accounts

/* get_accounts */
Steem.prototype.getAccounts = function(names, callback) {
	this.send('database_api', {
		'method': 'get_accounts',
		'params': [names]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_account_references */
Steem.prototype.getAccountReferences = function(accountId , callback) {
	this.send('database_api', {
		'method': 'get_account_references',
		'params': [accountId]
	}, function(err, result) {
		callback(err, result);
	});
};

/* lookup_account_names */
Steem.prototype.lookupAccountNames = function(accountNames, callback) {
	this.send('database_api', {
		'method': 'lookup_account_names',
		'params': [accountNames]
	}, function(err, result) {
		callback(err, result);
	});
};

/* lookup_accounts */
Steem.prototype.lookupAccounts = function(lowerBoundName, limit, callback) {
	this.send('database_api', {
		'method': 'lookup_accounts',
		'params': [lowerBoundName, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_account_count */
Steem.prototype.getAccountCount = function(callback) {
	this.send('database_api', {
		'method': 'get_account_count'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_conversion_requests */
Steem.prototype.getConversionRequests = function(accountName, callback) {
	this.send('database_api', {
		'method': 'get_conversion_requests',
		'params': [accountName]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_account_history */
Steem.prototype.getAccountHistory = function(account, from, limit, callback) {
	this.send('database_api', {
		'method': 'get_account_history',
		'params': [account, from, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_owner_history */
Steem.prototype.getOwnerHistory = function(account, callback) {
	this.send('database_api', {
		'method': 'get_owner_history',
		'params': [account]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_recovery_request */
Steem.prototype.getRecoveryRequest = function(account, callback) {
	this.send('database_api', {
		'method': 'get_recovery_request',
		'params': [account]
	}, function(err, result) {
		callback(err, result);
	});
};


// Market

/* get_order_book */
Steem.prototype.getOrderBook = function(limit, callback) {
	this.send('database_api', {
		'method': 'getOrderBook',
		'params': [limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_open_orders */
Steem.prototype.getOpenOrders = function(owner, callback) {
	this.send('database_api', {
		'method': 'get_open_orders',
		'params': [owner]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_liquidity_queue */
Steem.prototype.getLiquidityQueue = function(startAccount, limit, callback) {
	this.send('database_api', {
		'method': 'get_liquidity_queue',
		'params': [startAccount, limit]
	}, function(err, result) {
		callback(err, result);
	});
};


// Authority / validation

/* get_transaction_hex */
Steem.prototype.getTransactionHex = function(trx, callback) {
	this.send('database_api', {
		'method': 'get_transaction_hex',
		'params': [trx]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_transaction */
Steem.prototype.getTransaction = function(trxId, callback) {
	this.send('database_api', {
		'method': 'get_transaction',
		'params': [trxId]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_required_signatures */
Steem.prototype.getRequiredSignatures = function(trx, availableKeys, callback) {
	this.send('database_api', {
		'method': 'get_required_signatures',
		'params': [trx, availableKeys]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_potential_signatures */
Steem.prototype.getPotentialSignatures = function(trx, callback) {
	this.send('database_api', {
		'method': 'get_potential_signatures',
		'params': [trx]
	}, function(err, result) {
		callback(err, result);
	});
};

/* verify_authority */
Steem.prototype.verifyAuthority = function(trx, callback) {
	this.send('database_api', {
		'method': 'verify_authority',
		'params': [trx]
	}, function(err, result) {
		callback(err, result);
	});
};

/* verify_account_authority */
Steem.prototype.verifyAccountAuthority = function(nameOrId, signers, callback) {
	this.send('database_api', {
		'method': 'verify_account_authority',
		'params': [nameOrId, signers]
	}, function(err, result) {
		callback(err, result);
	});
};


// votes

/* get_active_votes */
Steem.prototype.getActiveVotes = function(author, permlink, callback) {
	this.send('database_api', {
		'method': 'get_active_votes',
		'params': [author, permlink]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_account_votes */
Steem.prototype.getAccountVotes = function(voter, callback) {
	this.send('database_api', {
		'method': 'get_account_votes',
		'params': [voter]
	}, function(err, result) {
		callback(err, result);
	});
};


// content

/* get_content */
Steem.prototype.getContent = function(author, permlink, callback) {
	this.send('database_api', {
		'method': 'get_content',
		'params': [author, permlink]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_content_replies */
Steem.prototype.getContentReplies = function(parent, parentPermlink, callback) {
	this.send('database_api', {
		'method': 'get_content_replies',
		'params': [parent, parentPermlink]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_discussions_by_author_before_date */
Steem.prototype.getDiscussionsByAuthorBeforeDate = function(author, startPermlink, beforeDate, limit, callback) {
	this.send('database_api', {
		'method': 'get_discussions_by_author_before_date',
		'params': [author, startPermlink, beforeDate, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_replies_by_last_update */
Steem.prototype.getRepliesByLastUpdate = function(startAuthor, startPermlink, limit, callback) {
	this.send('database_api', {
		'method': 'get_replies_by_last_update',
		'params': [startAuthor, startPermlink, limit]
	}, function(err, result) {
		callback(err, result);
	});
};


// Witnesses

/* get_witnesses */
Steem.prototype.getWitnesses = function(witnessIds, callback) {
	this.send('database_api', {
		'method': 'get_witnesses',
		'params': [witnessIds]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_witness_by_account */
Steem.prototype.getWitnessByAccount = function(accountName, callback) {
	this.send('database_api', {
		'method': 'get_witness_by_account',
		'params': [accountName]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_witnesses_by_vote */
Steem.prototype.getWitnessesByVote = function(from, limit, callback) {
	this.send('database_api', {
		'method': 'get_witnesses_by_vote',
		'params': [from, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* lookup_witness_accounts */
Steem.prototype.lookupWitnessAccounts = function(lowerBoundName, limit, callback) {
	this.send('database_api', {
		'method': 'lookup_witness_accounts',
		'params': [lowerBoundName, limit]
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_witness_count */
Steem.prototype.getWitnessCount = function(callback) {
	this.send('database_api', {
		'method': 'get_witness_count'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_active_witnesses */
Steem.prototype.getActiveWitnesses = function(callback) {
	this.send('database_api', {
		'method': 'get_active_witnesses'
	}, function(err, result) {
		callback(err, result);
	});
};

/* get_miner_queue */
Steem.prototype.getMinerQueue = function(callback) {
	this.send('database_api', {
		'method': 'get_miner_queue'
	}, function(err, result) {
		callback(err, result);
	});
};


// [Stream]

Steem.prototype.streamBlockNumber = function(callback) {
	var current = '';
	var ws = new Ws(this.url);

	ws.onmessage = function(msg) {
		var data = JSON.parse(msg.data);
		var blockId = data.result.head_block_number;
		if (blockId != current) {
			current = blockId;
			callback(null,current);
		}
	};

	ws.onopen = function() {
		setInterval(function() {
			ws.send(JSON.stringify({
				'id': 0,
				'method': 'get_dynamic_global_properties',
				'params': []
			}));
		}, 200);
	};

	ws.onerror = function(error){
		callback(error, null)
	};
};

Steem.prototype.streamBlock = function(callback) {
	var ws = new Ws(this.url);
	var current = '';
	var last = '';
	this.streamBlockNumber(function(err, id) {
		current = id;
	});

	var self = this;
	ws.onopen = function() {
		setInterval(function() {
			if (current != last) {
				last = current;
				self.getBlock(current, function(err, result) {
					callback(null, result);
				});
			}
		}, 200);
	};

	ws.onerror = function(error){
		callback(error, null)
	};
};

Steem.prototype.streamTransactions = function(callback) {
	this.streamBlock(function(err, result) {
		if (!!result) {
			result.transactions.forEach(function(transaction) {
				callback(null, transaction);
			});
		}
	})
};

Steem.prototype.streamOperations = function(callback) {
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