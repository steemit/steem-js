var moment = require('moment'),
	steemAuth = require('steemauth'),
	steemApi = require('./api');

module.exports = {
	send: function(username, password, tx, privKeys, callback) {
		steemApi.login(username, password, function() {
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
		this.send(username, password, tx, privKeys, function(err, result) {
			callback(err, result);
		})
	}
};