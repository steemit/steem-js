# Documentation

## Install
```
$ npm install steem --save
```

## Subscriptions
### Set Subscribe Callback
```js 
steem.setSubscribeCallback(cb, clearFilter, function(err, result) {
	console.log(err, result);
});
```
### Set Pending Transaction Callback
```js 
steem.setPendingTransactionCallback(cb, function(err, result) {
	console.log(err, result);
});
```
### Set Block Applied Callback
```js 
steem.setBlockAppliedCallback(cb, function(err, result) {
	console.log(err, result);
});
```
### Cancel All Subscriptions
```js 
steem.cancelAllSubscriptions(function(err, result) {
	console.log(err, result);
});
```

## Tags
### Get Trending Tags
```js 
steem.getTrendingTags(afterTag, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Trending
```js 
steem.getDiscussionsByTrending(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Created
```js 
steem.getDiscussionsByCreated(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Active
```js 
steem.getDiscussionsByActive(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Cashout
```js 
steem.getDiscussionsByCashout(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Payout
```js 
steem.getDiscussionsByPayout(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Votes
```js 
steem.getDiscussionsByVotes(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Children
```js 
steem.getDiscussionsByChildren(query, function(err, result) {
	console.log(err, result);
});
```
### Get Discussions By Hot
```js 
steem.getDiscussionsByHot(query, function(err, result) {
	console.log(err, result);
});
```

## Blocks And Transactions
### Get Block Header
```js 
steem.getBlockHeader(blockNum, function(err, result) {
	console.log(err, result);
});
```
### Get Block
```js 
steem.getBlock(blockNum, function(err, result) {
	console.log(err, result);
});
```
### Get State
```js 
steem.getState(path, function(err, result) {
	console.log(err, result);
});
```
### Get Trending Categories
```js 
steem.getTrendingCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Best Categories
```js 
steem.getBestCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Active Categories
```js 
steem.getActiveCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Recent Categories
```js 
steem.getRecentCategories(after, limit, function(err, result) {
	console.log(err, result);
});
```

## Globals
### Get Config
```js 
steem.getConfig(function(err, result) {
	console.log(err, result);
});
```
### Get Dynamic Global Properties
```js 
steem.getDynamicGlobalProperties(function(err, result) {
	console.log(err, result);
});
```
### Get Chain Properties
```js 
steem.getChainProperties(after, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Feed History
```js 
steem.getFeedHistory(function(err, result) {
	console.log(err, result);
});
```
### Get Current Median History Price
```js 
steem.getCurrentMedianHistoryPrice(function(err, result) {
	console.log(err, result);
});
```
### Get Witness Schedule
```js 
steem.getWitnessSchedule(function(err, result) {
	console.log(err, result);
});
```
### Get Hardfork Version
```js 
steem.getHardforkVersion(function(err, result) {
	console.log(err, result);
});
```
### Get Next Scheduled Hardfork
```js 
steem.getNextScheduledHardfork(function(err, result) {
	console.log(err, result);
});
```

## Keys
### Get Key References
```js 
steem.getKeyReferences(key, function(err, result) {
	console.log(err, result);
});
```

## Accounts
### Get Accounts
```js 
steem.getAccounts(names, function(err, result) {
	console.log(err, result);
});
```
### Get Account References
```js 
steem.getAccountReferences(accountId, function(err, result) {
	console.log(err, result);
});
```
### Lookup Account Names
```js 
steem.lookupAccountNames(accountNames, function(err, result) {
	console.log(err, result);
});
```
### Lookup Accounts
```js 
steem.lookupAccounts(lowerBoundName, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Account Count
```js 
steem.getAccountCount(function(err, result) {
	console.log(err, result);
});
```
### Get Conversion Requests
```js 
steem.getConversionRequests(accountName, function(err, result) {
	console.log(err, result);
});
```
### Get Account History
```js 
steem.getAccountHistory(account, from, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Owner History
```js 
steem.getOwnerHistory(account, function(err, result) {
	console.log(err, result);
});
```
### Get Recovery Request
```js 
steem.getRecoveryRequest(account, function(err, result) {
	console.log(err, result);
});
```

## Market
### Get Order Book
```js 
steem.getOrderBook(limit, function(err, result) {
	console.log(err, result);
});
```
### Get Open Orders
```js 
steem.getOpenOrders(owner, function(err, result) {
	console.log(err, result);
});
```
### Get Liquidity Queue
```js 
steem.getLiquidityQueue(startAccount, limit, function(err, result) {
	console.log(err, result);
});
```

## Authority / Validation
### Get Transaction Hex
```js 
steem.getTransactionHex(trx, function(err, result) {
	console.log(err, result);
});
```
### Get Transaction
```js 
steem.getTransaction(trxId, function(err, result) {
	console.log(err, result);
});
```
### Get Required Signatures
```js 
steem.getRequiredSignatures(trx, availableKeys, function(err, result) {
	console.log(err, result);
});
```
### Get Potential Signatures
```js 
steem.getPotentialSignatures(trx, function(err, result) {
	console.log(err, result);
});
```
### Verify Authority
```js 
steem.verifyAuthority(trx, function(err, result) {
	console.log(err, result);
});
```
### Verify Account Authority
```js 
steem.verifyAccountAuthority(nameOrId, signers, function(err, result) {
	console.log(err, result);
});
```

## Votes
### Get Active Votes
```js 
steem.getActiveVotes(author, permlink, function(err, result) {
	console.log(err, result);
});
```
### Get Account Votes
```js 
steem.getAccountVotes(voter, function(err, result) {
	console.log(err, result);
});
```

## Content
### Get Content
```js 
steem.getContent(author, permlink, function(err, result) {
	console.log(err, result);
});
```
### Get Content Replies
```js 
steem.getContentReplies(parent, parentPermlink, function(err, result) {
	console.log(err, result);
});
```
### Get Discussion By Author Before Date
```js 
steem.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Replies By Last Update
```js 
steem.getRepliesByLastUpdate(startAuthor, startPermlink, limit, function(err, result) {
	console.log(err, result);
});
```

## Witnesses
### Get Witnesses
```js 
steem.getWitnesses(witnessIds, function(err, result) {
	console.log(err, result);
});
```
### Get Witness By Account
```js 
steem.getWitnessByAccount(accountName, function(err, result) {
	console.log(err, result);
});
```
### Get Witnesses By Vote
```js 
steem.getWitnessesByVote(from, limit, function(err, result) {
	console.log(err, result);
});
```
### Lookup Witness Accounts
```js 
steem.lookupWitnessAccounts(lowerBoundName, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Witness Count
```js 
steem.getWitnessCount(function(err, result) {
	console.log(err, result);
});
```
### Get Active Witnesses
```js 
steem.getActiveWitnesses(function(err, result) {
	console.log(err, result);
});
```
### Get Miner Queue
```js 
steem.getMinerQueue(function(err, result) {
	console.log(err, result);
});
```

## Login
```js
steem.login('ned', '****************', function(err, result) {
	console.log(err, result);
});
```

## Follow
### Get Followers
```js 
steem.getFollowers(following, startFollower, limit, function(err, result) {
	console.log(err, result);
});
```
### Get Following
```js 
steem.getFollowing(follower, startFollowing, limit, function(err, result) {
	console.log(err, result);
});
```

## Broadcast
### Broadcast Transaction
```js 
steem.broadcastTransaction(trx, function(err, result) {
	console.log(err, result);
});
```
### Broadcast Transaction Synchronous
```js 
steem.broadcastTransactionSynchronous(trx, function(err, result) {
	console.log(err, result);
});
```
### Broadcast Block
```js 
steem.broadcastBlock(b, function(err, result) {
	console.log(err, result);
});
```
### Broadcast Transaction With Callback
```js 
steem.broadcastTransactionWithCallback(confirmationCallback, trx, function(err, result) {
	console.log(err, result);
});
```

## Stream
### Stream Block Number
```js 
steem.streamBlockNumber(function(err, result) {
	console.log(err, result);
});
```
### Stream Block
```js 
steem.streamBlock(function(err, result) {
	console.log(err, result);
});
```
### Stream Transactions
```js 
steem.streamTransactions(function(err, result) {
	console.log(err, result);
});
```
### Stream Operations
```js 
steem.streamOperations(function(err, result) {
	console.log(err, result);
});
```