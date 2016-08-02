var Steem = require('./lib/steem'),
	steem = new Steem('wss://steemit.com/wstmp3');


steem.getAccounts(['dan', 'ned'], function(err, result) {
	console.log(err, result);
});

steem.getAccountCount(function(err, result) {
	console.log(err, result);
});

steem.getConfig(function(err, result) {
	console.log(err, result);
});

steem.getState('trending', function(err, result) {
	console.log(err, result);
});

steem.streamBlockNumber(function(err, result) {
	console.log(err, result);
});

steem.login('dan', '**********', function(err, result) {
	steem.getApiByName('network_broadcast_api', function(err, result) {
		console.log(err, result);
	})
});