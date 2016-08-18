var Steem = require('./lib/steem'),
	steem = new Steem();

steem.getAccountCount(function(err, result) {
	console.log(err, result);
});

steem.getAccounts(['dan'], function(err, result) {
	console.log(err, result);
});

steem.getState('trending/steemit', function(err, result) {
	console.log(err, result);
});

steem.getFollowing('ned', 0, 'blog', 10, function(err, result) {
	console.log(err, result);
});

steem.getFollowers('dan', 0, 'blog', 10, function(err, result) {
	console.log(err, result);
});