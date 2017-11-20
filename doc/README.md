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
```
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
steem.api.setOptions({ url: 'wss://ws.golos.io' }); // assuming websocket is work at ws.golos.io
steem.config.set('address_prefix','GLS');
steem.config.set('chain_id','782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');
```
### set
```
steem.config.set('address_prefix','STM');
```
### get
```
steem.config.get('chain_id');
```

## JSON-RPC
Here is how to activate JSON-RPC transport:
```js
steem.api.setOptions({ url: 'https://steemd.steemit.com' });
```

# API

## Subscriptions

### Set Subscribe Callback
```
steem.api.setSubscribeCallback(callback, clearFilter, function(err, result) {
  console.log(err, result);
});
```
### Set Pending Transaction Callback
```
steem.api.setPendingTransactionCallback(cb, function(err, result) {
  console.log(err, result);
});
```
### Set Block Applied Callback
```
steem.api.setBlockAppliedCallback(cb, function(err, result) {
  console.log(err, result);
});
```
### Cancel All Subscriptions
```
steem.api.cancelAllSubscriptions(function(err, result) {
  console.log(err, result);
});
```

## Tags

### Get Trending Tags
```
steem.api.getTrendingTags(afterTag, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Trending
```
steem.api.getDiscussionsByTrending(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Created
```
steem.api.getDiscussionsByCreated(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Active
```
steem.api.getDiscussionsByActive(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Cashout
```
steem.api.getDiscussionsByCashout(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Payout
```
steem.api.getDiscussionsByPayout(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Votes
```
steem.api.getDiscussionsByVotes(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Children
```
steem.api.getDiscussionsByChildren(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Hot
```
steem.api.getDiscussionsByHot(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Feed
```
steem.api.getDiscussionsByFeed(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Blog
```
steem.api.getDiscussionsByBlog(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Comments
```
steem.api.getDiscussionsByComments(query, function(err, result) {
  console.log(err, result);
});
```

## Blocks and transactions

### Get Block Header
```
steem.api.getBlockHeader(blockNum, function(err, result) {
  console.log(err, result);
});
```
### Get Block
```
steem.api.getBlock(blockNum, function(err, result) {
  console.log(err, result);
});
```
### Get State
```
steem.api.getState(path, function(err, result) {
  console.log(err, result);
});
```
### Get Trending Categories
```
steem.api.getTrendingCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Best Categories
```
steem.api.getBestCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Active Categories
```
steem.api.getActiveCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Recent Categories
```
steem.api.getRecentCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```

### Stream Block Number
Streams block numbers by calling the callback function each time a new block is created.
```
var release = steem.api.streamBlockNumber(mode, function(err, result) {
	console.log(err, result);
});

// Call the returned 'release' function to stop streaming
release();
```
Parameters:
- **mode**: 'head' (default) or 'irreversible'
- **callback**: function to be called with the number of each new block that is created

### Stream Block
Streams blocks by calling the callback function each time a new block is created.
```
steem.api.streamBlock(mode, function(err, result) {
	console.log(err, result);
});

// Call the returned 'release' function to stop streaming
release();
```
Parameters:
- **mode**: 'head' (default) or 'irreversible'
- **callback**: function to be called with the number of each new block that is created

Example block data passed as the "result" property to the callback function:
```
block_id: "01091c2ccea73ce2013017239cb8e9c6adac7a2a"
extensions: []
previous: "01091c2b769f7554a5932b29b81c3460fc6f335b"
signing_key: "STM6GcZkfF2rNWwNUmhDCmfLZTpdfMgQDAcAvvGL4MZ7iNVapAVkT"
timestamp: "2017-11-20T01:27:36"
transaction_ids: ["11d0ba9308dd3c25124753eb72ff95c984faf299", ...]
transaction_merkle_root: "4adfa63d8532427add4c081272af09443b8bc70d"
transactions: [{...}, ...]
witness: "pfunk"
witness_signature: "2018f9d65bf44ec3f79d5763ff4bda633146f4f3f4b8998939f648514da00c809a32f25f633b91a5610b49fd735df78cfb841576ce95133d2ee1c7a4e208dc376d"
```

### Stream Transactions
Streams transactions by calling the callback function each time a new block is created with each transaction in the block.
```
steem.api.streamTransactions(mode, function(err, result) {
	console.log(err, result);
});

// Call the returned 'release' function to stop streaming
release();
```
Parameters:
- **mode**: 'head' (default) or 'irreversible'
- **callback**: function to be called with the number of each new block that is created

Example transaction data passed as the "result" property to the callback function:
```
expiration: "2017-11-20T01:33:06"
extensions: []
operations: [...]
ref_block_num: 7299
ref_block_prefix: 1091086591
signatures: ["205a04e6d6184bc18188938d86565505510cefac33b0838064578bf3395752edaa91c2f3e4485c8e3dd734c797c1ca2ee97"]
```

### Stream Operations
Streams operations by calling the callback function each time a new block is created with each operation in each transaction in the block.
```
steem.api.streamOperations(mode, function(err, result) {
	console.log(err, result);
});

// Call the returned 'release' function to stop streaming
release();
```
Parameters:
- **mode**: 'head' (default) or 'irreversible'
- **callback**: function to be called with the number of each new block that is created

Example operation data passed as the "result" property to the callback function:
```
["vote", {...}]
```

## Globals

### Get Config
```
steem.api.getConfig(function(err, result) {
  console.log(err, result);
});
```
### Get Dynamic Global Properties
```
steem.api.getDynamicGlobalProperties(function(err, result) {
  console.log(err, result);
});
```
### Get Chain Properties
```
steem.api.getChainProperties(function(err, result) {
  console.log(err, result);
});
```
### Get Feed History
```
steem.api.getFeedHistory(function(err, result) {
  console.log(err, result);
});
```
### Get Current Median History Price
```
steem.api.getCurrentMedianHistoryPrice(function(err, result) {
  console.log(err, result);
});
```
### Get Hardfork Version
```
steem.api.getHardforkVersion(function(err, result) {
  console.log(err, result);
});
```
### Get Next Scheduled Hardfork
```
steem.api.getNextScheduledHardfork(function(err, result) {
  console.log(err, result);
});
```
### Get Reward Fund
```
steem.api.getRewardFund(name, function(err, result) {
  console.log(err, result);
});
```
### Get Vesting Delegations
```
steem.api.getVestingDelegations(account, from, limit, function(err, result) {
  console.log(err, result);
});
```

## Keys

### Get Key References
```
steem.api.getKeyReferences(key, function(err, result) {
  console.log(err, result);
});
```

## Accounts

### Get Accounts
```
steem.api.getAccounts(names, function(err, result) {
  console.log(err, result);
});
```
### Get Account References
```
steem.api.getAccountReferences(accountId, function(err, result) {
  console.log(err, result);
});
```
### Lookup Account Names
```
steem.api.lookupAccountNames(accountNames, function(err, result) {
  console.log(err, result);
});
```
### Lookup Accounts
```
steem.api.lookupAccounts(lowerBoundName, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Account Count
```
steem.api.getAccountCount(function(err, result) {
  console.log(err, result);
});
```
### Get Conversion Requests
```
steem.api.getConversionRequests(accountName, function(err, result) {
  console.log(err, result);
});
```
### Get Account History
```
steem.api.getAccountHistory(account, from, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Owner History
```
steem.api.getOwnerHistory(account, function(err, result) {
  console.log(err, result);
});
```
### Get Recovery Request
```
steem.api.getRecoveryRequest(account, function(err, result) {
  console.log(err, result);
});
```

## Market

### Get Order Book
```
steem.api.getOrderBook(limit, function(err, result) {
  console.log(err, result);
});
```
### Get Open Orders
```
steem.api.getOpenOrders(owner, function(err, result) {
  console.log(err, result);
});
```
### Get Liquidity Queue
```
steem.api.getLiquidityQueue(startAccount, limit, function(err, result) {
  console.log(err, result);
});
```

## Authority / validation

### Get Transaction Hex
```
steem.api.getTransactionHex(trx, function(err, result) {
  console.log(err, result);
});
```
### Get Transaction
```
steem.api.getTransaction(trxId, function(err, result) {
  console.log(err, result);
});
```
### Get Required Signatures
```
steem.api.getRequiredSignatures(trx, availableKeys, function(err, result) {
  console.log(err, result);
});
```
### Get Potential Signatures
```
steem.api.getPotentialSignatures(trx, function(err, result) {
  console.log(err, result);
});
```
### Verify Authority
```
steem.api.verifyAuthority(trx, function(err, result) {
  console.log(err, result);
});
```
### Verify Account Authority
```
steem.api.verifyAccountAuthority(nameOrId, signers, function(err, result) {
  console.log(err, result);
});
```

## Votes

### Get Active Votes
```
steem.api.getActiveVotes(author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Get Account Votes
```
steem.api.getAccountVotes(voter, function(err, result) {
  console.log(err, result);
});
```

## Content


### Get Content
```
steem.api.getContent(author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Get Content Replies
```
steem.api.getContentReplies(author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Author Before Date
```
steem.api.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Replies By Last Update
```
steem.api.getRepliesByLastUpdate(startAuthor, startPermlink, limit, function(err, result) {
  console.log(err, result);
});
```

## Witnesses


### Get Witnesses
```
steem.api.getWitnesses(witnessIds, function(err, result) {
  console.log(err, result);
});
```
### Get Witness By Account
```
steem.api.getWitnessByAccount(accountName, function(err, result) {
  console.log(err, result);
});
```
### Get Witnesses By Vote
```
steem.api.getWitnessesByVote(from, limit, function(err, result) {
  console.log(err, result);
});
```
### Lookup Witness Accounts
```
steem.api.lookupWitnessAccounts(lowerBoundName, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Witness Count
```
steem.api.getWitnessCount(function(err, result) {
  console.log(err, result);
});
```
### Get Active Witnesses
```
steem.api.getActiveWitnesses(function(err, result) {
  console.log(err, result);
});
```
### Get Miner Queue
```
steem.api.getMinerQueue(function(err, result) {
  console.log(err, result);
});
```

## Login API

### Login

/!\ It's **not safe** to use this method with your username and password. This method always return `true` and is only used in intern with empty values to enable broadcast.

```
steem.api.login('', '', function(err, result) {
  console.log(err, result);
});
```

### Get Api By Name
```
steem.api.getApiByName(apiName, function(err, result) {
  console.log(err, result);
});
```

## Follow API

### Get Followers
```
steem.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Following
```
steem.api.getFollowing(follower, startFollowing, followType, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Follow Count
```
steem.api.getFollowCount(account, function(err, result) {
  console.log(err, result);
});
```

## Broadcast API

### Broadcast Transaction Synchronous
```
steem.api.broadcastTransactionSynchronous(trx, function(err, result) {
  console.log(err, result);
});
```
### Broadcast Block
```
steem.api.broadcastBlock(b, function(err, result) {
  console.log(err, result);
});
```

# Broadcast

### Account Create
```
steem.broadcast.accountCreate(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Account Create With Delegation
```
steem.broadcast.accountCreateWithDelegation(wif, fee, delegation, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, extensions, function(err, result) {
  console.log(err, result);
});
```
### Delegate Vesting Shares
```
steem.broadcast.delegateVestingShares(wif, delegator, delegatee, vesting_shares, function(err, result) {
  console.log(err, result);
});
```
### Account Update
```
steem.broadcast.accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Account Witness Proxy
```
steem.broadcast.accountWitnessProxy(wif, account, proxy, function(err, result) {
  console.log(err, result);
});
```
### Account Witness Vote
```
steem.broadcast.accountWitnessVote(wif, account, witness, approve, function(err, result) {
  console.log(err, result);
});
```
### Challenge Authority
```
steem.broadcast.challengeAuthority(wif, challenger, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
### Change Recovery Account
```
steem.broadcast.changeRecoveryAccount(wif, accountToRecover, newRecoveryAccount, extensions, function(err, result) {
  console.log(err, result);
});
```
### Comment
```
steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Comment Options
```
steem.broadcast.commentOptions(wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes, allowCurationRewards, extensions, function(err, result) {
  console.log(err, result);
});
```
### Comment Payout
```
steem.broadcast.commentPayout(wif, author, permlink, payout, function(err, result) {
  console.log(err, result);
});
```
### Comment Reward
```
steem.broadcast.commentReward(wif, author, permlink, sbdPayout, vestingPayout, function(err, result) {
  console.log(err, result);
});
```
### Convert
```
steem.broadcast.convert(wif, owner, requestid, amount, function(err, result) {
  console.log(err, result);
});
```
### Curate Reward
```
steem.broadcast.curateReward(wif, curator, reward, commentAuthor, commentPermlink, function(err, result) {
  console.log(err, result);
});
```
### Custom
```
steem.broadcast.custom(wif, requiredAuths, id, data, function(err, result) {
  console.log(err, result);
});
```
### Custom Binary
```
steem.broadcast.customBinary(wif, id, data, function(err, result) {
  console.log(err, result);
});
```
### Custom Json
```
steem.broadcast.customJson(wif, requiredAuths, requiredPostingAuths, id, json, function(err, result) {
  console.log(err, result);
});
```
### Delete Comment
```
steem.broadcast.deleteComment(wif, author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Escrow Dispute
```
steem.broadcast.escrowDispute(wif, from, to, agent, who, escrowId, function(err, result) {
  console.log(err, result);
});
```
### Escrow Release
```
steem.broadcast.escrowRelease(wif, from, to, agent, who, receiver, escrowId, sbdAmount, steemAmount, function(err, result) {
  console.log(err, result);
});
```
### Escrow Transfer
```
steem.broadcast.escrowTransfer(wif, from, to, agent, escrowId, sbdAmount, steemAmount, fee, ratificationDeadline, escrowExpiration, jsonMeta, function(err, result) {
  console.log(err, result);
});
```
### Feed Publish
```
steem.broadcast.feedPublish(wif, publisher, exchangeRate, function(err, result) {
  console.log(err, result);
});
```
### Pow2
```
steem.broadcast.pow2(wif, work, newOwnerKey, props, function(err, result) {
  console.log(err, result);
});
```
### Fill Convert Request
```
steem.broadcast.fillConvertRequest(wif, owner, requestid, amountIn, amountOut, function(err, result) {
  console.log(err, result);
});
```
### Fill Order
```
steem.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```
### Fill Vesting Withdraw
```
steem.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
### Interest
```
steem.broadcast.interest(wif, owner, interest, function(err, result) {
  console.log(err, result);
});
```
### Limit Order Cancel
```
steem.broadcast.limitOrderCancel(wif, owner, orderid, function(err, result) {
  console.log(err, result);
});
```
### Limit Order Create
```
steem.broadcast.limitOrderCreate(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration, function(err, result) {
  console.log(err, result);
});
```
### Limit Order Create2
```
steem.broadcast.limitOrderCreate2(wif, owner, orderid, amountToSell, exchangeRate, fillOrKill, expiration, function(err, result) {
  console.log(err, result);
});
```
### Liquidity Reward
```
steem.broadcast.liquidityReward(wif, owner, payout, function(err, result) {
  console.log(err, result);
});
```
### Pow
```
steem.broadcast.pow(wif, worker, input, signature, work, function(err, result) {
  console.log(err, result);
});
```
### Prove Authority
```
steem.broadcast.proveAuthority(wif, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
### Recover Account
```
steem.broadcast.recoverAccount(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
### Report Over Production
```
steem.broadcast.reportOverProduction(wif, reporter, firstBlock, secondBlock, function(err, result) {
  console.log(err, result);
});
```
### Request Account Recovery
```
steem.broadcast.requestAccountRecovery(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
### Escrow Approve
```
steem.broadcast.escrowApprove(wif, from, to, agent, who, escrowId, approve, function(err, result) {
  console.log(err, result);
});
```
### Set Withdraw Vesting Route
```
steem.broadcast.setWithdrawVestingRoute(wif, fromAccount, toAccount, percent, autoVest, function(err, result) {
  console.log(err, result);
});
```
### Transfer
```
steem.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Transfer To Vesting
```
steem.broadcast.transferToVesting(wif, from, to, amount, function(err, result) {
  console.log(err, result);
});
```
### Vote
```
steem.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
  console.log(err, result);
});
```
### Withdraw Vesting
```
steem.broadcast.withdrawVesting(wif, account, vestingShares, function(err, result) {
  console.log(err, result);
});
```
### Witness Update
```
steem.broadcast.witnessUpdate(wif, owner, url, blockSigningKey, props, fee, function(err, result) {
  console.log(err, result);
});
```
### Fill Vesting Withdraw
```
steem.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
### Fill Order
```
steem.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```
### Fill Transfer From Savings
```
steem.broadcast.fillTransferFromSavings(wif, from, to, amount, requestId, memo, function(err, result) {
  console.log(err, result);
});
```
### Comment Payout
```
steem.broadcast.commentPayout(wif, author, permlink, payout, function(err, result) {
  console.log(err, result);
});
```
### Transfer To Savings
```
steem.broadcast.transferToSavings(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Transfer From Savings
```
steem.broadcast.transferFromSavings(wif, from, requestId, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Cancel Transfer From Savings
```
steem.broadcast.cancelTransferFromSavings(wif, from, requestId, function(err, result) {
  console.log(err, result);
});
```

### Multisig
You can use multisignature to broadcast an operation.
```
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
```
steem.auth.verify(name, password, auths);
```

### Generate Keys
```
steem.auth.generateKeys(name, password, roles);
```

### Get Private Keys
```
steem.auth.getPrivateKeys(name, password, roles);
```

### Is Wif
```
steem.auth.isWif(privWif);
```

### To Wif
```
steem.auth.toWif(name, password, role);
```

### Wif Is Valid
```
steem.auth.wifIsValid(privWif, pubWif);
```

### Wif To Public
```
steem.auth.wifToPublic(privWif);
```

### Sign Transaction
```
steem.auth.signTransaction(trx, keys);
```

# Formatter

### Create Suggested Password
```
var password = steem.formatter.createSuggestedPassword();
console.log(password);
// => 'GAz3GYFvvQvgm7t2fQmwMDuXEzDqTzn9'
```

### Comment Permlink
```
var parentAuthor = 'ned';
var parentPermlink = 'a-selfie';
var commentPermlink = steem.formatter.commentPermlink(parentAuthor, parentPermlink);
console.log(commentPermlink);
// => 're-ned-a-selfie-20170621t080403765z'
```

### Estimate Account Value
```
var steemPower = steem.formatter.estimateAccountValue(account);
```

### Reputation
```
var reputation = steem.formatter.reputation(3512485230915);
console.log(reputation);
// => 56
```

### Vest To Steem
```
var steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
console.log(steemPower);
```

# Utils

### Validate Username
```
var isValidUsername = steem.utils.validateAccountName('test1234');
console.log(isValidUsername);
// => 'null'

var isValidUsername = steem.utils.validateAccountName('a1');
console.log(isValidUsername);
// => 'Account name should be longer.'
```
