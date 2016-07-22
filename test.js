var steem = require('./lib/steem');
var Steem = new steem();

var data = {
	'id': 1,
	'method': 'get_account_count'
};

Steem.send(data, function(result, err) {
	console.log(result, err);
});

Steem.getAccountCount(function(result, err) {
	console.log(result, err);
});