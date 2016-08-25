var moment = require('moment'),
	steemAuth = require('../../steemauth/index.js'),
	steemApi = require('./api');
	formatter = require('./formatter');

/*
vote: 0,
comment: 1,
transfer: 2,

TODO
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
	vote: function(username, password, author, permlink, weight, callback) {
		var tx = {
			extensions: [],
			operations: [['vote', {
				voter: username,
				author: author,
				permlink: permlink,
				weight: weight
			}]]
		};
		var privKeys = steemAuth.getPrivateKeys(username, password, ['posting']);
		this.send(tx, privKeys, function(err, result) {
			callback(err, result);
		})
	},
	upvote: function(username, password, author, permlink, weight, callback) {
		weight = weight || 10000;
		vote(username, password, author, permlink, weight, function(err, result) {
			callback(err, result);
		})
	},
	downvote: function(username, password, author, permlink, weight, callback) {
		weight = weight || 10000;
		vote(username, password, author, permlink, -Math.abs(weight), function(err, result) {
			callback(err, result);
		})
	},
	comment: function(username, password, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, callback) {
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
		var privKeys = steemAuth.getPrivateKeys(username, password, ['posting']);
		this.send(tx, privKeys, function(err, result) {
			callback(err, result);
		})
	},
	transfer: function(username, password, from, to, amount, memo, callback) {
		var tx = {
			extensions: [],
			operations: [['transfer', {
				from: from,
				to: to,
				amount: amount,
				memo: memo
			}]]
		};
		var privKeys = steemAuth.getPrivateKeys(username, password, ['active']);
		this.send(tx, privKeys, function(err, result) {
			callback(err, result);
		})
	}
};