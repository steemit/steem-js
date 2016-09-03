var steem = require('./index');

var username = process.env.STEEM_USERNAME;
var password = process.env.STEEM_PASSWORD;
var wif = steem.auth.toWif(username, password, 'posting');

/*
steem.broadcast.comment(wif, '', 'steemjs', username, 'this-is-a-test', 'Test Title', 'Hello World!', {tags: ['steemjs', 'steem']}, function(err, result) {
	console.log(err, result);
});

steem.broadcast.vote(wif, username, 'tralawar', 'i-love-life-1-so-you-say-aren-t-a-coder-but-you-are-food-for-thought', 10000, function(err, result) {
	console.log(err, result);
});
*/

username = 'guest456';
password = 'YYYY';
var owner = steem.auth.toWif(username, password, 'owner');
var active = steem.auth.toWif(username, password, 'active');
var posting = steem.auth.toWif(username, password, 'posting');
var memoKey = steem.auth.toWif(username, password, 'memoKey');

var creator = 'fabien';
var creatorWif = steem.auth.toWif(creator, 'XXXX', 'active');

steem.broadcast.accountCreate(creatorWif, '3.000 STEEM', 'fabien', 'steemconnect', owner, active, posting, memoKey, '', function(err, result) {
	console.log(err, result);
});