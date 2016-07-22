var Steem = require('./lib/steem');
var steem = new Steem();

steem.getAccounts(['ned', 'dan'], function(result, err) {
	console.log(result, err);
});