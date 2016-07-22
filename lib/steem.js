var ws = require('ws');

var Steem = function(url){
	this.url = url || 'wss://this.piston.rocks';
};

Steem.prototype.send = function(data, callback) {
	data.id = data.id || 0;
	var w = new ws(this.url);

	w.onmessage = function(msg) {
		var data = JSON.parse(msg.data);
		var err = data.error || '';
		callback(data.result, err);
	};

	w.onopen = function() {
		w.send(JSON.stringify(data));
	}
};


// Subscriptions

/* set_subscribe_callback */
Steem.prototype.setSubscribeCallback = function(cb, clearFilter, callback) {
	this.send({
		'method': 'set_subscribe_callback',
		'params': [cb, clearFilter]
	}, function(result, err) {
		callback(result, err);
	});
};

/* set_pending_transaction_callback */
Steem.prototype.setPendingTransactionCallback = function(cb, callback) {
	this.send({
		'method': 'set_pending_transaction_callback',
		'params': [cb]
	}, function(result, err) {
		callback(result, err);
	});
};

/* set_block_applied_callback */
Steem.prototype.setBlockAppliedCallback = function(cb, callback) {
	this.send({
		'method': 'set_block_applied_callback',
		'params': [cb]
	}, function(result, err) {
		callback(result, err);
	});
};

/* cancel_all_subscriptions */
Steem.prototype.cancelAllSubscriptions = function(callback) {
	this.send({
		'method': 'cancel_all_subscriptions'
	}, function(result, err) {
		callback(result, err);
	});
};


// tags

