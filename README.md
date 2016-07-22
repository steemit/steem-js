# SteemJS

## Install

```
$ npm install steem --save
```

## Usage

```js
var Steem = require('steem');
var steem = new Steem();

steem.getAccounts(['ned', 'dan'], function(result, err) {
	console.log(result, err);
});
```

## Subscriptions
### Set Subscribe Callback
```js 
steem.setSubscribeCallback(cb, clearFilter, function(result, err) {
	console.log(result, err);
});
```
### Set Pending Transaction Callback
```js 
steem.setPendingTransactionCallback(cb, function(result, err) {
	console.log(result, err);
});
```
### Set Block Applied Callback
```js 
steem.setBlockAppliedCallback(cb, function(result, err) {
	console.log(result, err);
});
```
### Cancel All Subscriptions
```js 
steem.cancelAllSubscriptions(function(result, err) {
	console.log(result, err);
});
```

## Tags
### Get Trending Tags
```js 
steem.getTrendingTags(afterTag, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Trending
```js 
steem.getDiscussionsByTrending(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Created
```js 
steem.getDiscussionsByCreated(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Active
```js 
steem.getDiscussionsByActive(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Cashout
```js 
steem.getDiscussionsByCashout(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Payout
```js 
steem.getDiscussionsByPayout(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Votes
```js 
steem.getDiscussionsByVotes(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Children
```js 
steem.getDiscussionsByChildren(query, function(result, err) {
	console.log(result, err);
});
```
### Get Discussions By Hot
```js 
steem.getDiscussionsByHot(query, function(result, err) {
	console.log(result, err);
});
```

## Blocks And Transactions
### Get Block Header
```js 
steem.getBlockHeader(blockNum, function(result, err) {
	console.log(result, err);
});
```
### Get Block
```js 
steem.getBlock(blockNum, function(result, err) {
	console.log(result, err);
});
```
### Get State
```js 
steem.getState(path, function(result, err) {
	console.log(result, err);
});
```
### Get Trending Categories
```js 
steem.getTrendingCategories(after, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Best Categories
```js 
steem.getBestCategories(after, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Active Categories
```js 
steem.getActiveCategories(after, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Recent Categories
```js 
steem.getRecentCategories(after, limit, function(result, err) {
	console.log(result, err);
});
```

## Globals
### Get Config
```js 
steem.getConfig(function(result, err) {
	console.log(result, err);
});
```
### Get Dynamic Global Properties
```js 
steem.getDynamicGlobalProperties(function(result, err) {
	console.log(result, err);
});
```
### Get Chain Properties
```js 
steem.getChainProperties(after, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Feed History
```js 
steem.getFeedHistory(function(result, err) {
	console.log(result, err);
});
```
### Get Current Median History Price
```js 
steem.getCurrentMedianHistoryPrice(function(result, err) {
	console.log(result, err);
});
```
### Get Witness Schedule
```js 
steem.getWitnessSchedule(function(result, err) {
	console.log(result, err);
});
```
### Get Hardfork Version
```js 
steem.getHardforkVersion(function(result, err) {
	console.log(result, err);
});
```
### Get Next Scheduled Hardfork
```js 
steem.getNextScheduledHardfork(function(result, err) {
	console.log(result, err);
});
```

## Keys
### Get Key References
```js 
steem.getKeyReferences(key, function(result, err) {
	console.log(result, err);
});
```

## Accounts
### Get Accounts
```js 
steem.getAccounts(names, function(result, err) {
	console.log(result, err);
});
```
### Get Account References
```js 
steem.getAccountReferences(accountId, function(result, err) {
	console.log(result, err);
});
```
### Lookup Account Names
```js 
steem.lookupAccountNames(accountNames, function(result, err) {
	console.log(result, err);
});
```
### Lookup Accounts
```js 
steem.lookupAccounts(lowerBoundName, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Account Count
```js 
steem.getAccountCount(function(result, err) {
	console.log(result, err);
});
```
### Get Conversion Requests
```js 
steem.getConversionRequests(accountName, function(result, err) {
	console.log(result, err);
});
```
### Get Account History
```js 
steem.getAccountHistory(account, from, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Owner History
```js 
steem.getOwnerHistory(account, function(result, err) {
	console.log(result, err);
});
```
### Get Recovery Request
```js 
steem.getRecoveryRequest(account, function(result, err) {
	console.log(result, err);
});
```

## Market
### Get Order Book
```js 
steem.getOrderBook(limit, function(result, err) {
	console.log(result, err);
});
```
### Get Open Orders
```js 
steem.getOpenOrders(owner, function(result, err) {
	console.log(result, err);
});
```
### Get Liquidity Queue
```js 
steem.getLiquidityQueue(startAccount, limit, function(result, err) {
	console.log(result, err);
});
```

## Authority / Validation
### Get Transaction Hex
```js 
steem.getTransactionHex(trx, function(result, err) {
	console.log(result, err);
});
```
### Get Transaction
```js 
steem.getTransaction(trxId, function(result, err) {
	console.log(result, err);
});
```
### Get Required Signatures
```js 
steem.getRequiredSignatures(trx, availableKeys, function(result, err) {
	console.log(result, err);
});
```
### Get Potential Signatures
```js 
steem.getPotentialSignatures(trx, function(result, err) {
	console.log(result, err);
});
```
### Verify Authority
```js 
steem.verifyAuthority(trx, function(result, err) {
	console.log(result, err);
});
```
### Verify Account Authority
```js 
steem.verifyAccountAuthority(nameOrId, signers, function(result, err) {
	console.log(result, err);
});
```

## Votes
### Get Active Votes
```js 
steem.getActiveVotes(author, permlink, function(result, err) {
	console.log(result, err);
});
```
### Get Account Votes
```js 
steem.getAccountVotes(voter, function(result, err) {
	console.log(result, err);
});
```

## Content
### Get Content
```js 
steem.getContent(author, permlink, function(result, err) {
	console.log(result, err);
});
```
### Get Content Replies
```js 
steem.getContentReplies(parent, parentPermlink, function(result, err) {
	console.log(result, err);
});
```
### Get Discussion By Author Before Date
```js 
steem.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Replies By Last Update
```js 
steem.getRepliesByLastUpdate(startAuthor, startPermlink, limit, function(result, err) {
	console.log(result, err);
});
```

## Witnesses
### Get Witnesses
```js 
steem.getWitnesses(witnessIds, function(result, err) {
	console.log(result, err);
});
```
### Get Witness By Account
```js 
steem.getWitnessByAccount(accountName, function(result, err) {
	console.log(result, err);
});
```
### Get Witnesses By Vote
```js 
steem.getWitnessesByVote(from, limit, function(result, err) {
	console.log(result, err);
});
```
### Lookup Witness Accounts
```js 
steem.lookupWitnessAccounts(lowerBoundName, limit, function(result, err) {
	console.log(result, err);
});
```
### Get Witness Count
```js 
steem.getWitnessCount(function(result, err) {
	console.log(result, err);
});
```
### Get Active Witnesses
```js 
steem.getActiveWitnesses(function(result, err) {
	console.log(result, err);
});
```
### Get Miner Queue
```js 
steem.getMinerQueue(function(result, err) {
	console.log(result, err);
});
```

## Stream
### Stream Block Number
```js 
steem.streamBlockNumber(function(result) {
	console.log(result);
});
```
### Stream Block
```js 
steem.streamBlock(function(result) {
	console.log(result);
});
```
### Stream Transactions
```js 
steem.streamTransactions(function(result) {
	console.log(result);
});
```
### Stream Operations
```js 
steem.streamOperations(function(result) {
	console.log(result);
});
```

## To-Do
- Connect all the others API

### You have some suggestions? Let me know on Slack https://steem.slack.com/ channel #steemjs

## License

MIT




