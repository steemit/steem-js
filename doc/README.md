# Documentation

## Install
```
$ npm install steem --save
```

## Subscriptions
### Set Subscribe Callback
```js 
steem.api.setSubscribeCallback(cb, clearFilter, function(err, result) {
	console.log(err, result);
});
```
### Set Pending Transaction Callback
```js 
steem.api.setPendingTransactionCallback(cb, function(err, result) {
	console.log(err, result);
});
```
### Set Block Applied Callback
```js 
steem.api.setBlockAppliedCallback(cb, function(err, result) {
	console.log(err, result);
});
```
### Cancel All Subscriptions
```js 
steem.api.cancelAllSubscriptions(function(err, result) {
	console.log(err, result);
});
```

## Tags
### Get Trending Tags
```js 
steem.api.getTrendingTags(afterTag, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Trending
```js 
steem.api.getDiscussionsByTrending(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Created
```js 
steem.api.getDiscussionsByCreated(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Active
```js 
steem.api.getDiscussionsByActive(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Cashout
```js 
steem.api.getDiscussionsByCashout(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Payout
```js 
steem.api.getDiscussionsByPayout(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Votes
```js 
steem.api.getDiscussionsByVotes(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Children
```js 
steem.api.getDiscussionsByChildren(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Hot
```js 
steem.api.getDiscussionsByHot(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Feed
```js 
steem.api.getDiscussionsByFeed(query, function(err, result) {
	console.log(err, result);
});
```

## Blocks And Transactions
### Get Block Header
```js 
steem.api.getBlockHeader(blockNum, function(err, result) {
	console.log(err, result);
});
```
### Get Block
```js 
steem.api.getBlock(blockNum, function(err, result) {
	console.log(err, result);
});
```
### Get State
```js 
steem.api.getState(path, function(err, result) {
	console.log(err, result);
});
```
### Get Trending Categories
```js 
steem.api.getTrendingCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Best Categories
```js 
steem.api.getBestCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Active Categories
```js 
steem.api.getActiveCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Recent Categories
```js 
steem.api.getRecentCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```

## Globals
### Get Config
```js 
steem.api.getConfig(function(err, result) {
	console.log(err, result);
});
```
### Get Dynamic Global Properties
```js 
steem.api.getDynamicGlobalProperties(function(err, result) {
	console.log(err, result);
});
```
### Get Chain Properties
```js 
steem.api.getChainProperties(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Feed History
```js 
steem.api.getFeedHistory(function(err, result) {
	console.log(err, result);
});
```
### Get Current Median History Price
```js 
steem.api.getCurrentMedianHistoryPrice(function(err, result) {
	console.log(err, result);
});
```
### Get Witness Schedule
```js 
steem.api.getWitnessSchedule(function(err, result) {
	console.log(err, result);
});
```
### Get Hardfork Version
```js 
steem.api.getHardforkVersion(function(err, result) {
	console.log(err, result);
});
```
### Get Next Scheduled Hardfork
```js 
steem.api.getNextScheduledHardfork(function(err, result) {
	console.log(err, result);
});
```

## Keys
### Get Key References
```js 
steem.api.getKeyReferences(key, function(err, result) {
	console.log(err, result);
});
```

## Accounts
### Get Accounts
```js 
steem.api.getAccounts(names, function(err, result) {
	console.log(err, result);
});
```
### Get Account References
```js 
steem.api.getAccountReferences(accountId, function(err, result) {
	console.log(err, result);
});
```
### Lookup Account Names
```js 
steem.api.lookupAccountNames(accountNames, function(err, result) {
	console.log(err, result);
});
```
### Lookup Accounts
```js 
steem.api.lookupAccounts(lowerBoundName, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Account Count
```js 
steem.api.getAccountCount(function(err, result) {
	console.log(err, result);
});
```
### Get Conversion Requests
```js 
steem.api.getConversionRequests(accountName, function(err, result) {
	console.log(err, result);
});
```
### Get Account History
```js 
steem.api.getAccountHistory(account, from, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Owner History
```js 
steem.api.getOwnerHistory(account, function(err, result) {
	console.log(err, result);
});
```
### Get Recovery Request
```js 
steem.api.getRecoveryRequest(account, function(err, result) {
	console.log(err, result);
});
```

## Market
### Get Order Book
```js 
steem.api.getOrderBook(limit, function(err, result) {
	console.log(err, result);
});
```
### Get Open Orders
```js 
steem.api.getOpenOrders(owner, function(err, result) {
	console.log(err, result);
});
```
### Get Liquidity Queue
```js 
steem.api.getLiquidityQueue(startAccount, limit, function(err, result) {
	console.log(err, result);
});
```

## Authority / Validation
### Get Transaction Hex
```js 
steem.api.getTransactionHex(trx, function(err, result) {
	console.log(err, result);
});
```
### Get Transaction
```js 
steem.api.getTransaction(trxId, function(err, result) {
	console.log(err, result);
});
```
### Get Required Signatures
```js 
steem.api.getRequiredSignatures(trx, availableKeys, function(err, result) {
	console.log(err, result);
});
```
### Get Potential Signatures
```js 
steem.api.getPotentialSignatures(trx, function(err, result) {
	console.log(err, result);
});
```
### Verify Authority
```js 
steem.api.verifyAuthority(trx, function(err, result) {
	console.log(err, result);
});
```
### Verify Account Authority
```js 
steem.api.verifyAccountAuthority(nameOrId, signers, function(err, result) {
	console.log(err, result);
});
```

## Votes
### Get Active Votes
```js 
steem.api.getActiveVotes(author, permlink, function(err, result) {
	console.log(err, result);
});
```
### Get Account Votes
```js 
steem.api.getAccountVotes(voter, function(err, result) {
	console.log(err, result);
});
```

## Content
### Get Content
```js 
steem.api.getContent(author, permlink, function(err, result) {
	console.log(err, result);
});
```
### Get Content Replies
```js 
steem.api.getContentReplies(parent, parentPermlink, function(err, result) {
	console.log(err, result);
});
```
### Get Discussion By Author Before Date
```js 
steem.api.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Replies By Last Update
```js 
steem.api.getRepliesByLastUpdate(startAuthor, startPermlink, limit, function(err, result) {
	console.log(err, result);
});
```

## Witnesses
### Get Witnesses
```js 
steem.api.getWitnesses(witnessIds, function(err, result) {
	console.log(err, result);
});
```
### Get Witness By Account
```js 
steem.api.getWitnessByAccount(accountName, function(err, result) {
	console.log(err, result);
});
```
### Get Witnesses By Vote
```js 
steem.api.getWitnessesByVote(from, limit, function(err, result) {
	console.log(err, result);
});
```
### Lookup Witness Accounts
```js 
steem.api.lookupWitnessAccounts(lowerBoundName, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Witness Count
```js 
steem.api.getWitnessCount(function(err, result) {
	console.log(err, result);
});
```
### Get Active Witnesses
```js 
steem.api.getActiveWitnesses(function(err, result) {
	console.log(err, result);
});
```
### Get Miner Queue
```js 
steem.api.getMinerQueue(function(err, result) {
	console.log(err, result);
});
```

## Login
```js
steem.api.login('ned', '****************', function(err, result) {
	console.log(err, result);
});
```

## Follow
### Get Followers
```js 
steem.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Following
```js 
steem.api.getFollowing(follower, startFollowing, followType, limit, function(err, result) {
	console.log(err, result);
});
```

## Broadcast
### Broadcast Transaction
```js 
steem.api.broadcastTransaction(trx, function(err, result) {
	console.log(err, result);
});
```
### Broadcast Transaction Synchronous
```js 
steem.api.broadcastTransactionSynchronous(trx, function(err, result) {
	console.log(err, result);
});
```
### Broadcast Block
```js 
steem.api.broadcastBlock(b, function(err, result) {
	console.log(err, result);
});
```
### Broadcast Transaction With Callback
```js 
steem.api.broadcastTransactionWithCallback(confirmationCallback, trx, function(err, result) {
	console.log(err, result);
});
```

## Stream
### Stream Block Number
```js 
steem.api.streamBlockNumber(function(err, result) {
	console.log(err, result);
});
```
### Stream Block
```js 
steem.api.streamBlock(function(err, result) {
	console.log(err, result);
});
```
### Stream Transactions
```js 
steem.api.streamTransactions(function(err, result) {
	console.log(err, result);
});
```
### Stream Operations
```js 
steem.api.streamOperations(function(err, result) {
	console.log(err, result);
});
```

## Formatter
### Reputation
```js 
var reputation = steem.formatter.reputation(user.reputation);
console.log(reputation);
```
### Vest To Steem
```js 
var power = steem.formatter.vestToSteem(user.vesting_shares, props.total_vesting_shares, props.total_vesting_fund_steem)
console.log(power);
```

## Broadcast
### Vote
```js
var steem = require('steem');

var wif = steem.auth.toWif(username, password, 'posting');
steem.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
	console.log(err, result);
});
```
### UpVote
```js
steem.broadcast.upvote(wif, voter, author, permlink, weight, function(err, result) {
	console.log(err, result);
});
```
### DownVote
```js
steem.broadcast.downvote(wif, voter, author, permlink, weight, function(err, result) {
	console.log(err, result);
});
```
### Comment
```js
steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
	console.log(err, result);
});
```
### Transfer
```js
steem.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
	console.log(err, result);
});
```