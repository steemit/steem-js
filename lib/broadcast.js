var moment = require('moment'),
	steemAuth = require('../../steemauth/index.js'),
	steemApi = require('./api');
	formatter = require('./formatter');

/*
vote: 0,
comment: 1,
transfer: 2,
transfer_to_vesting: 3,
withdraw_vesting: 4,
limit_order_create: 5,
limit_order_cancel: 6,
feed_publish: 7,
convert: 8,
account_create: 9,
account_update: 10,
witness_update: 11,
account_witness_vote: 12,
account_witness_proxy: 13,
pow: 14,
custom: 15,
report_over_production: 16,
delete_comment: 17,
custom_json: 18,
comment_options: 19,
set_withdraw_vesting_route: 20,
limit_order_create2: 21,
challenge_authority: 22,
prove_authority: 23,
request_account_recovery: 24,
recover_account: 25,
change_recovery_account: 26,
escrow_transfer: 27,
escrow_dispute: 28,
escrow_release: 29,
fill_convert_request: 30,
comment_reward: 31,
curate_reward: 32,
liquidity_reward: 33,
interest: 34,
fill_vesting_withdraw: 35,
fill_order: 36,
comment_payout: 37

TODO
*/

module.exports = {
	send: function(tx, privKeys, callback) {
		steemApi.login('', '', function() {
			steemApi.getDynamicGlobalProperties(function(err, result) {
				tx.expiration = moment.utc(result.timestamp).add(15, 'second').format().replace('Z', '');
				tx.ref_block_num = result.head_block_number & 0xFFFF;
				tx.ref_block_prefix =  new Buffer(result.head_block_id, 'hex').readUInt32LE(4);
				var signedTransaction = steemAuth.signTransaction(tx, privKeys);
				steemApi.broadcastTransactionWithCallback(function(){}, signedTransaction, function(err, result) {
					callback(err, result);
				});
			});
		});
	},
	vote: function(wif, voter, author, permlink, weight, callback) {
		var tx = {
			extensions: [],
			operations: [['vote', {
				voter: voter,
				author: author,
				permlink: permlink,
				weight: weight
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result);
		})
	},
	upvote: function(wif, voter, author, permlink, weight, callback) {
		weight = weight || 10000;
		vote(wif, author, permlink, weight, function(err, result) {
			callback(err, result);
		})
	},
	downvote: function(wif, voter, author, permlink, weight, callback) {
		weight = weight || 10000;
		vote(wif, author, permlink, -Math.abs(weight), function(err, result) {
			callback(err, result);
		})
	},
	comment: function(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, callback) {
		permlink = permlink || formatter.commentPermlink(parentAuthor, parentPermlink);
		var tx = {
			extensions: [],
			operations: [['comment', {
				parent_author: parentAuthor,
				parent_permlink: parentPermlink,
				author: author,
				permlink: permlink,
				title: title,
				body: body,
				json_metadata: JSON.stringify(jsonMetadata)
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result);
		})
	},
	transfer: function(wif, from, to, amount, memo, callback) {
		var tx = {
			extensions: [],
			operations: [['transfer', {
				from: from,
				to: to,
				amount: amount,
				memo: memo
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result);
		})
	},
	transfer_to_vesting: function(wif, from, to, amount, callback) {
		var tx = {
			extensions: [],
			operations: [['transfer_to_vesting',{
				from: from,
				to: to,
				amount: amount
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result);
		})
	},
	withdraw_vesting: function(wif, account, vestingShares, callback) {
		var tx = {
			extensions: [],
			operations: [['withdraw_vesting',{
				account: account,
    			vesting_shares: vestingShares
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result);
		})
	},
	limit_order_create: function(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration, callback) {
		var tx = {
			extensions: [],
			operations:[['limit_order_create',{
				owner: owner,
				orderid: orderid,
				amount_to_sell: amountToSell,
				min_to_receive: minToReceive,
				fill_or_kill: fillOrKill,
				expiration: expiration
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	limit_order_cancel: function(wif, owner, orderid, callback) {
		var tx = {
			extensions: [],
			operations:[['limit_order_cancel',{
				owner: owner,
				orderid: orderid
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	feed_publish: function(wif, publisher, exchangeRate, callback) {
		var tx = {
			extensions: [],
			operations:[['feed_publish',{
				publisher: publisher,
				exchange_rate: exchangeRate
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	convert: function(wif, owner, requestid, amount, callback) {
		var tx = {
			extensions: [],
			operations:[['convert',{
				owner: owner,
				requestid: requestid,
				amount: amount
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	account_create: function(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, callback) {
		var tx = {
			extensions: [],
			operations:[['account_create',{
				fee: fee,
				creator: creator,
				new_account_name: newAccountName,
				owner: owner,
				active: active,
				posting: posting,
				memo_key: memoKey,
				json_metadata: JSON.stringify(jsonMetadata)
			}]]
		};
		this.send(tx, {owner: wif}, function(err, result) {
			callback(err, result)
		})
	},
	account_update: function(wif, account, owner, active, posting, memoKey, jsonMetadata, callback) {
		var tx = {
			extensions: [],
			operations:[['account_update',{
				account: account,
				owner: owner,
				active: active,
				posting: posting,
				memo_key: memoKey,
				json_metadata: JSON.stringify(jsonMetadata)
			}]]
		};
		this.send(tx, {owner: wif}, function(err, result) {
			callback(err, result)
		})
	},
	witness_update: function(wif, owner, url, blockSigningKey, props, fee, callback) {
		var tx = {
			extensions: [],
			operations:[['witness_update',{
				owner: owner,
				url: url,
				block_signing_key: blockSigningKey,
				props: props,
				fee: fee
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	account_witness_vote: function(wif, account, witness, approve, callback) {
		var tx = {
			extensions: [],
			operations:[['account_witness_vote',{
				account: account,
				witness: witness,
				approve: approve
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	account_witness_proxy: function(wif, account, proxy, callback) {
		var tx = {
			extensions: [],
			operations:[['account_witness_proxy',{
				account: account,
				proxy: proxy
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	pow: function(wif, worker, input, signature, work, callback) {
		var tx = {
			extensions: [],
			operations:[['pow',{
				worker: worker,
				input: input,
				signature: signature,
				work: work
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	custom: function(wif, requiredAuths, id, data, callback) {
		var tx = {
			extensions: [],
			operations:[['custom',{
				required_auths: requiredAuths,
				id: id,
				data: data
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	report_over_production: function(wif, reporter, firstBlock, secondBlock, callback) {
		var tx = {
			extensions: [],
			operations:[['report_over_production',{
				reporter: reporter,
				first_block: firstBlock,
				second_block: secondBlock
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	delete_comment: function(wif, author, permlink, callback) {
		var tx = {
			extensions: [],
			operations:[['delete_comment',{
				author: author,
				permlink: permlink
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	custom_json: function(wif, requiredAuths, requiredPostingAuths, id, json, callback) {
		var tx = {
			extensions: [],
			operations:[['custom_json',{
				required_auths: requiredAuths,
				required_posting_auths: requiredPostingAuths,
				id: id,
				json: json
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	comment_options: function(wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes, allowCurationRewards, extensions, callback) {
		var tx = {
			extensions: [],
			operations:[['comment_options',{
				author: author,
				permlink: permlink,
				max_accepted_payout: maxAcceptedPayout,
				percent_steem_dollars: percentSteemDollars,
				allow_votes: allowVotes,
				allow_curation_rewards: allowCurationRewards,
				extensions: extensions
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	set_withdraw_vesting_route: function(wif, fromAccount, toAccount, percent, autoVest, callback) {
		var tx = {
			extensions: [],
			operations:[['set_withdraw_vesting_route',{
				from_account: fromAccount,
				to_account: toAccount,
				percent: percent,
				auto_vest: autoVest
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	limit_order_create2: function(wif, owner, orderid, amountToSell, exchangeRate, fillOrKill, expiration, callback) {
		var tx = {
			extensions: [],
			operations:[['limit_order_create2',{
				owner: owner,
				orderid: orderid,
				amount_to_sell: amountToSell,
				exchange_rate: exchangeRate,
				fill_or_kill: fillOrKill,
				expiration: expiration
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	challenge_authority: function(wif, challenger, challenged, requireOwner, callback){
		var tx = {
			extensions: [],
			operations: [['challenge_authority',{
				challenger: challenger,
				challenged: challenged,
				require_owner: requireOwner
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	prove_authority: function(wif, challenged, requireOwner, callback){
		var tx = {
			extensions: [],
			operations: [['prove_authority',{
				challenged: challenged,
				require_owner: requireOwner
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	request_account_recovery: function(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions, callback){
		var tx = {
			extensions: [],
			operations: [['request_account_recovery',{
				recovery_account: recoveryAccount,
				account_to_recover: accountToRecover,
				new_owner_authority: newOwnerAuthority,
				extensions: extensions
			}]]
		};
		this.send(tx, {owner: wif}, function(err, result) {
			callback(err, result)
		})
	},
	recover_account: function(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions, callback){
		var tx = {
			extensions: [],
			operations: [['recover_account',{
				account_to_recover: accountToRecover,
				new_owner_authority: newOwnerAuthority,
				recent_owner_authority: recentOwnerAuthority,
				extensions: extensions
			}]]
		};
		this.send(tx, {owner: wif}, function(err, result) {
			callback(err, result)
		})
	},
	change_recovery_account: function(wif, accountToRecover, newRecoveryAccount, extensions, callback){
		var tx = {
			extensions: [],
			operations: [['change_recovery_account',{
				account_to_recover: accountToRecover,
				new_recovery_account: newRecoveryAccount,
				extensions: extensions
			}]]
		};
		this.send(tx, {owner: wif}, function(err, result) {
			callback(err, result)
		})
	},
	escrow_transfer: function(wif, from, to, amount, memo, escrowId, agent, fee, jsonMeta, expiration, callback){
		var tx = {
			extensions: [],
			operations: [['escrow_transfer',{
				from: from,
				to: to,
				amount: amount,
				memo: memo,
				escrow_id: escrowId,
				agent: agent,
				fee: fee,
				json_meta: jsonMeta,
				expiration: expiration
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	escrow_dispute: function(wif, from, to, escrowId, who, callback){
		var tx = {
			extensions: [],
			operations: [['escrow_dispute',{
				from: from,
				to: to,
				escrow_id: escrowId,
				who: who
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	escrow_release: function(wif, from, to, escrowId, who, amount, callback){
		var tx = {
			extensions: [],
			operations: [['escrow_release',{
				from: from,
				to: to,
				escrow_id: escrowId,
				who: who,
				amount: amount
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	fill_convert_request: function(wif, owner, requestid, amountIn, amountOut, callback){
		var tx = {
			extensions: [],
			operations: [['fill_convert_request',{
				owner: owner,
				requestid: requestid,
				amount_in: amountIn,
				amount_out: amountOut
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	comment_reward: function(wif, author, permlink, sbdPayout, vestingPayout, callback){
		var tx = {
			extensions: [],
			operations: [['comment_reward',{
				author: author,
				permlink: permlink,
				sbd_payout: sbdPayout,
				vesting_payout: vestingPayout
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	curate_reward: function(wif, curator, reward, commentAuthor, commentPermlink, callback){
		var tx = {
			extensions: [],
			operations: [['curate_reward',{
				curator: curator,
				reward: reward,
				comment_author: commentAuthor,
				comment_permlink: commentPermlink
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	liquidity_reward: function(wif, owner, payout, callback){
		var tx = {
			extensions: [],
			operations: [['liquidity_reward',{
				owner: owner,
				payout: payout
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	interest: function(wif, owner, interest, callback){
		var tx = {
			extensions: [],
			operations: [['interest',{
				owner: owner,
				interest: interest
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	fill_vesting_withdraw: function(wif, fromAccount, toAccount, withdrawn, deposited, callback){
		var tx = {
			extensions: [],
			operations: [['fill_vesting_withdraw',{
				from_account: fromAccount,
				to_account: toAccount,
				withdrawn: withdrawn,
				deposited: deposited
			}]]
		};
		this.send(tx, {active: wif}, function(err, result) {
			callback(err, result)
		})
	},
	fill_order: function(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, callback){
		var tx = {
			extensions: [],
			operations: [['fill_order',{
				current_owner: currentOwner,
				current_orderid: currentOrderid,
				current_pays: currentPays,
				open_owner: openOwner,
				open_orderid: openOrderid,
				open_pays: openPays
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	},
	comment_payout: function(wif, author, permlink, payout, callback){
		var tx = {
			extensions: [],
			operations: [['comment_payout',{
				author: author,
				permlink: permlink,
				payout: payout
			}]]
		};
		this.send(tx, {posting: wif}, function(err, result) {
			callback(err, result)
		})
	}

};
