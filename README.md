# SteemJS

## Install

```
$ npm install steem --save
```

## Usage

```js
var Steem = require('steem');
var steem = new Steem();

steem.getAccounts(['ned', 'dan'], function(err, result) {
	console.log(err, result);
});
```

## Login
steem.login(username, password, callback);

## Subscriptions
steem.setSubscribeCallback(cb, clearFilter, callback);
steem.setPendingTransactionCallback(cb, callback);
steem.setBlockAppliedCallback(cb, callback);
steem.cancelAllSubscriptions(callback);

## Tags
steem.getTrendingTags(afterTag, limit, callback);
steem.getDiscussionsByTrending(query, callback);
steem.getDiscussionsByCreated(query, callback);
steem.getDiscussionsByActive(query, callback);
steem.getDiscussionsByCashout(query, callback);
steem.getDiscussionsByPayout(query, callback);
steem.getDiscussionsByVotes(query, callback);
steem.getDiscussionsByChildren(query, callback);
steem.getDiscussionsByHot(query, callback);

## Blocks And Transactions
steem.getBlockHeader(blockNum, callback);
steem.getBlock(blockNum, callback);
steem.getState(path, callback);
steem.getTrendingCategories(after, limit, callback);
steem.getBestCategories(after, limit, callback);
steem.getActiveCategories(after, limit, callback);
steem.getRecentCategories(after, limit, callback);

## Globals
steem.getConfig(callback);
steem.getDynamicGlobalProperties(callback);
steem.getChainProperties(after, limit, callback);
steem.getFeedHistory(callback);
steem.getCurrentMedianHistoryPrice(callback);
steem.getWitnessSchedule(callback);
steem.getHardforkVersion(callback);
steem.getNextScheduledHardfork(callback);

## Keys
steem.getKeyReferences(key, callback)

## Accounts
steem.getAccounts(names, callback);
steem.getAccountReferences(accountId, callback);
steem.lookupAccountNames(accountNames, callback);
steem.lookupAccounts(lowerBoundName, limit, callback);
steem.getAccountCount(callback);
steem.getConversionRequests(accountName, callback);
steem.getAccountHistory(account, from, limit, callback);
steem.getOwnerHistory(account, callback);
steem.getRecoveryRequest(account, callback);

## Market
steem.getOrderBook(limit, callback);
steem.getOpenOrders(owner, callback);
steem.getLiquidityQueue(startAccount, limit, callback);

## Authority / Validation
steem.getTransactionHex(trx, callback);
steem.getTransaction(trxId, callback);
steem.getRequiredSignatures(trx, availableKeys, callback);
steem.getPotentialSignatures(trx, callback);
steem.verifyAuthority(trx, callback);
steem.verifyAccountAuthority(nameOrId, signers, callback);

## Votes
steem.getActiveVotes(author, permlink, callback);
steem.getAccountVotes(voter, callback);

## Content
steem.getContent(author, permlink, callback);
steem.getContentReplies(parent, parentPermlink, callback);
steem.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, callback);
steem.getRepliesByLastUpdate(startAuthor, startPermlink, limit, callback);

## Witnesses
steem.getWitnesses(witnessIds, callback);
steem.getWitnessByAccount(accountName, callback);
steem.getWitnessesByVote(from, limit, callback);
steem.lookupWitnessAccounts(lowerBoundName, limit, callback);
steem.getWitnessCount(callback);
steem.getActiveWitnesses(callback);
steem.getMinerQueue(callback);

## Stream
steem.streamBlockNumber(callback);
steem.streamBlock(callback);
steem.streamTransactions(callback);
steem.streamOperations(callback);

## Documentation 
https://github.com/adcpm/steem/tree/master/doc

## Browser
Front-end library will be available soon as possible.

## Contributions
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list or on Slack https://steem.slack.com/ channel #steemjs.

## Issues
When you find issues, please report them!

## License
MIT




