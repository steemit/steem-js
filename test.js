var Steem = require('./lib/steem'),
	steem = new Steem('wss://steemit.com/wstmp3');

steem.getApiByName('steemjs', 0, 10, function(err, result) {
	console.log(err, result);
});