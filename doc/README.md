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

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# Install
```sh
$ npm install steem --save
```

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# Browser 
```html 
<script src="./steem.min.js"></script>
<script>
steem.api.getAccounts(['ned', 'dan'], function(err, response) {
    console.log(err, response);
});
</script>
```
- - - - - - - - - - - - - - - - - -
## Config
Default config should work with steem. however you can change it to work with golos by 
```js
steem.api.setOptions({ url: 'wss://ws.golos.io' }); // assuming websocket is working at ws.golos.io
steem.config.set('address_prefix','GLS');
steem.config.set('chain_id','782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');
```
- - - - - - - - - - - - - - - - - -
### set
```js
steem.config.set('address_prefix','STM');
```
- - - - - - - - - - - - - - - - - -
### get
```js
steem.config.get('chain_id');
```
- - - - - - - - - - - - - - - - - -
## JSON-RPC
Here is how to activate JSON-RPC transport:
```js
steem.api.setOptions({ url: 'https://api.steemit.com' });
```

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# API
- - - - - - - - - - - - - - - - - -
## Subscriptions
- - - - - - - - - - - - - - - - - -
### Set Subscribe Callback
```js
steem.api.setSubscribeCallback(callback, clearFilter, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Set Pending Transaction Callback
```js
steem.api.setPendingTransactionCallback(cb, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Set Block Applied Callback
```js
steem.api.setBlockAppliedCallback(cb, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Cancel All Subscriptions
```js
steem.api.cancelAllSubscriptions(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Tags
- - - - - - - - - - - - - - - - - -
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
  { name: 'life', total_payouts: '8722947.658 SBD', net_votes: 1498401, top_posts: 127103, comments: 54049, trending: '570954588' } ]
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
- - - - - - - - - - - - - - - - - -
### Get Blog
Gets the last `limit` number of posts of `account` before the post with index `entryId`

```js
steem.api.getBlog(account, entryId, limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|entryId|number|a positive number - the index from which to start counting (the index is zero based)|
|limit|number|a positive number - the max count of posts to be returned|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getBlog("username", 10, 3, function(err, data) {
	console.log(err, data);
});

// In this case we have a call to get [3] posts, the newest of which is the one with index [10]
//			(that's the 11-th post, because the post indexes are zero based)
// That means that the results will be posts [10, 9 and 8]
```

Return Example:
```js
[ {
		blog:"username"
		comment: { /* Omited for simplicity */ }
		entry_id: 10
		reblog_on:"1970-01-01T00:00:00"
	},
	{
		blog:"username"
		comment: { /* Omited for simplicity */ }
		entry_id: 9
		reblog_on:"1970-01-01T00:00:00"
	},
	{
		blog:"username"
		comment: { /* Omited for simplicity */ }
		entry_id: 8
		reblog_on:"1970-01-01T00:00:00"
	} ]
```
- - - - - - - - - - - - - - - - - -
### Get Blog Authors
Gets a list of all people who wrote in someones blog, along with how many times they wrote in that blog.

```js
steem.api.getBlogAuthors(blogAccount, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|blogAccount|string|a steem username|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getBlogAuthors("username", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
[ [ 'username1', 1 ],
  [ 'username2', 1 ],
  [ 'username3', 3 ],
  [ 'username4', 2 ],
  [ 'username5', 1 ] ]
```
- - - - - - - - - - - - - - - - - -
### Get Blog Entries
Gets the last `limit` number of posts of `account` before the post with index `entryId`
Very similar to steem.api.getBlog but with much simpler result objects

```js
steem.api.getBlogEntries(account, entryId, limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|entryId|number|a positive number - the index from which to start counting (the index is zero based)|
|limit|number|a positive number - the max count of posts to be returned|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getBlogEntries("username", 10, 3, function(err, data) {
	console.log(err, data);
});

// In this case we have a call to get [3] posts, the newest of which is the one with index [10]
//			(that's the 11-th post, because the post indexes are zero based)
// That means that the results will be posts [10, 9 and 8]
```

Return Example:
```js
[ { author: 'username',
    permlink: 'post-permlink-10',
    blog: 'username',
    reblog_on: '1970-01-01T00:00:00',
    entry_id: 10 },
  { author: 'username',
    permlink: 'post-permlink-9',
    blog: 'username',
    reblog_on: '1970-01-01T00:00:00',
    entry_id: 9 },
  { author: 'username',
    permlink: 'post-permlink-8',
    blog: 'username',
    reblog_on: '1970-01-01T00:00:00',
    entry_id: 8 } ]
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Trending
Gets the steem posts as they would be shown in the trending tab of steemit.com.

```js
steem.api.getDiscussionsByTrending30(query, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|query|object|an object containing different options for querying, like 'limit' and 'tag'|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var query = { limit : 3, tag : "steem" };
steem.api.getDiscussionsByTrending30(query, function(err, data) {
	console.log(err, data);
});

// NOTE! The default limit is 0. Not setting a limit will get you an empty result.
```

Return Example:
```js
// the result is an array of big objects representing the comments

 [ { /* ommited for simplicity */ },
   { /* ommited for simplicity */ },
   { /* ommited for simplicity */ } ]
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Created
```js
steem.api.getDiscussionsByCreated(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Active
```js
steem.api.getDiscussionsByActive(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Cashout
```js
steem.api.getDiscussionsByCashout(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Payout
```js
steem.api.getDiscussionsByPayout(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Votes
```js
steem.api.getDiscussionsByVotes(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Children
```js
steem.api.getDiscussionsByChildren(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Hot
```js
steem.api.getDiscussionsByHot(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Feed
```js
steem.api.getDiscussionsByFeed(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Blog
```js
steem.api.getDiscussionsByBlog(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Comments
```js
steem.api.getDiscussionsByComments(query, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Promoted
Gets the recent posts ordered by how much was spent to promote them

```js
steem.api.getDiscussionsByPromoted(query, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|query|object|an object containing different options for querying, like 'limit' and 'tag'|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var query = { limit : 3, tag : "steem" };
steem.api.getDiscussionsByPromoted(query, function(err, data) {
	console.log(err, data);
});

// NOTE! The default limit is 0. Not setting a limit will get you an empty result.
```

Return Example:
```js
// the result is an array of big objects representing the comments

 [ { /* ommited for simplicity */ },
   { /* ommited for simplicity */ },
   { /* ommited for simplicity */ } ]
```
- - - - - - - - - - - - - - - - - -
### Get Comment Discussions By Payout
Gets the recent comments (not posts) ordered by their pending payout.

```js
steem.api.getCommentDiscussionsByPayout(query, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|query|object|an object containing different options for querying, like 'limit' and 'tag'|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var query = { limit : 3, tag : "steem" };
steem.api.getCommentDiscussionsByPayout(query, function(err, data) {
	console.log(err, data);
});

// NOTE! The default limit is 0. Not setting a limit will get you an empty result.
```

Return Example:
```js
// the result is an array of big objects representing the comments

 [ { /* ommited for simplicity */ },
   { /* ommited for simplicity */ },
   { /* ommited for simplicity */ } ]
```
- - - - - - - - - - - - - - - - - -
### Get Post Discussions By Payout
Gets the recent posts ordered by their pending payout.

```js
steem.api.getPostDiscussionsByPayout(query, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|query|object|an object containing different options for querying, like 'limit' and 'tag'|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var query = { limit : 3, tag : "collorchallenge" };
steem.api.getPostDiscussionsByPayout(query, function(err, data) {
	console.log(err, data);
});

// NOTE! The default limit is 0. Not setting a limit will get you an empty result.
```

Return Example:
```js
// the result is an array of big objects representing the comments

 [ { /* ommited for simplicity */ },
   { /* ommited for simplicity */ },
   { /* ommited for simplicity */ } ]
```
- - - - - - - - - - - - - - - - - -
## Blocks and transactions
- - - - - - - - - - - - - - - - - -
### Get Block Header
```js
steem.api.getBlockHeader(blockNum, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Block
```js
steem.api.getBlock(blockNum, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Ops In Block
Gets all operations in a given block

```js
steem.api.getOpsInBlock(blockNum, onlyVirtual, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|blockNum|number|A positive number|
|onlyVirtual|bool|'false' to get all operations. 'true' to only get virtual operations|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getOpsInBlock(10000001, false, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
[ { trx_id: '4b688c13940fd5b4bb11356286ef12061f71976c',
    block: 10000001,
    trx_in_block: 0,
    op_in_trx: 0,
    virtual_op: 0,
    timestamp: '2017-03-08T17:34:24',
    op: [ 'vote', [Object] ] },
  { trx_id: 'a450debc8332c3b27935b3307891dfc509669edc',
    block: 10000001,
    trx_in_block: 2,
    op_in_trx: 0,
    virtual_op: 0,
    timestamp: '2017-03-08T17:34:24',
    op: [ 'vote', [Object] ] } ]

```
- - - - - - - - - - - - - - - - - -
### Get State
Gets a lot of information about the state of `path`

```js
steem.api.getStateWith(path, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|path|string| like "/@username". This is the extension from the Steem URL. It can be used on users, posts, comments, comments-by-user, replies-to-user and so on|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getState("/@username", function(err, data) {
	console.log(err, data);
});

// Here are some valid calls:

steem.api.getState("/@username", function(err, data) { console.log(data); });

steem.api.getState("/@username/permlink-of-post", function(err, data) { console.log(data); });

steem.api.getState("/@username/comments", function(err, data) { console.log(data); });

steem.api.getState("/@username/recent-replies", function(err, data) { console.log(data); });

steem.api.getState("/trending", function(err, data) { console.log(data); });

steem.api.getState("/trending/collorchallenge", function(err, data) { console.log(data); });

// and others....
```

Return Example:
```js
// The result is huge, and can have many variations depending on what you are getting the state of. It can't be documented briefly. Here is some basic information:
{	accounts: {username: {...}}
	content: {
		username/permlink1: {...},
		username/permlink2: {...}, 
		username/permlink3: {...} …}
	current_route:"/@username"
	discussion_idx: {...}
	error:""
	feed_price: {base: "3.889 SBD", quote: "1.000 STEEM"}
	pow_queue: []
	props: {...}
	tag_idx: { trending: [...] }
	tags:{...}
	witness_schedule: {...}
	witnesses: {...}	}
```
- - - - - - - - - - - - - - - - - -
### Get State With Options

```js
steem.api.getStateWith(options, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|options|object|like { path : "/@username"} where the path is an extension from a Steem URL. It can be used on users, posts, comments, comments-by-user, replies-to-user and so on|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getStateWith({ path : "/@username" }, function(err, data) {
	console.log(err, data);
});
```
See `steem.api.getState` for more examples...
- - - - - - - - - - - - - - - - - -
### Get Trending Categories
```js
steem.api.getTrendingCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Best Categories
```js
steem.api.getBestCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Active Categories
```js
steem.api.getActiveCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Recent Categories
```js
steem.api.getRecentCategories(after, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Globals
- - - - - - - - - - - - - - - - - -
### Get Config
```js
steem.api.getConfig(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Dynamic Global Properties
```js
steem.api.getDynamicGlobalProperties(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Chain Properties
```js
steem.api.getChainProperties(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Feed Entries
Gets the posts in the feed of a user.
The feed displays posts of followed users, as well as what they resteemed.

```js
steem.api.getFeedEntries(account, entryId, limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|entryId|number|the post id from which to start counting. Write '0' to start from newest post|
|limit|number|a positive number|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getFeedEntries("username", 0, 2, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
[ { author: 'otherusername',
    permlink: 'permlink',
    reblog_by: [ 'resteembot' ], 	//full when post is in feed because it's resteemed
    reblog_on: '2018-02-11T18:42:54',
    entry_id: 10260 },
  { author: 'otherusername',
    permlink: 'permlink',
    reblog_by: [  ], 				// false when post is in feed because user follows it's author
    reblog_on: '2018-02-11T18:39:24',
    entry_id: 10259 } ]
```
- - - - - - - - - - - - - - - - - -
### Get Feed History
```js
steem.api.getFeedHistory(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Current Median History Price
```js
steem.api.getCurrentMedianHistoryPrice(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Ticker
Gets the lates summorized data from the steem market.

```js
steem.api.getTicker(callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getTicker(function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
{ latest: '0.89732142857142860',
  lowest_ask: '0.89684014869888484',
  highest_bid: '0.89600000000000002',
  percent_change: '-14.56712923228768730',
  steem_volume: '7397.697 STEEM',
  sbd_volume: '6662.316 SBD' }
```
- - - - - - - - - - - - - - - - - -
### Get Trade History
Gets the trade history for a given period between a `start` date and an `end` date

```js
steem.api.getTradeHistory(start, end, limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|start|string|Datetime string in the format "2018-01-01T00:00:00"|
|end|string|Datetime string in the format "2018-01-01T00:00:00"|
|limit|number|a positive number|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var start = "2018-01-01T00:00:00";
var end = "2018-01-02T00:00:00";

steem.api.getTradeHistory(start, end, 5, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ { date: '2018-01-01T00:00:09',
    current_pays: '10.192 SBD',
    open_pays: '25.650 STEEM' },
  { date: '2018-01-01T00:00:09',
    current_pays: '2.000 SBD',
    open_pays: '5.033 STEEM' },
  { date: '2018-01-01T00:00:12',
    current_pays: '13.560 SBD',
    open_pays: '34.128 STEEM' },
  { date: '2018-01-01T00:00:12',
    current_pays: '3.057 SBD',
    open_pays: '7.690 STEEM' },
  { date: '2018-01-01T00:00:12',
    current_pays: '6.908 SBD',
    open_pays: '17.375 STEEM' } ] 
```
- - - - - - - - - - - - - - - - - -
### Get Version
Gets the version of the Steem blockchain you are connected to.

```js
steem.api.getVersion(callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getVersion(function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
{ blockchain_version: '0.19.2',
  steem_revision: '07be64314ce9d277eb7da921b459c993c2e2412c',
  fc_revision: '8dd1fd1ec0906509eb722fa7c8d280d59bcca23d' }
```
- - - - - - - - - - - - - - - - - -
### Get Volume
Gets the Steem and Steem Dollar volumes

```js
steem.api.getVolume(callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getVolume(function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
{ steem_volume: '8101.888 STEEM',
	sbd_volume: '7287.268 SBD' }
```
- - - - - - - - - - - - - - - - - -
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

- - - - - - - - - - - - - - - - - -
### Get Next Scheduled Hardfork
```js
steem.api.getNextScheduledHardfork(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Reward Fund
```js
steem.api.getRewardFund(name, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Claim Reward Balance
Claims pending rewards, be they Steem, SBD or Vests.

```js
steem.broadcast.claimRewardBalance(wif, account, reward_steem, reward_sbd, reward_vests, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|wif|string|Use steem.auth.toWif(user, pass, type)|
|account|string|a steem username|
|reward_steem|string|balance like "0.000 STEEM"|
|reward_sbd|string|balance like "0.000 SBD"|
|reward_vests|string|balance like "0.000006 VESTS"|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.broadcast.claimRewardBalance("5Hupd....pp7vGY", "username", "0.000 STEEM", "0.000 SBD", "0.000006 VESTS", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
{ id: '052f.......c6c2f',
  block_num: 19756287,
  trx_num: 40,
  expired: false,
  ref_block_num: 29928,
  ref_block_prefix: 808836877,
  expiration: '2018-02-10T20:12:15',
  operations: [ [ 'claim_reward_balance', [Object] ] ],
  extensions: [],
  signatures: [ '205......614e' ] }
```
- - - - - - - - - - - - - - - - - -
### Claim Reward Balance With Options
Claims pending rewards, be they Steem, SBD or Vests.

```js
steem.broadcast.claimRewardBalanceWith(wif, options, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|wif|string|Use < steem.auth.toWif(user, pass, type) >|
|options|object|an object containing the calim parameters. Look at the example below.|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var options = {
    account:"username",
    reward_sbd:"0.000 SBD",
    reward_steem:"0.000 STEEM",
    reward_vests:"0.000006 VESTS"
}
steem.broadcast.claimRewardBalanceWith("5Hupd....pp7vGY", options, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 { id: '4b7b........034c7',
  block_num: 19756322,
  trx_num: 3,
  expired: false,
  ref_block_num: 29965,
  ref_block_prefix: 4245658614,
  expiration: '2018-02-10T20:14:00',
  operations: [ [ 'claim_reward_balance', [Object] ] ],
  extensions: [],
  signatures: [ '1f61a..........4f3d7' ] }
```
- - - - - - - - - - - - - - - - - -
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
[ { id: 498422, delegator: 'ned', delegatee: 'spaminator', vesting_shares: '409517519.233783 VESTS', min_delegation_time: '2018-01-16T19:30:36' },
  { id: 181809, delegator: 'ned', delegatee: 'surpassinggoogle', vesting_shares: '1029059275.000000 VESTS', min_delegation_time: '2017-08-08T15:25:15' } ]
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

- - - - - - - - - - - - - - - - - -
## Keys
- - - - - - - - - - - - - - - - - -
### Get Key References
```js
steem.api.getKeyReferences(key, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Accounts
- - - - - - - - - - - - - - - - - -
### Get Accounts
```js
steem.api.getAccounts(names, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Account References
```js
steem.api.getAccountReferences(accountId, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Lookup Account Names
```js
steem.api.lookupAccountNames(accountNames, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Lookup Accounts
```js
steem.api.lookupAccounts(lowerBoundName, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Account Count
```js
steem.api.getAccountCount(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Conversion Requests
```js
steem.api.getConversionRequests(accountName, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Account History
```js
steem.api.getAccountHistory(account, from, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Owner History
```js
steem.api.getOwnerHistory(account, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Recovery Request
```js
steem.api.getRecoveryRequest(account, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Account Bandwidth
Get the bandwidth of the `account`.
The bandwidth is the limit of data that can be uploaded to the blockchain.
To have bigger bandwidth - power up your steem.

```js
steem.api.getAccountBandwidth(account, bandwidthType, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|bandwidthType|number|This is a value from an enumeration of predefined values. '1' is for the "Forum" bandwidth, and '2' is for "Market" bandwidth|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
const forumBandwidthType = 1;
const marketBandwidthType = 2;

steem.api.getAccountBandwidth("username", forumBandwidthType, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
{ id: 23638,
  account: 'username',
  type: 'forum',
  average_bandwidth: 260815714,
  lifetime_bandwidth: '125742000000',
  last_bandwidth_update: '2018-02-07T22:30:42' }
```
- - - - - - - - - - - - - - - - - -
### Get Account Bandwidth With Options
Get the bandwidth of the user specified in the options.

```js
steem.api.getAccountBandwidthWith(options, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|options|object|like { account: "username", bandwidthType: 1 } where bandwidthType is the value of an enumeration. 1 is "forum" and 2 is "market". They represent the bandwidths for posting and trading respectively|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var options = {
	account: "username",
	bandwidthType: 2
}
steem.api.getAccountBandwidthWith(options, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
{ id: 23675,
  account: 'username',
  type: 'market',
  average_bandwidth: 2608157142,
  lifetime_bandwidth: '94940000000',
  last_bandwidth_update: '2018-02-07T22:30:42' }
```
- - - - - - - - - - - - - - - - - -
### Get Account Reputations
Gets the reputation points of `limit` accounts with names most similar to `lowerBoundName`.

```js
steem.api.getAccountReputations(lowerBoundName, limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|lowerBoundName|string|a steem username query|
|limit|number|a positive number|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getAccountReputations("username", 2, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ { account: 'username', reputation: '26727073581' },
   { account: 'username-taken', reputation: 0 } ]
```
- - - - - - - - - - - - - - - - - -
## Market
- - - - - - - - - - - - - - - - - -
### Get Order Book
```js
steem.api.getOrderBook(limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Market Order Book
Takes the top-most `limit` entries in the market order book for both buy and sell orders.

```js
steem.api.getMarketOrderBook(limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|limit|number|a positive number|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getMarketOrderBook(2, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 { bids: 
   [ { price: '0.91116173120728938', steem: 2195, sbd: 2000 },
     { price: '0.91089965397923878', steem: 1156, sbd: 1053 } ],
  asks: 
   [ { price: '0.91145625249700357', steem: 9053, sbd: 8251 },
     { price: '0.91159226975214813', steem: 16184, sbd: 14753 } ] }
```
- - - - - - - - - - - - - - - - - -
### Get Market Order Book With Options
Takes the top-most `limit` entries in the market order book for both buy and sell orders.

```js
steem.api.getMarketOrderBookWith(options, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|options|object|like { limit:number }|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getMarketOrderBookWith({ limit: 3 }, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 { bids: 
   [ { price: '0.90160333845815954', steem: 9106, sbd: 8210 },
     { price: '0.90152855993563952', steem: 12430, sbd: 11206 },
     { price: '0.89992800575953924', steem: 5556, sbd: 5000 } ],
  asks: 
   [ { price: '0.91004578507945044', steem: 5055, sbd: 4600 },
     { price: '0.91103965702036438', steem: 15853, sbd: 14442 },
     { price: '0.91112433075550281', steem: 5874, sbd: 5351 } ] } 
```
- - - - - - - - - - - - - - - - - -
### Get Open Orders
```js
steem.api.getOpenOrders(owner, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Liquidity Queue
```js
steem.api.getLiquidityQueue(startAccount, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Market History Buckets

```js
steem.api.getMarketHistoryBuckets(callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getMarketHistoryBuckets(function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ 15, 60, 300, 3600, 86400 ]
```
- - - - - - - - - - - - - - - - - -
## Authority / validation
- - - - - - - - - - - - - - - - - -
### Get Transaction Hex
```js
steem.api.getTransactionHex(trx, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Transaction
```js
steem.api.getTransaction(trxId, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Required Signatures
```js
steem.api.getRequiredSignatures(trx, availableKeys, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Potential Signatures
```js
steem.api.getPotentialSignatures(trx, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Verify Authority
```js
steem.api.verifyAuthority(trx, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Verify Account Authority
```js
steem.api.verifyAccountAuthority(nameOrId, signers, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Tags Used By Author
Gets tags used by a steem user. Most users have no tags yet, but some do.

```js
steem.api.getTagsUsedByAuthor(author, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|author|string|a steem username|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getTagsUsedByAuthor("good-karma", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ [ 'challenge', 0 ] ]
```
- - - - - - - - - - - - - - - - - -
## Votes
- - - - - - - - - - - - - - - - - -
### Get Active Votes
```js
steem.api.getActiveVotes(author, permlink, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Account Votes
```js
steem.api.getAccountVotes(voter, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Content
- - - - - - - - - - - - - - - - - -
### Get Content
```js
steem.api.getContent(author, permlink, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Content Replies
```js
steem.api.getContentReplies(author, permlink, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Discussions By Author Before Date
```js
steem.api.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Reblogged By
Gives a list of the users that reblogged (resteemed) a given post

```js
steem.api.getRebloggedBy(author, permlink, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|author|string|a steem username|
|permlink|string|a permalink of comment or post|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getRebloggedBy("author", "example-permlink", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ 'author',
  'user1',
  'user2',
  'user3',
  'user4' ]
```
- - - - - - - - - - - - - - - - - -
### Get Replies By Last Update
```js
steem.api.getRepliesByLastUpdate(startAuthor, startPermlink, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Witnesses
- - - - - - - - - - - - - - - - - -
### Get Witnesses
```js
steem.api.getWitnesses(witnessIds, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - -
### Get Witnesses By Vote
```js
steem.api.getWitnessesByVote(from, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Lookup Witness Accounts
```js
steem.api.lookupWitnessAccounts(lowerBoundName, limit, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Witness Count
```js
steem.api.getWitnessCount(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Active Witnesses
```js
steem.api.getActiveWitnesses(function(err, result) {
  console.log(err, result);
});

```
- - - - - - - - - - - - - - - - - -
### Get Witness Schedule
Gets some general information about the witnesses.

```js
steem.api.getWitnessSchedule(callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getWitnessSchedule(function(err, data) {
  console.log(err,data);
}
```

Return Example:
```js
{ id: 0,
  current_virtual_time: '292589412128104496649868821',
  next_shuffle_block_num: 19756485,
  current_shuffled_witnesses: '31797..................00000000',
  num_scheduled_witnesses: 21,
  top19_weight: 1,
  timeshare_weight: 5,
  miner_weight: 1,
  witness_pay_normalization_factor: 25,
  median_props: 
   { account_creation_fee: '0.100 STEEM',
     maximum_block_size: 65536,
     sbd_interest_rate: 0 },
  majority_version: '0.19.2',
  max_voted_witnesses: 20,
  max_miner_witnesses: 0,
  max_runner_witnesses: 1,
  hardfork_required_witnesses: 17 }
```
- - - - - - - - - - - - - - - - - -
### Get Miner Queue
```js
steem.api.getMinerQueue(function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Login API
- - - - - - - - - - - - - - - - - -
### Login

/!\ It's **not safe** to use this method with your username and password. This method always return `true` and is only used internally with empty values to enable broadcast.

```js
steem.api.login('', '', function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Api By Name
```js
steem.api.getApiByName(apiName, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
## Follow API
The follower API queries information about follow relationships between accounts. The API is read-only and does not create changes on the blockchain.

- - - - - - - - - - - - - - - - - -
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
[ { follower: 'a-0-0', following: 'ned', what: [ 'blog' ] },
  { follower: 'a-0-0-0-1abokina', following: 'ned', what: [ 'blog' ] } ]
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


- - - - - - - - - - - - - - - - - -
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
[ { follower: 'dan', following: 'dantheman', what: [ 'blog' ] },
  { follower: 'dan', following: 'krnel', what: [ 'blog' ] } ]
```

Using the Result:
```js
// Extract followed accounts from the result into an array of account name strings
var f = result.map(function(item) { return item.following; });
```
See the usage examples for [getFollowers](#get-followers) because the behaviour is very similar.


See also: [getFollowers](#get-followers), [getFollowCount](#get-follow-count)


- - - - - - - - - - - - - - - - - -
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


- - - - - - - - - - - - - - - - - -
## Broadcast API
- - - - - - - - - - - - - - - - - -
### Broadcast Block With Options
Broadcast a new block on the steem blockchain.

```js
steem.api.broadcastBlockWith(options, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|options|object|like { b: blockObject } where blockObject contains the information on the block you are trying to broadcast|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
var options = { 
    b: {
        previous:"0000000000000000000000000000000000000000",
        timestamp:"1970-01-01T00:00:00",
        witness:"",
        transaction_merkle_root:"0000000000000000000000000000000000000000",
        extensions:[],
        witness_signature:
            "00000000000000000000000000000000000000000000000000000000000000000"+
            "00000000000000000000000000000000000000000000000000000000000000000",
        transactions: []
    }
};

steem.api.broadcastBlockWith(options, function(err, data) {
	console.log(err, data);
});
```
- - - - - - - - - - - - - - - - - -
### Broadcast Transaction Synchronous
```js
steem.api.broadcastTransactionSynchronous(trx, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Broadcast Block
```js
steem.api.broadcastBlock(b, function(err, result) {
  console.log(err, result);
});
```

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# Broadcast
The `steem.broadcast` methods cause permanent changes on the blockchain.
- - - - - - - - - - - - - - - - - -
### Account Create
```js
steem.broadcast.accountCreate(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Account Create With Delegation
```js
steem.broadcast.accountCreateWithDelegation(wif, fee, delegation, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, extensions, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Delegate Vesting Shares
Delegates STEEM POWER, denominated in VESTS, from a `delegator` to the `delegatee`. Requires the `delegator`'s private WIF key. Set the delegation to 0 to undelegate.
```js
steem.broadcast.delegateVestingShares(wif, delegator, delegatee, vesting_shares, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Account Update
```js
steem.broadcast.accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Account Witness Proxy
```js
steem.broadcast.accountWitnessProxy(wif, account, proxy, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Account Witness Vote
```js
steem.broadcast.accountWitnessVote(wif, account, witness, approve, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Challenge Authority
```js
steem.broadcast.challengeAuthority(wif, challenger, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Change Recovery Account
```js
steem.broadcast.changeRecoveryAccount(wif, accountToRecover, newRecoveryAccount, extensions, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Comment
```js
steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Comment Options
```js
steem.broadcast.commentOptions(wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes, allowCurationRewards, extensions, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Comment Payout
```js
steem.broadcast.commentPayout(wif, author, permlink, payout, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Comment Reward
```js
steem.broadcast.commentReward(wif, author, permlink, sbdPayout, vestingPayout, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Convert
```js
steem.broadcast.convert(wif, owner, requestid, amount, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Curate Reward
```js
steem.broadcast.curateReward(wif, curator, reward, commentAuthor, commentPermlink, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Custom
```js
steem.broadcast.custom(wif, requiredAuths, id, data, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Custom Binary
```js
steem.broadcast.customBinary(wif, id, data, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Custom Json
```js
steem.broadcast.customJson(wif, requiredAuths, requiredPostingAuths, id, json, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Delete Comment
```js
steem.broadcast.deleteComment(wif, author, permlink, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Escrow Dispute
```js
steem.broadcast.escrowDispute(wif, from, to, agent, who, escrowId, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Escrow Release
```js
steem.broadcast.escrowRelease(wif, from, to, agent, who, receiver, escrowId, sbdAmount, steemAmount, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Escrow Transfer
```js
steem.broadcast.escrowTransfer(wif, from, to, agent, escrowId, sbdAmount, steemAmount, fee, ratificationDeadline, escrowExpiration, jsonMeta, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Escrow
```js
steem.api.getEscrow(from, escrowId, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|from|string|a steem username|
|escrowId|number|id of the specific escrow transfer|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getEscrow("username", 23456789, function(err, data) {
	console.log(err, data);
});
```
- - - - - - - - - - - - - - - - - -
### Feed Publish
```js
steem.broadcast.feedPublish(wif, publisher, exchangeRate, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Pow2
```js
steem.broadcast.pow2(wif, work, newOwnerKey, props, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Fill Convert Request
```js
steem.broadcast.fillConvertRequest(wif, owner, requestid, amountIn, amountOut, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Fill Order
```js
steem.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Fill Vesting Withdraw
```js
steem.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Withdraw Routes
Gets withdraw routes (steem power withdraws).

```js
steem.api.getWithdrawRoutes(account, withdrawRouteType, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|withdrawRouteType|number|a number representing a value from an enumeration. Must be 0, 1 or 2|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getWithdrawRoutes("username", 1, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
[ { from_account: 'username',
    to_account: 'receiver',
    percent: 10000,
    auto_vest: false } ]
```
- - - - - - - - - - - - - - - - - -
### Interest
```js
steem.broadcast.interest(wif, owner, interest, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
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


- - - - - - - - - - - - - - - - - -
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


- - - - - - - - - - - - - - - - - -
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


- - - - - - - - - - - - - - - - - -
### Liquidity Reward
```js
steem.broadcast.liquidityReward(wif, owner, payout, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Pow
```js
steem.broadcast.pow(wif, worker, input, signature, work, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Prove Authority
```js
steem.broadcast.proveAuthority(wif, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Recover Account
```js
steem.broadcast.recoverAccount(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Set Reset Account
Changes the `current_reset_account` of the `account` to a new `reset_account`

```js
steem.broadcast.setResetAccount(wif, account, current_reset_account, reset_account, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|wif|string|Use < steem.auth.toWif(user, pass, type) >|
|account|string|a steem username|
|current_reset_account|string|a steem username|
|reset_account|string|a steem username|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.broadcast.setResetAccount(wif, "username", "oldresetaccount", "newresetaccount", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 AssertException
	`false: Set Reset Account Operation is currently disabled.`
```
- - - - - - - - - - - - - - - - - -
### Report Over Production
```js
steem.broadcast.reportOverProduction(wif, reporter, firstBlock, secondBlock, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Request Account Recovery
```js
steem.broadcast.requestAccountRecovery(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Escrow Approve
```js
steem.broadcast.escrowApprove(wif, from, to, agent, who, escrowId, approve, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Set Withdraw Vesting Route
```js
steem.broadcast.setWithdrawVestingRoute(wif, fromAccount, toAccount, percent, autoVest, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - -
### Vote
```js
steem.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Withdraw Vesting
```js
steem.broadcast.withdrawVesting(wif, account, vestingShares, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Witness Update
```js
steem.broadcast.witnessUpdate(wif, owner, url, blockSigningKey, props, fee, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Fill Vesting Withdraw
```js
steem.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Fill Order
```js
steem.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Recent Trades
Gets a list of the last `limit` trades from the market.

```js
steem.api.getRecentTrades(limit, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|limit|number|a positive number|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getRecentTrades(2, function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ { date: '2018-02-10T20:38:39',
    current_pays: '0.306 SBD',
    open_pays: '0.340 STEEM' },
  { date: '2018-02-10T20:36:48',
    current_pays: '8.982 SBD',
    open_pays: '9.995 STEEM' } ]
```
- - - - - - - - - - - - - - - - - -
### Fill Transfer From Savings
```js
steem.broadcast.fillTransferFromSavings(wif, from, to, amount, requestId, memo, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Get Savings Withdraw From
Gets a list of savings withdraws from `account`.

```js
steem.api.getSavingsWithdrawFrom(account, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getSavingsWithdrawFrom("username", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ /* list of withdraws from savings */ ]
```
- - - - - - - - - - - - - - - - - -
### Get Savings Withdraw To
Gets a list of savings withdraws from `account`.

```js
steem.api.getSavingsWithdrawTo(account, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|string|a steem username|
|callback|function|function(err, data) {/*code*/}|


Call Example:
```js
steem.api.getSavingsWithdrawTo("username", function(err, data) {
	console.log(err, data);
});
```

Return Example:
```js
 [ /* list of withdraws from savings */ ]
```
- - - - - - - - - - - - - - - - - -
### Comment Payout
```js
steem.broadcast.commentPayout(wif, author, permlink, payout, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Transfer To Savings
```js
steem.broadcast.transferToSavings(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Transfer From Savings
```js
steem.broadcast.transferFromSavings(wif, from, requestId, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
### Cancel Transfer From Savings
```js
steem.broadcast.cancelTransferFromSavings(wif, from, requestId, function(err, result) {
  console.log(err, result);
});
```
- - - - - - - - - - - - - - - - - -
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

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# Auth
- - - - - - - - - - - - - - - - - -
### Verify
```js
steem.auth.verify(name, password, auths);
```
- - - - - - - - - - - - - - - - - -
### Generate Keys
```js
steem.auth.generateKeys(name, password, roles);
```
- - - - - - - - - - - - - - - - - -
### Get Private Keys
```js
steem.auth.getPrivateKeys(name, password, roles);
```
- - - - - - - - - - - - - - - - - -
### Is Wif
```js
steem.auth.isWif(privWif);
```
- - - - - - - - - - - - - - - - - -
### To Wif
```js
steem.auth.toWif(name, password, role);
```
- - - - - - - - - - - - - - - - - -
### Wif Is Valid
```js
steem.auth.wifIsValid(privWif, pubWif);
```
- - - - - - - - - - - - - - - - - -
### Wif To Public
```js
steem.auth.wifToPublic(privWif);
```
- - - - - - - - - - - - - - - - - -
### Sign Transaction
```js
steem.auth.signTransaction(trx, keys);
```

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# Formatter
- - - - - - - - - - - - - - - - - -
### Amount
Formats number and currency to the valid way for sending (for example - it trims the number's floating point remainer to 3 digits only).

```js
steem.formatter.amount(_amount, asset);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|_amount|number|A positive number|
|asset|string|The name of a steem asset (steem, sbd)|


Call Example:
```js
steem.formatter.amount(53.442346, "STEEM");
```

Return Example:
```js
 "53.442 STEEM" 
```
- - - - - - - - - - - - - - - - - -
### Vesting Steem
Converts the vests of `account` into the number of Steem they represent.

```js
steem.formatter.vestingSteem(account, gprops, callback);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|object|a steem user object|
|groups|object|the properties object of the state of "/@username"|


Call Example:
```js
steem.api.getAccounts(["username"], function(e1, accounts) {
  steem.api.getState("/@username", function (e2, state) {        
	  var vestingSteem = steem.formatter.vestingSteem(accounts[0], state.props);	
  });
});
```

Return Example:
```js
 7.42431235
```
- - - - - - - - - - - - - - - - - -
### Number With Commas
Formats a big number, by adding a comma on every 3 digits.
Attention - only works on strings. No numbers can be passed directly.

```js
steem.formatter.numberWithCommas(x);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|x|string|Number to format as string|


Call Example:
```js
steem.formatter.numberWithCommas(53304432342.432.toString());
// or
steem.formatter.numberWithCommas("53304432342.432");
```

Return Example:
```js
 "53,304,432,342.432" 
```
- - - - - - - - - - - - - - - - - -
### Estimate Account Value
Gets the estimated dollar value of the assets of `account`

```js
steem.formatter.estimateAccountValue(account);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|account|object|a steem user object|


Call Example:
```js
steem.api.getAccounts(["username"], function(e1, accounts) {
  var accountValueInUSD = steem.formatter.estimateAccountValue(accounts[0])
    .catch(function (err) { console.log(err); })
    .then(function (data) { console.log(data); });
});
```

Return Example:
```js
 // The method returns a promise object, that later returns a number as result
 32.25
```
- - - - - - - - - - - - - - - - - -
### Create Suggested Password
```js
var password = steem.formatter.createSuggestedPassword();
console.log(password);
// => 'GAz3GYFvvQvgm7t2fQmwMDuXEzDqTzn9'
```
- - - - - - - - - - - - - - - - - -
### Comment Permlink
```js
var parentAuthor = 'ned';
var parentPermlink = 'a-selfie';
var commentPermlink = steem.formatter.commentPermlink(parentAuthor, parentPermlink);
console.log(commentPermlink);
// => 're-ned-a-selfie-20170621t080403765z'
```
- - - - - - - - - - - - - - - - - -
### Estimate Account Value
```js
var steemPower = steem.formatter.estimateAccountValue(account);
```
- - - - - - - - - - - - - - - - - -
### Reputation
```js
var reputation = steem.formatter.reputation(3512485230915);
console.log(reputation);
// => 56
```
- - - - - - - - - - - - - - - - - -
### Vest To Steem
```js
var steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
console.log(steemPower);
```

- - - - - - - - - - - - - - - - - -
- - - - - - - - - - - - - - - - - -
# Utils
- - - - - - - - - - - - - - - - - -
### Validate Username
```js
var isValidUsername = steem.utils.validateAccountName('test1234');
console.log(isValidUsername);
// => 'null'

var isValidUsername = steem.utils.validateAccountName('a1');
console.log(isValidUsername);
// => 'Account name should be longer.'
```
- - - - - - - - - - - - - - - - - -
### Camel Case
Formats a string with '_' characters to follow the CamelCase notation instead.

```js
steem.utils.camelCase(str);
```

|Parameter|Datatype|Description|
|---------|--------|-----------|
|str|string|the string will be converted to camelCase like "exampleString"|


Call Example:
```js
steem.utils.camelCase("example_string");
```

Return Example:
```js
"exampleString"
```
