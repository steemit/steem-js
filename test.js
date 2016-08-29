var steem = require('./index');

var username = process.env.STEEM_USERNAME;
var password = process.env.STEEM_PASSWORD;
var wif = steem.auth.toWif(username, password, 'posting');

steem.broadcast.vote(wif, username, 'calaber24p', 'why-i-have-decided-to-stop-powering-down-my-steem-power-for-the-long-term', 10000, function(err, result) {
	console.log(err, result);
});