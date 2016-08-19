var steem = require('./index');

steem.api.login('******', '****************', function(err, result) {
	console.log(result);
	var trx = {
		expiration: '2016-08-13T05:44:15',
		extensions: [],
		operations: [['vote', {
			voter: '******',
			author: 'calaber24p',
			permlink: '5zebtb-the-future-the-possibility-of-capturing-memories-and-reliving-them',
			weight: 100
		}]],
		ref_block_num: 40289,
		ref_block_prefix: 3483617648,
		signatures: ['10f7ce6fc9f5bc99fe789af9e464ff62e6b676622611abd22ed332f20649797b13e0ff85a1be1b72bc26f2ba0d4bf6eStef']
	};
	steem.api.broadcastTransaction(trx, function(err, result) {
		console.log(err, result);
	});
});