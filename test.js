var steem = require('./lib/steem');
var Steem = new steem();

var data = {
	'id': 1,
	'method': 'get_accounts',
	'params': [['steemit']]
};

Steem.send(data, function(result, err) {
	console.log(result, err);
});