var moment = require('moment'),
steemAuth = require('../../steemauth/index.js'),
steemApi = require('./api');
formatter = require('./formatter');

// todo operations
// operations["vote"] = 0
// operations["comment"] = 1
// operations["transfer"] = 2
// operations["transfer_to_vesting"] = 3
// operations["withdraw_vesting"] = 4
// operations["limit_order_create"] = 5
// operations["limit_order_cancel"] = 6
// operations["feed_publish"] = 7
// operations["convert"] = 8
// operations["account_create"] = 9
// operations["account_update"] = 10
// operations["witness_update"] = 11
// operations["account_witness_vote"] = 12
// operations["account_witness_proxy"] = 13
// operations["pow"] = 14
// operations["custom"] = 15
// operations["report_over_production"] = 16
// operations["delete_comment"] = 17
// operations["custom_json"] = 18
// operations["comment_options"] = 19
// operations["set_withdraw_vesting_route"] = 20
// operations["limit_order_create2"] = 22
// operations["challenge_authority"] = 23
// operations["prove_authority"] = 24
// operations["request_account_recovery"] = 25
// operations["recover_account"] = 26
// operations["change_recovery_account"] = 27
// operations["escrow_transfer"] = 28
// operations["escrow_dispute"] = 29
// operations["escrow_release"] = 30
// # virtual operations below this point"
// #operations["fill_convert_request"] = 0
// #operations["comment_reward"] = 0
// #operations["curate_reward"] = 0
// #operations["liquidity_reward"] = 0
// #operations["interest"] = 0
// #operations["fill_vesting_withdraw"] = 0
// #operations["fill_order"] = 0
// #operations["comment_payout"] = 0

module.exports = {
	send: function(username, password, tx, privKeys, cb) {
		steemApi.login(username, password, function() {
			steemApi.getDynamicGlobalProperties(function(err, result) {
				tx.expiration = moment.utc(result.timestamp).add(15, 'second').format().replace('Z', '');
				tx.ref_block_num = result.head_block_number & 0xFFFF;
				tx.ref_block_prefix =  new Buffer(result.head_block_id, 'hex').readUInt32LE(4);
				var signedTransaction = steemAuth.signTransaction(tx, privKeys);
				steemApi.broadcastTransactionWithCallback(function(){}, signedTransaction, function(err, result) {
					cb(err, result);
				});
			});
		});
	},
	vote: function(username, password, author, permlink, weight, cb) {
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
		this.send(username, password, tx, privKeys, function(err, result) {
			cb(err, result);
		})
	},
	upvote: function(username, password, author, permlink, cb) {
		vote(username, password, author, permlink, 10000, function(err, result) {
			cb(err, result);
		})
	},
	downvote: function(username, password, author, permlink, cb) {
		vote(username, password, author, permlink, -10000, function(err, result) {
			cb(err, result);
		})
	},
	comment: function(username, password, title, body, tags, parent_author, parent_permlink, cb) {
		var permlink = formatter.derivePermlink(title, parent_permlink)
		if (!tags || tags.length == 0) tags = ['testing']
		if (!parent_permlink) parent_permlink = formatter.derivePermlink(tags[0])
		if (!parent_author) parent_author = '';
		var json_metadata = {
			tags: tags,
			sentWith: 'SteemJS'
		};
		var tx = {
			extensions: [],
			operations: [['comment', {
				parent_author: parent_author,
				parent_permlink: parent_permlink,
				author: username,
				permlink: permlink,
				title: title,
				body: body,
				json_metadata: JSON.stringify(json_metadata)
			}]]
		};
		var privKeys = steemAuth.getPrivateKeys(username, password, ['posting']);
		this.send(username, password, tx, privKeys, function(err, result) {
			cb(err, result);
		})
	},
	post: function(username, password, title, body, tags, cb) {
		this.comment(username, password, title, body, tags, null, null, function(e,r) {
			cb(e,r);
		})
	},
	reply: function(username, password, parent_author, parent_permlink, body, cb) {
		this.comment(username, password, body.substr(0, 30), body, null, parent_author, parent_permlink, function(e,r) {
			cb(e,r);
		})
	},
	transfer: function(username, password, to, amount, asset, memo, cb) {
		if (amount.toFixed(3) <= 0) cb('Cannot transfer a negative amount (aka: stealing)');
		if (asset != 'SBD' && asset != 'STEEM') cb('Wrong asset. Must be STEEM or SBD');
		var tx = {
			extensions: [],
			operations: [['transfer', {
				from: username,
				to: to,
				amount: formatter.amount(amount, asset),
				memo: memo
			}]]
		};
		var privKeys = steemAuth.getPrivateKeys(username, password, ['active']);
		this.send(username, password, tx, privKeys, function(err, result) {
			cb(err, result);
		})
	}
};
