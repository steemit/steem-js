# Documentation

- [Install](#install)
- [Browser](#browser)
- [Config](#config)
- [JSON-RPC](#jsonrpc)
- [Database API](#api)
    - [Subscriptions](#subscriptions)
    - [Tags](#tags)
    - [Blocks and transactions](#blocks-and-transactions)
    - [Globals](#globals)
    - [Keys](#keys)
    - [Accounts](#accounts)
    - [Market](#market)
    - [Authority / validation](#authority--validation)
    - [Votes](#votes)
    - [Content](#content)
    - [Witnesses](#witnesses)
- [Login API](#login)
- [Follow API](#follow-api)
- [Broadcast API](#broadcast-api)
- [Broadcast](#broadcast)
- [Auth](#auth)
- [Formatter](#formatter)

# Install
```sh
$ npm install steem --save
```

# Browser 
```html 
<script src="./steem.min.js"></script>
<script>
steem.api.getAccounts(['ned', 'dan'], function(err, response){
    console.log(err, response);
});
</script>
```

## Config
Default config should work with steem. however you can change it to work with golos
as 
```js
steem.api.setOptions({ url: 'wss://ws.golos.io' }); // assuming websocket is working at ws.golos.io
steem.config.set('address_prefix','GLS');
steem.config.set('chain_id','782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');
```

### set
```js
steem.config.set('address_prefix','STM');
```

### get
```js
steem.config.get('chain_id');
```

## JSON-RPC
Here is how to activate JSON-RPC transport:
```js
steem.api.setOptions({ url: 'https://api.steemit.com' });
```

# API

## Subscriptions

### Set Subscribe Callback
```js
steem.api.setSubscribeCallback(callback, clearFilter, function(err, result) {
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
Returns a list of the currently trending tags in descending order by value.

```js
steem.api.getTrendingTags(afterTag, limit, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|afterTag|The name of the last tag to begin from|String|Use the empty string `''` to start the list. Subsequent calls can use the last tag name|
|limit|The maximum number of tags to return|Integer||
|function()|Your callback|function|Tip: use `console.log(err, result)` to see the result|


Call Example:
```js
steem.api.getTrendingTags('', 2, function(err, result) {
  console.log(err, result);
});
```

Return Example:
```js
[ { name: '', total_payouts: '37610793.383 SBD', net_votes: 4211122, top_posts: 411832, comments: 1344461, trending: '5549490701' },
  { name: 'life', total_payouts: '8722947.658 SBD', net_votes: 1498401, top_posts: 127103, comments: 54049, trending: '570954588' }
]
```

Using the Result:
```js
// Extract tags from the result into an array of tag name strings
var f = result.map(function(item) { return item.name; });
console.log(f);

// Get the last tag for subsequent calls to `getTrendingTags`
//   or use: f[f.length - 1]   if you used the extraction code above.
var lastKnownTag = result[result.length - 1].name;

// Use the last known tag to get the next group of tags
steem.api.TrendingTags(lastKnownTag, 2, function(err, result) {
  console.log(err, result);
});
```

See also: [getTrendingCategories](#get-trending-categories)


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
### Get Discussions By Blog
```js
steem.api.getDiscussionsByBlog(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Comments
```js
steem.api.getDiscussionsByComments(query, function(err, result) {
  console.log(err, result);
});
```

## Blocks and transactions

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
steem.api.getChainProperties(function(err, result) {
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
### Get Hardfork Version
Gets the current hardfork version of the STEEM blockchain.
```js
steem.api.getHardforkVersion(function(err, result) {
  console.log(err, result);
});
```

Return Example:
```js
'0.19.0'
```
This returns a string and not JSON.

See also: [getNextScheduledHardfork](#get-next-scheduled-hardfork), [getConfig](#get-config)


### Get Next Scheduled Hardfork
```js
steem.api.getNextScheduledHardfork(function(err, result) {
  console.log(err, result);
});
```
### Get Reward Fund
```js
steem.api.getRewardFund(name, function(err, result) {
  console.log(err, result);
});
```
### Get Vesting Delegations
Returns a list of delegations made from one `account`. Denominated in VESTS.
```js
steem.api.getVestingDelegations(account, from, limit, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|account|Account who is making the delegations|String||
|from|The name of the last account to begin from|String|Use the empty string `''` to start the list. Subsequent calls can use the last delegatee's account name|
|limit|The maximum number of delegation records to return|Integer||
|function()|Your callback|function|Tip: use `console.log(err, result)` to see the result|


Call Example:
```js
steem.api.getVestingDelegations('ned', '', 2, function(err, result) {
  console.log(err, result);
});
```

Return Example:
```js
[ 
  { id: 498422, delegator: 'ned', delegatee: 'spaminator', vesting_shares: '409517519.233783 VESTS', min_delegation_time: '2018-01-16T19:30:36' },
  { id: 181809, delegator: 'ned', delegatee: 'surpassinggoogle', vesting_shares: '1029059275.000000 VESTS', min_delegation_time: '2017-08-08T15:25:15' } 
]
```

Using the Result:
```js
// Extract delegatee names from the result into an array of account name strings
var f = result.map(function(item) { return item.delegatee; });
console.log(f);

// Get the last tag for subsequent calls to `getVestingDelegations`
//   or use: f[f.length - 1]   if you used the extraction code above.
var lastKnownDelegatee = result[result.length - 1].delegatee;

// Use the last known delegatee to get the next group of delegatees
steem.api.TrendingTags('ned', lastKnownDelegatee, 2, function(err, result) {
  console.log(err, result);
});
```

See also: [accountCreateWithDelegation](#account-create-with-delegation), [delegateVestingShares](#delegate-vesting-shares)


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

## Authority / validation

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
steem.api.getContentReplies(author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Author Before Date
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
Returns information about a witness with the given `accountName`.
```js
steem.api.getWitnessByAccount(accountName, function(err, result) {
  console.log(err, result);
});
```
|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|accountName|The account name of the witness to query|String||
|function()|Your callback|function|Tip: use `console.log(err, result)` to see the result|

Call Example:
```js
steem.api.getVestingDelegations('sircork', '', 2, function(err, result) {
  console.log(err, result);
});
```

See also: 

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

## Login API

### Login

/!\ It's **not safe** to use this method with your username and password. This method always return `true` and is only used internally with empty values to enable broadcast.

```js
steem.api.login('', '', function(err, result) {
  console.log(err, result);
});
```

### Get Api By Name
```js
steem.api.getApiByName(apiName, function(err, result) {
  console.log(err, result);
});
```

## Follow API
The follower API queries information about follow relationships between accounts. The API is read-only and does not create changes on the blockchain.


### Get Followers
Returns an alphabetical ordered array of the accounts that are following a particular account.

```js
steem.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|following|The followers of which account|String|No leading @ symbol|
|startFollower|Start the list from which follower?|String|No leading @symbol. Use the empty string `''` to start the list. Subsequent calls can use the name of the last follower|
|followType|??|??|Set to 0 or 'blog' - either works|
|limit|The maximum number of followers to return|Integer||
|function()|Your callback|function|Tip: use `console.log(err, result)` to see the result|


Call Example:
```js
steem.api.getFollowers('ned', '', 'blog', 2, function(err, result) {
  console.log(err, result);
});
```

Return Example:
```js
[ 
  { follower: 'a-0-0', following: 'ned', what: [ 'blog' ] },
  { follower: 'a-0-0-0-1abokina', following: 'ned', what: [ 'blog' ] }
]
```

Using the Result:
```js
// Extract followers from the result into an array of account name strings
var f = result.map(function(item) { return item.follower; });
console.log(f);

// Get the last follower for subsequent calls to getFollowers
//   or use: f[f.length - 1]   if you used the extraction code above.
var lastKnownFollower = result[result.length - 1].follower;

// Use the last known follower to get the next group of followers
steem.api.getFollowers('ned', lastKnownFollower, 'blog', 2, function(err, result) {
  console.log(err, result);
});
```

See also: [getFollowing](#get-following), [getFollowCount](#get-follow-count)



### Get Following
Returns an alphabetical ordered Array of the accounts that are followed by a particular account.
```js
steem.api.getFollowing(follower, startFollowing, followType, limit, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|follower|The account to get the following for|String|No leading @ symbol|
|startFollowing|Start the list at which followed account?|String|No leading @symbol. Use the empty string `''` to start the list|
|followType|??|??|Set to 0 or 'blog' - either works|
|limit|The maximum number of items to return|Integer||
|function()|Your callback|function|Tip: use `console.log(err, result)` to see the result|


Call Example:
```js
steem.api.getFollowing('dan', '', 'blog', 2, function(err, result) {
  console.log(err, result);
});
```

Return Example:
```js
[
  { follower: 'dan', following: 'dantheman', what: [ 'blog' ] },
  { follower: 'dan', following: 'krnel', what: [ 'blog' ] } 
]
```

Using the Result:
```js
// Extract followed accounts from the result into an array of account name strings
var f = result.map(function(item) { return item.following; });
```
See the usage examples for [getFollowers](#get-followers) because the behaviour is very similar.


See also: [getFollowers](#get-followers), [getFollowCount](#get-follow-count)



### Get Follow Count
```js
steem.api.getFollowCount(account, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|account|The name for get the follow ccount for|String|No leading @ symbol|
|function()|Your callback|function|Tip: use `console.log(err, result)` to see the result|


Call Example:
```js
steem.api.getFollowCount('ned', function(err, result) {
  console.log(err, result);
});
```

Return Example:
```js
{ account: 'ned', follower_count: 16790, following_count: 913 }
```


See also: [getFollowers](#get-followers), [getFollowing](#get-following)



## Broadcast API

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

# Broadcast
The `steem.broadcast` methods cause permanent changes on the blockchain.

### Account Create
```js
steem.broadcast.accountCreate(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Account Create With Delegation
```js
steem.broadcast.accountCreateWithDelegation(wif, fee, delegation, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, extensions, function(err, result) {
  console.log(err, result);
});
```
### Delegate Vesting Shares
Delegates STEEM POWER, denominated in VESTS, from a `delegator` to the `delegatee`. Requires the `delegator`'s private WIF key. Set the delegation to 0 to undelegate.
```js
steem.broadcast.delegateVestingShares(wif, delegator, delegatee, vesting_shares, function(err, result) {
  console.log(err, result);
});
```
### Account Update
```js
steem.broadcast.accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Account Witness Proxy
```js
steem.broadcast.accountWitnessProxy(wif, account, proxy, function(err, result) {
  console.log(err, result);
});
```
### Account Witness Vote
```js
steem.broadcast.accountWitnessVote(wif, account, witness, approve, function(err, result) {
  console.log(err, result);
});
```
### Challenge Authority
```js
steem.broadcast.challengeAuthority(wif, challenger, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
### Change Recovery Account
```js
steem.broadcast.changeRecoveryAccount(wif, accountToRecover, newRecoveryAccount, extensions, function(err, result) {
  console.log(err, result);
});
```
### Comment
```js
steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Comment Options
```js
steem.broadcast.commentOptions(wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes, allowCurationRewards, extensions, function(err, result) {
  console.log(err, result);
});
```
### Comment Payout
```js
steem.broadcast.commentPayout(wif, author, permlink, payout, function(err, result) {
  console.log(err, result);
});
```
### Comment Reward
```js
steem.broadcast.commentReward(wif, author, permlink, sbdPayout, vestingPayout, function(err, result) {
  console.log(err, result);
});
```
### Convert
```js
steem.broadcast.convert(wif, owner, requestid, amount, function(err, result) {
  console.log(err, result);
});
```
### Curate Reward
```js
steem.broadcast.curateReward(wif, curator, reward, commentAuthor, commentPermlink, function(err, result) {
  console.log(err, result);
});
```
### Custom
```js
steem.broadcast.custom(wif, requiredAuths, id, data, function(err, result) {
  console.log(err, result);
});
```
### Custom Binary
```js
steem.broadcast.customBinary(wif, id, data, function(err, result) {
  console.log(err, result);
});
```
### Custom Json
```js
steem.broadcast.customJson(wif, requiredAuths, requiredPostingAuths, id, json, function(err, result) {
  console.log(err, result);
});
```
### Delete Comment
```js
steem.broadcast.deleteComment(wif, author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Escrow Dispute
```js
steem.broadcast.escrowDispute(wif, from, to, agent, who, escrowId, function(err, result) {
  console.log(err, result);
});
```
### Escrow Release
```js
steem.broadcast.escrowRelease(wif, from, to, agent, who, receiver, escrowId, sbdAmount, steemAmount, function(err, result) {
  console.log(err, result);
});
```
### Escrow Transfer
```js
steem.broadcast.escrowTransfer(wif, from, to, agent, escrowId, sbdAmount, steemAmount, fee, ratificationDeadline, escrowExpiration, jsonMeta, function(err, result) {
  console.log(err, result);
});
```
### Feed Publish
```js
steem.broadcast.feedPublish(wif, publisher, exchangeRate, function(err, result) {
  console.log(err, result);
});
```
### Pow2
```js
steem.broadcast.pow2(wif, work, newOwnerKey, props, function(err, result) {
  console.log(err, result);
});
```
### Fill Convert Request
```js
steem.broadcast.fillConvertRequest(wif, owner, requestid, amountIn, amountOut, function(err, result) {
  console.log(err, result);
});
```
### Fill Order
```js
steem.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```
### Fill Vesting Withdraw
```js
steem.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
### Interest
```js
steem.broadcast.interest(wif, owner, interest, function(err, result) {
  console.log(err, result);
});
```
### Limit Order Cancel
Cancels an open limit order on the [internal market](http://steemit.com/market). Be aware that the order might be filled, or partially filled, before this call completes.

```js
steem.broadcast.limitOrderCancel(wif, owner, orderid, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|wif|Active private key|String||
|owner|Account name|String|No leading @ symbol|
|orderid|User defined ordernumber|Integer|The `orderid` used when the order was created|
|function()|Your callback|function||


See also: [getOpenOrders](#get-open-orders), [limitOrderCancel](#limit-order-cancel), [limitOrderCreate2](#limit-order-create2)



### Limit Order Create
Creates a limit order on the [internal market](http://steemit.com/market) to trade one asset for another using a specified minimum. Orders can be set attempt to fill immediately and or to go to the orderbook. Orders in the order book remain until filled or the expiration time is reached.

```js
steem.broadcast.limitOrderCreate(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|wif|Active private key|String||
|owner|Account name|String|No leading @ symbol|
|orderid|User defined ordernumber|Integer|Used to cancel orders|
|amountToSell|Amount to sell|String|"X.XXX ASSET" must have 3 decimal places. e.g. "25.100 SBD"|
|minToReceive|Amount desired|String|"X.XXX ASSET" must have 3 decimal places. e.g. "20.120 STEEM"|
|fillOrKill|Fill order from current order book or kill the order|Boolean|`false` places the order into the Order Book until either cancelled, filled, or the expiration time is reached|
|expiration|Time when order expires|Integer|Unit milliseconds. Zero is UNIX epoch|
|function()|Your callback|function||

Tip: `expiration` time must always be in the future even if `fillOrKill` is set to `true`.

Risky tip: The Internal Market seems to always try and get the best price from the current orderbook so, to place an at market order, then use the `minToReceive` as `0.001` and `fillOrKill` as `true` (use at own risk).


See also: [getOrderBook](#get-order-book), [getOpenOrders](#get-open-orders), [limitOrderCancel](#limit-order-cancel), [limitOrderCreate2](#limit-order-create2)



### Limit Order Create2
Creates a limit order on the [internal market](http://steemit.com/market) to trade one asset for another using an exchange rate.  Orders can be set attempt to fill immediately and or to go to the orderbook. Orders in the order book remain until filled or the expiration time is reached.

```js
steem.broadcast.limitOrderCreate2(wif, owner, orderid, amountToSell, exchangeRate, fillOrKill, expiration, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|wif|Active private key|String||
|owner|Account name|String|No leading @ symbol|
|orderid|User defined order identifier|Integer|Used to cancel orders|
|amountToSell|Amount to sell|String|"X.XXX ASSET" must have 3 decimal places. e.g. "25.100 SBD"|
|exchangeRate|The exchange rate|Integer|`amountToSell` is multiplied by the `exchangeRate` to have the same effect as `minToReceive`|
|fillOrKill|Fill order from current order book or kill the order|Boolean|`false` places the order into the Order Book until either canceled, filled, or the expiration time is reached|
|expiration|Time when order expires|Integer|Unit milliseconds. Zero is UNIX epoch|
|function()|Your callback|function||


See also: [getOrderBook](#get-order-book), [getOpenOrders](#get-open-orders), [limitOrderCancel](#limit-order-cancel), [limitOrderCreate](#limit-order-create2)



### Liquidity Reward
```js
steem.broadcast.liquidityReward(wif, owner, payout, function(err, result) {
  console.log(err, result);
});
```
### Pow
```js
steem.broadcast.pow(wif, worker, input, signature, work, function(err, result) {
  console.log(err, result);
});
```
### Prove Authority
```js
steem.broadcast.proveAuthority(wif, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
### Recover Account
```js
steem.broadcast.recoverAccount(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
### Report Over Production
```js
steem.broadcast.reportOverProduction(wif, reporter, firstBlock, secondBlock, function(err, result) {
  console.log(err, result);
});
```
### Request Account Recovery
```js
steem.broadcast.requestAccountRecovery(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
### Escrow Approve
```js
steem.broadcast.escrowApprove(wif, from, to, agent, who, escrowId, approve, function(err, result) {
  console.log(err, result);
});
```
### Set Withdraw Vesting Route
```js
steem.broadcast.setWithdrawVestingRoute(wif, fromAccount, toAccount, percent, autoVest, function(err, result) {
  console.log(err, result);
});
```
### Transfer
Transfers assets, such as STEEM or SBD, from one account to another.
```js
steem.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|wif|Active private key for the `from` account|String||
|from|Account name to take asset from|String|No leading @ symbol|
|to|Account name to place asset into|String|No leading @ symbol|
|amount|Amount of of asset to transfer|String|"X.XXX ASSET" must have 3 decimal places. e.g. "5.150 SBD"|
|function()|Your callback|function||

See also: [transferToVesting](#transfer-to-vesting)

### Transfer To Vesting
Vests STEEM into STEEM POWER. This method supports powering up one account from another.
```js
steem.broadcast.transferToVesting(wif, from, to, amount, function(err, result) {
  console.log(err, result);
});
```

|Parameter|Description|Datatype|Notes|
|---|---|---|---|
|wif|Active private key for the `from` account|String||
|from|Account name to take STEEM from|String|No leading @ symbol|
|to|Account name to vest STEEM POWER into|String|No leading @ symbol. Can be the same account as `to`|
|amount|Amount of STEEM to vest/power up|String|"X.XXX STEEM" must have 3 decimal places. e.g. "25.100 STEEM". Must be denominated in STEEM|
|function()|Your callback|function||

See also: [transfer](#transfer)

### Vote
```js
steem.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
  console.log(err, result);
});
```
### Withdraw Vesting
```js
steem.broadcast.withdrawVesting(wif, account, vestingShares, function(err, result) {
  console.log(err, result);
});
```
### Witness Update
```js
steem.broadcast.witnessUpdate(wif, owner, url, blockSigningKey, props, fee, function(err, result) {
  console.log(err, result);
});
```
### Fill Vesting Withdraw
```js
steem.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
### Fill Order
```js
steem.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```
### Fill Transfer From Savings
```js
steem.broadcast.fillTransferFromSavings(wif, from, to, amount, requestId, memo, function(err, result) {
  console.log(err, result);
});
```
### Comment Payout
```js
steem.broadcast.commentPayout(wif, author, permlink, payout, function(err, result) {
  console.log(err, result);
});
```
### Transfer To Savings
```js
steem.broadcast.transferToSavings(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Transfer From Savings
```js
steem.broadcast.transferFromSavings(wif, from, requestId, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Cancel Transfer From Savings
```js
steem.broadcast.cancelTransferFromSavings(wif, from, requestId, function(err, result) {
  console.log(err, result);
});
```

### Multisig
You can use multisignature to broadcast an operation.
```js
steem.broadcast.send({
  extensions: [],
  operations: [
    ['vote', {
      voter: 'guest123',
      author: 'fabien',
      permlink: 'test',
      weight: 1000
    }]
  ]}, [privPostingWif1, privPostingWif2], (err, result) => {
  console.log(err, result);
});
```

# Auth

### Verify
```js
steem.auth.verify(name, password, auths);
```

### Generate Keys
```js
steem.auth.generateKeys(name, password, roles);
```

### Get Private Keys
```js
steem.auth.getPrivateKeys(name, password, roles);
```

### Is Wif
```js
steem.auth.isWif(privWif);
```

### To Wif
```js
steem.auth.toWif(name, password, role);
```

### Wif Is Valid
```js
steem.auth.wifIsValid(privWif, pubWif);
```

### Wif To Public
```js
steem.auth.wifToPublic(privWif);
```

### Sign Transaction
```js
steem.auth.signTransaction(trx, keys);
```

# Formatter

### Create Suggested Password
```js
var password = steem.formatter.createSuggestedPassword();
console.log(password);
// => 'GAz3GYFvvQvgm7t2fQmwMDuXEzDqTzn9'
```

### Comment Permlink
```js
var parentAuthor = 'ned';
var parentPermlink = 'a-selfie';
var commentPermlink = steem.formatter.commentPermlink(parentAuthor, parentPermlink);
console.log(commentPermlink);
// => 're-ned-a-selfie-20170621t080403765z'
```

### Estimate Account Value
```js
var steemPower = steem.formatter.estimateAccountValue(account);
```

### Reputation
```js
var reputation = steem.formatter.reputation(3512485230915);
console.log(reputation);
// => 56
```

### Vest To Steem
```js
var steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
console.log(steemPower);
```

# Utils

### Validate Username
```js
var isValidUsername = steem.utils.validateAccountName('test1234');
console.log(isValidUsername);
// => 'null'

var isValidUsername = steem.utils.validateAccountName('a1');
console.log(isValidUsername);
// => 'Account name should be longer.'
```