/* get_trending_tags */
Steem.prototype.getTrendingTags = function(afterTag, limit, callback) {
	this.send({
		'method': 'get_trending_tags',
		'params': [afterTag, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_trending */
Steem.prototype.getDiscussionsByTrending = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_trending',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_created */
Steem.prototype.getDiscussionsByCreated = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_created',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_active */
Steem.prototype.getDiscussionsByActive = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_active',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_cashout */
Steem.prototype.getDiscussionsByCashout = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_cashout',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_payout */
Steem.prototype.getDiscussionsByPayout = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_payout',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_votes */
Steem.prototype.getDiscussionsByVotes = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_votes',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_children */
Steem.prototype.getDiscussionsByChildren = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_children',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_hot */
Steem.prototype.getDiscussionsByHot = function(query, callback) {
	this.send({
		'method': 'get_discussions_by_hot',
		'params': [query]
	}, function(result, err) {
		callback(result, err);
	});
};


// Blocks and transactions

/* get_block_header */
Steem.prototype.getBlockHeader = function(blockNum, callback) {
	this.send({
		'method': 'get_block_header',
		'params': [blockNum]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_block */
Steem.prototype.getBlock = function(blockNum, callback) {
	this.send({
		'method': 'get_block',
		'params': [blockNum]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_state */
Steem.prototype.getState = function(path, callback) {
	this.send({
		'method': 'get_state',
		'params': [path]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_trending_categories */
Steem.prototype.getTrendingCategories = function(after, limit, callback) {
	this.send({
		'method': 'get_trending_categories',
		'params': [after, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_best_categories */
Steem.prototype.getBestCategories = function(after, limit, callback) {
	this.send({
		'method': 'get_best_categories',
		'params': [after, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_active_categories */
Steem.prototype.getActiveCategories = function(after, limit, callback) {
	this.send({
		'method': 'get_active_categories',
		'params': [after, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_recent_categories */
Steem.prototype.getRecentCategories = function(after, limit, callback) {
	this.send({
		'method': 'get_recent_categories',
		'params': [after, limit]
	}, function(result, err) {
		callback(result, err);
	});
};


// Globals

/* get_config */
Steem.prototype.getConfig = function(callback) {
	this.send({
		'method': 'get_config',
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_dynamic_global_properties */
Steem.prototype.getDynamicGlobalProperties = function(callback) {
	this.send({
		'method': 'get_dynamic_global_properties'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_chain_properties */
Steem.prototype.getChainProperties = function(after, limit, callback) {
	this.send({
		'method': 'get_chain_properties'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_feed_history */
Steem.prototype.getFeedHistory = function(callback) {
	this.send({
		'method': 'get_feed_history'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_current_median_history_price */
Steem.prototype.getCurrentMedianHistoryPrice = function(callback) {
	this.send({
		'method': 'get_current_median_history_price'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_witness_schedule */
Steem.prototype.getWitnessSchedule = function(callback) {
	this.send({
		'method': 'get_recent_categories',
		'params': [after, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_hardfork_version */
Steem.prototype.getHardforkVersion = function(callback) {
	this.send({
		'method': 'get_hardfork_version'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_next_scheduled_hardfork */
Steem.prototype.getNextScheduledHardfork = function(callback) {
	this.send({
		'method': 'get_next_scheduled_hardfork'
	}, function(result, err) {
		callback(result, err);
	});
};


// Keys

/* get_key_references */
Steem.prototype.getKeyReferences = function(key, callback) {
	this.send({
		'method': 'get_key_references',
		'params': [key]
	}, function(result, err) {
		callback(result, err);
	});
};


// Accounts

/* get_accounts */
Steem.prototype.getAccounts = function(names, callback) {
	this.send({
		'method': 'get_accounts',
		'params': [names]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_account_references */
Steem.prototype.getAccountReferences = function(accountId , callback) {
	this.send({
		'method': 'get_account_references',
		'params': [accountId]
	}, function(result, err) {
		callback(result, err);
	});
};

/* lookup_account_names */
Steem.prototype.lookupAccountNames = function(accountNames, callback) {
	this.send({
		'method': 'lookup_account_names',
		'params': [accountNames]
	}, function(result, err) {
		callback(result, err);
	});
};

/* lookup_accounts */
Steem.prototype.lookupAccounts = function(lowerBoundName, limit, callback) {
	this.send({
		'method': 'lookup_accounts',
		'params': [lowerBoundName, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_account_count */
Steem.prototype.getAccountCount = function(callback) {
	this.send({
		'method': 'get_account_count'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_conversion_requests */
Steem.prototype.getConversionRequests = function(accountName, callback) {
	this.send({
		'method': 'get_conversion_requests',
		'params': [accountName]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_account_history */
Steem.prototype.getAccountHistory = function(account, from, limit, callback) {
	this.send({
		'method': 'get_account_history',
		'params': [account, from, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_owner_history */
Steem.prototype.getOwnerHistory = function(account, callback) {
	this.send({
		'method': 'get_owner_history',
		'params': [account]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_recovery_request */
Steem.prototype.getRecoveryRequest = function(account, callback) {
	this.send({
		'method': 'get_recovery_request',
		'params': [account]
	}, function(result, err) {
		callback(result, err);
	});
};


// Market

/* get_order_book */
Steem.prototype.getOrderBook = function(limit, callback) {
	this.send({
		'method': 'getOrderBook',
		'params': [limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_open_orders */
Steem.prototype.getOpenOrders = function(owner, callback) {
	this.send({
		'method': 'get_open_orders',
		'params': [owner]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_liquidity_queue */
Steem.prototype.getLiquidityQueue = function(startAccount, limit, callback) {
	this.send({
		'method': 'get_liquidity_queue',
		'params': [startAccount, limit]
	}, function(result, err) {
		callback(result, err);
	});
};


// Authority / validation

/* get_transaction_hex */
Steem.prototype.getTransactionHex = function(trx, callback) {
	this.send({
		'method': 'get_transaction_hex',
		'params': [trx]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_transaction */
Steem.prototype.getTransaction = function(trxId, callback) {
	this.send({
		'method': 'get_transaction',
		'params': [trxId]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_required_signatures */
Steem.prototype.getRequiredSignatures = function(trx, availableKeys, callback) {
	this.send({
		'method': 'get_required_signatures',
		'params': [trx, availableKeys]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_potential_signatures */
Steem.prototype.getPotentialSignatures = function(trx, callback) {
	this.send({
		'method': 'get_potential_signatures',
		'params': [trx]
	}, function(result, err) {
		callback(result, err);
	});
};

/* verify_authority */
Steem.prototype.verifyAuthority = function(trx, callback) {
	this.send({
		'method': 'verify_authority',
		'params': [trx]
	}, function(result, err) {
		callback(result, err);
	});
};

/* verify_account_authority */
Steem.prototype.verifyAccountAuthority = function(nameOrId, signers, callback) {
	this.send({
		'method': 'verify_account_authority',
		'params': [nameOrId, signers]
	}, function(result, err) {
		callback(result, err);
	});
};


// votes

/* get_active_votes */
Steem.prototype.getActiveVotes = function(author, permlink, callback) {
	this.send({
		'method': 'get_active_votes',
		'params': [author, permlink]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_account_votes */
Steem.prototype.getAccountVotes = function(voter, callback) {
	this.send({
		'method': 'get_account_votes',
		'params': [voter]
	}, function(result, err) {
		callback(result, err);
	});
};


// content

/* get_content */
Steem.prototype.getContent = function(author, permlink, callback) {
	this.send({
		'method': 'get_content',
		'params': [author, permlink]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_content_replies */
Steem.prototype.getContentReplies = function(parent, parentPermlink, callback) {
	this.send({
		'method': 'get_content_replies',
		'params': [parent, parentPermlink]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_discussions_by_author_before_date */
Steem.prototype.getDiscussionsByAuthorBeforeDate = function(author, startPermlink, beforeDate, limit, callback) {
	this.send({
		'method': 'get_discussions_by_author_before_date',
		'params': [author, startPermlink, beforeDate, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_replies_by_last_update */
Steem.prototype.getRepliesByLastUpdate = function(startAuthor, startPermlink, limit, callback) {
	this.send({
		'method': 'get_replies_by_last_update',
		'params': [startAuthor, startPermlink, limit]
	}, function(result, err) {
		callback(result, err);
	});
};


// Witnesses

/* get_witnesses */
Steem.prototype.getWitnesses = function(witnessIds, callback) {
	this.send({
		'method': 'get_witnesses',
		'params': [witnessIds]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_witness_by_account */
Steem.prototype.getWitnessByAccount = function(accountName, callback) {
	this.send({
		'method': 'get_witness_by_account',
		'params': [accountName]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_witnesses_by_vote */
Steem.prototype.getWitnessesByVote = function(from, limit, callback) {
	this.send({
		'method': 'get_witnesses_by_vote',
		'params': [from, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* lookup_witness_accounts */
Steem.prototype.lookupWitnessAccounts = function(lowerBoundName, limit, callback) {
	this.send({
		'method': 'lookup_witness_accounts',
		'params': [lowerBoundName, limit]
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_witness_count */
Steem.prototype.getWitnessCount = function(callback) {
	this.send({
		'method': 'get_witness_count'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_active_witnesses */
Steem.prototype.getActiveWitnesses = function(callback) {
	this.send({
		'method': 'get_active_witnesses'
	}, function(result, err) {
		callback(result, err);
	});
};

/* get_miner_queue */
Steem.prototype.getMinerQueue = function(callback) {
	this.send({
		'method': 'get_miner_queue'
	}, function(result, err) {
		callback(result, err);
	});
};


// Stream

Steem.prototype.streamBlockNumber = function(callback) {
	var current = '';
	var w = new ws(this.url);

	w.onmessage = function(msg) {
		var data = JSON.parse(msg.data);
		var blockId = data.result.head_block_number;
		if (blockId != current) {
			current = blockId;
			callback(current);
		}
	};

	w.onopen = function() {
		setInterval(function () {
			w.send(JSON.stringify({
				'id': 0,
				'method': 'get_dynamic_global_properties',
				'params': []
			}));
		}, 100);
	}
};

Steem.prototype.streamBlock = function(callback) {
	var w = new ws(this.url);
	var current = '';
	var last = '';
	this.streamBlockNumber(function(id) {
		current = id;
	});

	var self = this;
	w.onopen = function() {
		setInterval(function () {
			if (current != last) {
				last = current;
				self.getBlock(current, function(result) {
					callback(result);
				});
			}
		}, 100);
	}
};

Steem.prototype.streamTransactions = function(callback) {
	this.streamBlock(function(result) {
		result.transactions.forEach(function (transaction) {
			callback(transaction);
		});
	})
};

Steem.prototype.streamOperations = function(callback) {
	this.streamBlock(function(result) {
		result.transactions.forEach(function (transaction) {
			transaction.operations.forEach(function (operation) {
				callback(operation);
			});
		});
	})
};


module.exports = Steem;