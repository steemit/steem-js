var Steem = require('./lib/steem'),
	steem = new Steem('wss://steemit.com/wstmp3');

steem.getAccounts(['ned', 'dan'], function(err, result) {
	console.log(err, result);
});