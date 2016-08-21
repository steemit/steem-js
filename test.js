var steem = require('./index');

var username = process.env.STEEM_USERNAME;
var password = process.env.STEEM_PASSWORD;

steem.broadcast.vote(username, password, 'infovore', 'mentorship-channel-for-artists-this-week-on-steemit-steemians-speak-behind-the-username-steemmag-steemit-s-weekend-digest-6-p-2', 10000, function(err, result) {
	console.log(err, result);
});