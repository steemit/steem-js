var steem = require('./index');

steem.api.login('******', '****************', function(err, result) {
	console.log(result);
	var trx = {
		expiration: '2016-08-20T02:59:51',
		extensions: [],
		operations: [['vote', {
			voter: 'siol',
			author: 'rogerkver',
			permlink: 'roger-ver-the-world-s-first-bitcoin-investor-is-now-on-steemit',
			weight: 10000
		}]],
		ref_block_num: 40607,
		ref_block_prefix: 2394871259,
		signatures: ['206239640514a1aac6ef29b0fdf7bf1f1457526a77bb4cb35bc82d7f614d271bb54783850b6da824db5cf787d7a7b9b8a1da5fd3d2c2ebf53437906fc93f45d238']
	};
	steem.api.broadcastTransaction(trx, function(err, result) {
		console.log(err, result);
	});
});