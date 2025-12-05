# Steem.js API Documentation

Steem.js is a JavaScript/TypeScript library for interacting with the Steem blockchain. This documentation provides complete API reference and usage examples.

## Table of Contents

- [Installation](#installation)
- [Browser Usage](#browser-usage)
- [Configuration](#configuration)
- [JSON-RPC](#json-rpc)
    - [Signed RPC Calls](#signed-rpc-calls)
    - [Signature Verification](#signature-verification)
- [Database API](#database-api)
    - [Subscriptions](#subscriptions)
    - [Tags](#tags)
    - [Blocks and Transactions](#blocks-and-transactions)
    - [Global Properties](#global-properties)
    - [Keys](#keys)
    - [Accounts](#accounts)
    - [Market](#market)
    - [Authority / Validation](#authority--validation)
    - [Votes](#votes)
    - [Content](#content)
    - [Witnesses](#witnesses)
- [Login API](#login-api)
- [Follow API](#follow-api)
- [Broadcast API](#broadcast-api)
- [Broadcast Operations](#broadcast-operations)
- [Authentication](#authentication)
- [Formatter](#formatter)
- [Utils](#utils)

---

## Installation

### npm / pnpm / yarn

```bash
npm install @steemit/steem-js
# or
pnpm install @steemit/steem-js
# or
yarn add @steemit/steem-js
```

### Browser (CDN)

```html
<!-- Production: use minified version (692KB) -->
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.min.js"></script>

<!-- Development: use regular version (1.7MB) for better debugging -->
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.js"></script>
```

---

## Browser Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.min.js"></script>
<script>
steem.api.getAccountsAsync(['ned', 'dan']).then(function(accounts) {
    console.log(accounts);
}).catch(function(error) {
    console.error(error);
});
</script>
```

---

## Configuration

Default configuration works with Steem network. You can also configure it for other compatible networks:

```javascript
// Set API nodes (array of node URLs)
steem.config.set({
  nodes: ['https://api.steemit.com'],
  address_prefix: 'STM',
  chain_id: '0000000000000000000000000000000000000000000000000000000000000000'
});

// Or set individually
steem.config.set('address_prefix', 'STM');
steem.config.set('chain_id', '0000000000000000000000000000000000000000000000000000000000000000');
```

### Get Configuration

```javascript
const chainId = steem.config.get('chain_id');
console.log(chainId);
```

### Change API URL Directly

You can also change the API URL directly using `setUrl()` method:

```javascript
// Change API endpoint directly
steem.api.setUrl('https://api.steem.fans');

// Or use setOptions for more control
steem.api.setOptions({ 
  url: 'https://api.steem.fans',
  transport: 'http'
});
```

**Note:** When using `steem.config.set({ nodes: [...] })`, the API URL is automatically updated from the first node in the array. You only need to use `setUrl()` if you want to change the URL without updating the config.

---

## JSON-RPC

Activate JSON-RPC transport:

```javascript
steem.config.set({ nodes: ['https://api.steemit.com'] });
```

### Signed RPC Calls

For secure RPC calls that require authentication, use `signedCall`. This method signs the request with your private key to prove ownership of the account.

#### signedCall

Makes a signed JSON-RPC call to the Steem blockchain. The request is cryptographically signed to authenticate the caller.

```javascript
steem.api.signedCall(method, params, account, privateKey, callback);
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| method | string | The RPC method name to call |
| params | array | Parameters for the RPC method |
| account | string | The account name making the request |
| privateKey | string | Private key (WIF format) for signing |
| callback | function | Callback function(err, result) |

**Requirements:**
- Uses HTTP transport for all API calls
- Requires a valid private key in WIF format
- The account must match the private key

**Call Example:**

```javascript
// Configure for HTTP transport
steem.config.set({ 
  nodes: ['https://api.steemit.com'],
  transport: 'http' 
});

// Make a signed call
const privateKey = '5JLw5dgQAx6rhZEgNN5C2ds1V47RweGshynFSWFbaMohsYsBvE8';
const account = 'username';

steem.api.signedCall(
  'condenser_api.get_account_history',
  [account, -1, 10],
  account,
  privateKey,
  function(err, result) {
    if (err) {
      console.error('Signed call failed:', err);
    } else {
      console.log('Account history:', result);
    }
  }
);
```

**Promise Example:**

```javascript
// Using Promise wrapper
function signedCallAsync(method, params, account, privateKey) {
  return new Promise((resolve, reject) => {
    steem.api.signedCall(method, params, account, privateKey, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Usage with async/await
try {
  const result = await signedCallAsync(
    'condenser_api.get_account_history',
    ['username', -1, 10],
    'username',
    privateKey
  );
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error);
}
```

**Security Notes:**
- The request includes a timestamp and nonce to prevent replay attacks
- Signatures expire after 60 seconds
- Private keys are never transmitted, only the signature
- Each request is uniquely signed with cryptographic proof

**Use Cases:**
- Accessing private account data
- Making authenticated API calls
- Proving account ownership
- Secure communication with Steem nodes

### Signature Verification

For verifying signed requests and messages, Steem.js provides comprehensive verification utilities:

```javascript
import { signatureVerification } from '@steemit/steem-js/api';

// Verify a signed RPC request
const getAccountKeys = signatureVerification.createApiVerificationFunction(steem.api);
const result = await signatureVerification.verifySignedRequest(signedRequest, getAccountKeys);

if (result.valid) {
  console.log('✅ Signature verified for account:', result.account);
  console.log('Decoded parameters:', result.params);
} else {
  console.log('❌ Verification failed:', result.error);
}

// Verify a simple message signature
const message = 'Hello, Steem!';
const signature = steem.auth.sign(message, privateKey);
const publicKey = steem.auth.wifToPublic(privateKey);
const isValid = signatureVerification.verifyMessageSignature(message, signature, publicKey);
```

**Verification Features:**
- **Signed Request Validation**: Verify complete signed RPC requests
- **Message Signature Verification**: Verify individual message signatures
- **Batch Verification**: Verify multiple requests simultaneously
- **Expiration Checking**: Automatic signature expiration validation
- **Format Validation**: Validate signature and key formats
- **Account Key Extraction**: Extract public keys from account data

**See [Signature Verification Examples](./signature-verification-examples.md) for comprehensive usage guide.**

---

## Database API

### Subscriptions

#### Set Subscribe Callback

```javascript
steem.api.setSubscribeCallback(callback, clearFilter, function(err, result) {
  console.log(err, result);
});
```

#### Set Pending Transaction Callback

```javascript
steem.api.setPendingTransactionCallback(cb, function(err, result) {
  console.log(err, result);
});
```

#### Set Block Applied Callback

```javascript
steem.api.setBlockAppliedCallback(cb, function(err, result) {
  console.log(err, result);
});
```

#### Cancel All Subscriptions

```javascript
steem.api.cancelAllSubscriptions(function(err, result) {
  console.log(err, result);
});
```

### Tags

#### Get Trending Tags

Returns a list of the currently trending tags in descending order by value.

```javascript
steem.api.getTrendingTagsAsync(afterTag, limit).then(function(result) {
  console.log(result);
});
```

**Parameter Description:**

| Parameter | Description | Data Type | Notes |
|---|---|---|---|
| afterTag | The name of the last tag to begin from | String | Use the empty string `''` to start the list. Subsequent calls can use the last tag name |
| limit | The maximum number of tags to return | Integer | |

**Call Example:**

```javascript
steem.api.getTrendingTagsAsync('', 2).then(function(result) {
  console.log(result);
});
```

**Return Example:**

```javascript
[
  { name: '', total_payouts: '37610793.383 SBD', net_votes: 4211122, top_posts: 411832, comments: 1344461, trending: '5549490701' },
  { name: 'life', total_payouts: '8722947.658 SBD', net_votes: 1498401, top_posts: 127103, comments: 54049, trending: '570954588' }
]
```

**Using the Result:**

```javascript
// Extract tag names from the result into an array
const tagNames = result.map(function(item) { return item.name; });
console.log(tagNames);

// Get the last tag for subsequent calls
const lastKnownTag = result[result.length - 1].name;

// Use the last known tag to get the next group of tags
steem.api.getTrendingTagsAsync(lastKnownTag, 2).then(function(result) {
  console.log(result);
});
```

#### Get Blog

Gets the last `limit` number of posts of `account` before the post with index `entryId`.

```javascript
steem.api.getBlogAsync(account, entryId, limit).then(function(data) {
  console.log(data);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| account | string | A Steem username |
| entryId | number | A positive number - the index from which to start counting (zero-based index) |
| limit | number | A positive number - the max count of posts to be returned |

**Call Example:**

```javascript
steem.api.getBlogAsync("username", 10, 3).then(function(data) {
  console.log(data);
});

// In this case we get [3] posts, the newest of which is the one with index [10]
// (that's the 11th post, because post indexes are zero-based)
// This means the results will be posts [10, 9 and 8]
```

#### Get Blog Authors

Gets a list of all people who wrote in someone's blog, along with how many times they wrote in that blog.

```javascript
steem.api.getBlogAuthorsAsync(blogAccount).then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
[
  ['username1', 1],
  ['username2', 1],
  ['username3', 3],
  ['username4', 2],
  ['username5', 1]
]
```

#### Get Blog Entries

Gets the last `limit` number of posts of `account` before the post with index `entryId`. Very similar to getBlog but with much simpler result objects.

```javascript
steem.api.getBlogEntriesAsync(account, entryId, limit).then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
[
  { author: 'username', permlink: 'post-permlink-10', blog: 'username', reblog_on: '1970-01-01T00:00:00', entry_id: 10 },
  { author: 'username', permlink: 'post-permlink-9', blog: 'username', reblog_on: '1970-01-01T00:00:00', entry_id: 9 },
  { author: 'username', permlink: 'post-permlink-8', blog: 'username', reblog_on: '1970-01-01T00:00:00', entry_id: 8 }
]
```

#### Get Discussions By Trending

Gets the Steem posts as they would be shown in the trending tab of steemit.com.

```javascript
steem.api.getDiscussionsByTrendingAsync(query).then(function(data) {
  console.log(data);
});
```

**Call Example:**

```javascript
const query = { limit: 3, tag: "steem" };
steem.api.getDiscussionsByTrendingAsync(query).then(function(data) {
  console.log(data);
});

// NOTE! The default limit is 0. Not setting a limit will get you an empty result.
```

#### Other Discussion Query Methods

```javascript
// By created time
steem.api.getDiscussionsByCreatedAsync(query);

// By activity
steem.api.getDiscussionsByActiveAsync(query);

// By cashout time
steem.api.getDiscussionsByCashoutAsync(query);

// By payout amount
steem.api.getDiscussionsByPayoutAsync(query);

// By votes
steem.api.getDiscussionsByVotesAsync(query);

// By children
steem.api.getDiscussionsByChildrenAsync(query);

// By hot
steem.api.getDiscussionsByHotAsync(query);

// By feed
steem.api.getDiscussionsByFeedAsync(query);

// By blog
steem.api.getDiscussionsByBlogAsync(query);

// By comments
steem.api.getDiscussionsByCommentsAsync(query);
```

#### Get Discussions By Promoted

Gets the recent posts ordered by how much was spent to promote them.

```javascript
steem.api.getDiscussionsByPromotedAsync(query).then(function(data) {
  console.log(data);
});
```

**Call Example:**

```javascript
const query = { limit: 3, tag: "steem" };
steem.api.getDiscussionsByPromotedAsync(query).then(function(data) {
  console.log(data);
});
```

### Blocks and Transactions

#### Get Block Header

```javascript
steem.api.getBlockHeaderAsync(blockNum).then(function(result) {
  console.log(result);
});
```

#### Get Block

```javascript
steem.api.getBlockAsync(blockNum).then(function(result) {
  console.log(result);
});
```

#### Get Ops In Block

Gets all operations in a given block.

```javascript
steem.api.getOpsInBlockAsync(blockNum, onlyVirtual).then(function(data) {
  console.log(data);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| blockNum | number | A positive number |
| onlyVirtual | boolean | 'false' to get all operations. 'true' to only get virtual operations |

**Call Example:**

```javascript
steem.api.getOpsInBlockAsync(10000001, false).then(function(data) {
  console.log(data);
});
```

#### Get State

Gets a lot of information about the state of `path`.

```javascript
steem.api.getStateAsync(path).then(function(data) {
  console.log(data);
});
```

**Call Example:**

```javascript
// Valid call examples:
steem.api.getStateAsync("/@username");
steem.api.getStateAsync("/@username/permlink-of-post");
steem.api.getStateAsync("/@username/comments");
steem.api.getStateAsync("/@username/recent-replies");
steem.api.getStateAsync("/trending");
steem.api.getStateAsync("/trending/collorchallenge");
```

### Global Properties

#### Get Config

```javascript
steem.api.getConfigAsync().then(function(result) {
  console.log(result);
});
```

#### Get Dynamic Global Properties

```javascript
steem.api.getDynamicGlobalPropertiesAsync().then(function(result) {
  console.log(result);
});
```

#### Get Chain Properties

```javascript
steem.api.getChainPropertiesAsync().then(function(result) {
  console.log(result);
});
```

#### Get Feed Entries

Gets the posts in the feed of a user. The feed displays posts of followed users, as well as what they resteemed.

```javascript
steem.api.getFeedEntriesAsync(account, entryId, limit).then(function(data) {
  console.log(data);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| account | string | A Steem username |
| entryId | number | The post ID from which to start counting. Write '0' to start from newest post |
| limit | number | A positive number |

**Return Example:**

```javascript
[
  { author: 'otherusername', permlink: 'permlink', reblog_by: ['resteembot'], reblog_on: '2018-02-11T18:42:54', entry_id: 10260 },
  { author: 'otherusername', permlink: 'permlink', reblog_by: [], reblog_on: '2018-02-11T18:39:24', entry_id: 10259 }
]
```

#### Get Feed History

```javascript
steem.api.getFeedHistoryAsync().then(function(result) {
  console.log(result);
});
```

#### Get Current Median History Price

```javascript
steem.api.getCurrentMedianHistoryPriceAsync().then(function(result) {
  console.log(result);
});
```

#### Get Ticker

Gets the latest summarized data from the Steem market.

```javascript
steem.api.getTickerAsync().then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
{
  latest: '0.89732142857142860',
  lowest_ask: '0.89684014869888484',
  highest_bid: '0.89600000000000002',
  percent_change: '-14.56712923228768730',
  steem_volume: '7397.697 STEEM',
  sbd_volume: '6662.316 SBD'
}
```

#### Get Trade History

Gets the trade history for a given period between a `start` date and an `end` date.

```javascript
steem.api.getTradeHistoryAsync(start, end, limit).then(function(data) {
  console.log(data);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| start | string | Datetime string in the format "2018-01-01T00:00:00" |
| end | string | Datetime string in the format "2018-01-01T00:00:00" |
| limit | number | A positive number |

**Call Example:**

```javascript
const start = "2018-01-01T00:00:00";
const end = "2018-01-02T00:00:00";

steem.api.getTradeHistoryAsync(start, end, 5).then(function(data) {
  console.log(data);
});
```

#### Get Version

Gets the version of the Steem blockchain you are connected to.

```javascript
steem.api.getVersionAsync().then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
{
  blockchain_version: '0.19.2',
  steem_revision: '07be64314ce9d277eb7da921b459c993c2e2412c',
  fc_revision: '8dd1fd1ec0906509eb722fa7c8d280d59bcca23d'
}
```

#### Get Volume

Gets the Steem and Steem Dollar volumes.

```javascript
steem.api.getVolumeAsync().then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
{
  steem_volume: '8101.888 STEEM',
  sbd_volume: '7287.268 SBD'
}
```

#### Get Hardfork Version

Gets the current hardfork version of the STEEM blockchain.

```javascript
steem.api.getHardforkVersionAsync().then(function(result) {
  console.log(result); // '0.19.0'
});
```

#### Get Next Scheduled Hardfork

```javascript
steem.api.getNextScheduledHardforkAsync().then(function(result) {
  console.log(result);
});
```

#### Get Reward Fund

```javascript
steem.api.getRewardFundAsync(name).then(function(result) {
  console.log(result);
});
```

#### Get Vesting Delegations

Returns a list of delegations made from one `account`. Denominated in VESTS.

```javascript
steem.api.getVestingDelegationsAsync(account, from, limit).then(function(result) {
  console.log(result);
});
```

**Parameter Description:**

| Parameter | Description | Data Type | Notes |
|---|---|---|---|
| account | Account who is making the delegations | String | |
| from | The name of the last account to begin from | String | Use the empty string `''` to start the list. Subsequent calls can use the last delegatee's account name |
| limit | The maximum number of delegation records to return | Integer | |

**Call Example:**

```javascript
steem.api.getVestingDelegationsAsync('ned', '', 2).then(function(result) {
  console.log(result);
});
```

**Return Example:**

```javascript
[
  { id: 498422, delegator: 'ned', delegatee: 'spaminator', vesting_shares: '409517519.233783 VESTS', min_delegation_time: '2018-01-16T19:30:36' },
  { id: 181809, delegator: 'ned', delegatee: 'surpassinggoogle', vesting_shares: '1029059275.000000 VESTS', min_delegation_time: '2017-08-08T15:25:15' }
]
```

### Keys

#### Get Key References

```javascript
steem.api.getKeyReferencesAsync(key).then(function(result) {
  console.log(result);
});
```

### Accounts

#### Get Accounts

Gets multiple accounts by their names.

```javascript
steem.api.getAccountsAsync(names).then(function(result) {
  console.log(result);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| names | array | Array of account names (strings) |

**Call Example:**

```javascript
steem.api.getAccountsAsync(['ned', 'dan']).then(function(accounts) {
  console.log(accounts);
});
```

**Note:** To get a single account, pass an array with one name: `getAccountsAsync(['username'])` and access the first element of the result.

#### Get Account References

```javascript
steem.api.getAccountReferencesAsync(accountId).then(function(result) {
  console.log(result);
});
```

#### Lookup Account Names

```javascript
steem.api.lookupAccountNamesAsync(accountNames).then(function(result) {
  console.log(result);
});
```

#### Lookup Accounts

```javascript
steem.api.lookupAccountsAsync(lowerBoundName, limit).then(function(result) {
  console.log(result);
});
```

#### Get Account Count

```javascript
steem.api.getAccountCountAsync().then(function(result) {
  console.log(result);
});
```

#### Get Conversion Requests

```javascript
steem.api.getConversionRequestsAsync(accountName).then(function(result) {
  console.log(result);
});
```

#### Get Account History

```javascript
steem.api.getAccountHistoryAsync(account, from, limit).then(function(result) {
  console.log(result);
});
```

**Signed Version (for private account data):**

```javascript
// For accessing private or authenticated account data
const privateKey = steem.auth.toWif('username', 'password', 'active');

steem.api.signedCall(
  'condenser_api.get_account_history',
  ['username', -1, 100],
  'username',
  privateKey,
  function(err, result) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Private account history:', result);
    }
  }
);
```

#### Get Owner History

```javascript
steem.api.getOwnerHistoryAsync(account).then(function(result) {
  console.log(result);
});
```

#### Get Recovery Request

```javascript
steem.api.getRecoveryRequestAsync(account).then(function(result) {
  console.log(result);
});
```

#### Get Account Bandwidth

Get the bandwidth of the `account`. The bandwidth is the limit of data that can be uploaded to the blockchain. To have bigger bandwidth - power up your Steem.

```javascript
steem.api.getAccountBandwidthAsync(account, bandwidthType).then(function(data) {
  console.log(data);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| account | string | A Steem username |
| bandwidthType | number | This is a value from an enumeration of predefined values. '1' is for the "Forum" bandwidth, and '2' is for "Market" bandwidth |

**Call Example:**

```javascript
const forumBandwidthType = 1;
const marketBandwidthType = 2;

steem.api.getAccountBandwidthAsync("username", forumBandwidthType).then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
{
  id: 23638,
  account: 'username',
  type: 'forum',
  average_bandwidth: 260815714,
  lifetime_bandwidth: '125742000000',
  last_bandwidth_update: '2018-02-07T22:30:42'
}
```

#### Get Account Reputations

Gets the reputation points of `limit` accounts with names most similar to `lowerBoundName`.

```javascript
steem.api.getAccountReputationsAsync(lowerBoundName, limit).then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
[
  { account: 'username', reputation: '26727073581' },
  { account: 'username-taken', reputation: 0 }
]
```

### Market

#### Get Order Book

```javascript
steem.api.getOrderBookAsync(limit).then(function(result) {
  console.log(result);
});
```

#### Get Market Order Book

Takes the top-most `limit` entries in the market order book for both buy and sell orders.

```javascript
steem.api.getMarketOrderBookAsync(limit).then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
{
  bids: [
    { price: '0.91116173120728938', steem: 2195, sbd: 2000 },
    { price: '0.91089965397923878', steem: 1156, sbd: 1053 }
  ],
  asks: [
    { price: '0.91145625249700357', steem: 9053, sbd: 8251 },
    { price: '0.91159226975214813', steem: 16184, sbd: 14753 }
  ]
}
```

#### Get Open Orders

```javascript
steem.api.getOpenOrdersAsync(owner).then(function(result) {
  console.log(result);
});
```

#### Get Liquidity Queue

```javascript
steem.api.getLiquidityQueueAsync(startAccount, limit).then(function(result) {
  console.log(result);
});
```

#### Get Market History Buckets

```javascript
steem.api.getMarketHistoryBucketsAsync().then(function(data) {
  console.log(data); // [15, 60, 300, 3600, 86400]
});
```

### Authority / Validation

#### Get Transaction Hex

```javascript
steem.api.getTransactionHexAsync(trx).then(function(result) {
  console.log(result);
});
```

#### Get Transaction

```javascript
steem.api.getTransactionAsync(trxId).then(function(result) {
  console.log(result);
});
```

#### Get Required Signatures

```javascript
steem.api.getRequiredSignaturesAsync(trx, availableKeys).then(function(result) {
  console.log(result);
});
```

#### Get Potential Signatures

```javascript
steem.api.getPotentialSignaturesAsync(trx).then(function(result) {
  console.log(result);
});
```

#### Verify Authority

```javascript
steem.api.verifyAuthorityAsync(trx).then(function(result) {
  console.log(result);
});
```

#### Verify Account Authority

```javascript
steem.api.verifyAccountAuthorityAsync(nameOrId, signers).then(function(result) {
  console.log(result);
});
```

#### Get Tags Used By Author

Gets tags used by a Steem user. Most users have no tags yet, but some do.

```javascript
steem.api.getTagsUsedByAuthorAsync(author).then(function(data) {
  console.log(data);
});
```

**Call Example:**

```javascript
steem.api.getTagsUsedByAuthorAsync("good-karma").then(function(data) {
  console.log(data); // [['challenge', 0]]
});
```

### Votes

#### Get Active Votes

```javascript
steem.api.getActiveVotesAsync(author, permlink).then(function(result) {
  console.log(result);
});
```

#### Get Account Votes

```javascript
steem.api.getAccountVotesAsync(voter).then(function(result) {
  console.log(result);
});
```

### Content

#### Get Content

```javascript
steem.api.getContentAsync(author, permlink).then(function(result) {
  console.log(result);
});
```

#### Get Content Replies

```javascript
steem.api.getContentRepliesAsync(author, permlink).then(function(result) {
  console.log(result);
});
```

#### Get Discussions By Author Before Date

```javascript
steem.api.getDiscussionsByAuthorBeforeDateAsync(author, startPermlink, beforeDate, limit).then(function(result) {
  console.log(result);
});
```

#### Get Reblogged By

Gives a list of the users that reblogged (resteemed) a given post.

```javascript
steem.api.getRebloggedByAsync(author, permlink).then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
['author', 'user1', 'user2', 'user3', 'user4']
```

#### Get Replies By Last Update

```javascript
steem.api.getRepliesByLastUpdateAsync(startAuthor, startPermlink, limit).then(function(result) {
  console.log(result);
});
```

### Witnesses

#### Get Witnesses

```javascript
steem.api.getWitnessesAsync(witnessIds).then(function(result) {
  console.log(result);
});
```

#### Get Witness By Account

Returns information about a witness with the given `accountName`.

```javascript
steem.api.getWitnessByAccountAsync(accountName).then(function(result) {
  console.log(result);
});
```

#### Get Witnesses By Vote

```javascript
steem.api.getWitnessesByVoteAsync(from, limit).then(function(result) {
  console.log(result);
});
```

#### Lookup Witness Accounts

```javascript
steem.api.lookupWitnessAccountsAsync(lowerBoundName, limit).then(function(result) {
  console.log(result);
});
```

#### Get Witness Count

```javascript
steem.api.getWitnessCountAsync().then(function(result) {
  console.log(result);
});
```

#### Get Active Witnesses

```javascript
steem.api.getActiveWitnessesAsync().then(function(result) {
  console.log(result);
});
```

#### Get Witness Schedule

Gets some general information about the witnesses.

```javascript
steem.api.getWitnessScheduleAsync().then(function(data) {
  console.log(data);
});
```

**Return Example:**

```javascript
{
  id: 0,
  current_virtual_time: '292589412128104496649868821',
  next_shuffle_block_num: 19756485,
  current_shuffled_witnesses: '31797..................00000000',
  num_scheduled_witnesses: 21,
  top19_weight: 1,
  timeshare_weight: 5,
  miner_weight: 1,
  witness_pay_normalization_factor: 25,
  median_props: {
    account_creation_fee: '0.100 STEEM',
    maximum_block_size: 65536,
    sbd_interest_rate: 0
  },
  majority_version: '0.19.2',
  max_voted_witnesses: 20,
  max_miner_witnesses: 0,
  max_runner_witnesses: 1,
  hardfork_required_witnesses: 17
}
```

#### Get Miner Queue

```javascript
steem.api.getMinerQueueAsync().then(function(result) {
  console.log(result);
});
```

---

## Login API

### Login

⚠️ **It's not safe** to use this method with your username and password. This method always returns `true` and is only used internally with empty values to enable broadcast.

```javascript
steem.api.loginAsync('', '').then(function(result) {
  console.log(result);
});
```

### Get Api By Name

```javascript
steem.api.getApiByNameAsync(apiName).then(function(result) {
  console.log(result);
});
```

---

## Follow API

The follower API queries information about follow relationships between accounts. The API is read-only and does not create changes on the blockchain.

### Get Followers

Returns an alphabetical ordered array of the accounts that are following a particular account.

```javascript
steem.api.getFollowersAsync(following, startFollower, followType, limit).then(function(result) {
  console.log(result);
});
```

**Parameter Description:**

| Parameter | Description | Data Type | Notes |
|---|---|---|---|
| following | The followers of which account | String | No leading @ symbol |
| startFollower | Start the list from which follower? | String | No leading @ symbol. Use the empty string `''` to start the list. Subsequent calls can use the name of the last follower |
| followType | ?? | ?? | Set to 0 or 'blog' - either works |
| limit | The maximum number of followers to return | Integer | |

**Call Example:**

```javascript
steem.api.getFollowersAsync('ned', '', 'blog', 2).then(function(result) {
  console.log(result);
});
```

**Return Example:**

```javascript
[
  { follower: 'a-0-0', following: 'ned', what: ['blog'] },
  { follower: 'a-0-0-0-1abokina', following: 'ned', what: ['blog'] }
]
```

### Get Following

Returns an alphabetical ordered Array of the accounts that are followed by a particular account.

```javascript
steem.api.getFollowingAsync(follower, startFollowing, followType, limit).then(function(result) {
  console.log(result);
});
```

**Return Example:**

```javascript
[
  { follower: 'dan', following: 'dantheman', what: ['blog'] },
  { follower: 'dan', following: 'krnel', what: ['blog'] }
]
```

### Get Follow Count

```javascript
steem.api.getFollowCountAsync(account).then(function(result) {
  console.log(result);
});
```

**Return Example:**

```javascript
{ account: 'ned', follower_count: 16790, following_count: 913 }
```

---

## Broadcast API

### Broadcast Block

Broadcast a new block on the Steem blockchain.

```javascript
steem.api.broadcastBlockAsync(blockObject).then(function(data) {
  console.log(data);
});
```

### Broadcast Transaction Synchronous

```javascript
steem.api.broadcastTransactionSynchronousAsync(trx).then(function(result) {
  console.log(result);
});
```

---

## Broadcast Operations

The `steem.broadcast` methods cause permanent changes on the blockchain.

### Promise Support

All broadcast methods support both callback and Promise patterns. You can use either approach:

#### Promise Pattern (Recommended)

```javascript
// Using Promises directly
steem.broadcast.voteAsync(wif, voter, author, permlink, weight)
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Using async/await
async function castVote() {
  try {
    const result = await steem.broadcast.voteAsync(wif, voter, author, permlink, weight);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

#### Callback Pattern (Legacy)

```javascript
steem.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log(result);
  }
});
```

### Account Create

```javascript
steem.broadcast.accountCreateAsync(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata).then(function(result) {
  console.log(result);
});
```

### Account Create With Delegation

```javascript
steem.broadcast.accountCreateWithDelegationAsync(wif, fee, delegation, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, extensions).then(function(result) {
  console.log(result);
});
```

### Delegate Vesting Shares

Delegates STEEM POWER, denominated in VESTS, from a `delegator` to the `delegatee`. Requires the `delegator`'s private WIF key. Set the delegation to 0 to undelegate.

```javascript
steem.broadcast.delegateVestingSharesAsync(wif, delegator, delegatee, vesting_shares).then(function(result) {
  console.log(result);
});
```

### Account Update

```javascript
steem.broadcast.accountUpdateAsync(wif, account, owner, active, posting, memoKey, jsonMetadata).then(function(result) {
  console.log(result);
});
```

### Account Witness Proxy

```javascript
steem.broadcast.accountWitnessProxyAsync(wif, account, proxy).then(function(result) {
  console.log(result);
});
```

### Account Witness Vote

```javascript
steem.broadcast.accountWitnessVoteAsync(wif, account, witness, approve).then(function(result) {
  console.log(result);
});
```

### Change Recovery Account

```javascript
steem.broadcast.changeRecoveryAccountAsync(wif, accountToRecover, newRecoveryAccount, extensions).then(function(result) {
  console.log(result);
});
```

### Comment

```javascript
steem.broadcast.commentAsync(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata).then(function(result) {
  console.log(result);
});
```

### Comment Options

```javascript
steem.broadcast.commentOptionsAsync(wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes, allowCurationRewards, extensions).then(function(result) {
  console.log(result);
});
```

### Convert

```javascript
steem.broadcast.convertAsync(wif, owner, requestid, amount).then(function(result) {
  console.log(result);
});
```

### Custom

```javascript
steem.broadcast.customAsync(wif, requiredAuths, id, data).then(function(result) {
  console.log(result);
});
```

### Custom Json

```javascript
steem.broadcast.customJsonAsync(wif, requiredAuths, requiredPostingAuths, id, json).then(function(result) {
  console.log(result);
});
```

### Delete Comment

```javascript
steem.broadcast.deleteCommentAsync(wif, author, permlink).then(function(result) {
  console.log(result);
});
```

### Escrow Operations

```javascript
// Escrow Dispute
steem.broadcast.escrowDisputeAsync(wif, from, to, agent, who, escrowId);

// Escrow Release
steem.broadcast.escrowReleaseAsync(wif, from, to, agent, who, receiver, escrowId, sbdAmount, steemAmount);

// Escrow Transfer
steem.broadcast.escrowTransferAsync(wif, from, to, agent, escrowId, sbdAmount, steemAmount, fee, ratificationDeadline, escrowExpiration, jsonMeta);

// Escrow Approve
steem.broadcast.escrowApproveAsync(wif, from, to, agent, who, escrowId, approve);
```

### Get Escrow

```javascript
steem.api.getEscrowAsync(from, escrowId).then(function(data) {
  console.log(data);
});
```

### Feed Publish

```javascript
steem.broadcast.feedPublishAsync(wif, publisher, exchangeRate).then(function(result) {
  console.log(result);
});
```

### Limit Order Operations

```javascript
// Limit Order Cancel
steem.broadcast.limitOrderCancelAsync(wif, owner, orderid);

// Limit Order Create
steem.broadcast.limitOrderCreateAsync(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration);

// Limit Order Create2
steem.broadcast.limitOrderCreate2Async(wif, owner, orderid, amountToSell, exchangeRate, fillOrKill, expiration);
```

**Limit Order Parameter Description:**

| Parameter | Description | Data Type | Notes |
|---|---|---|---|
| wif | Active private key | String | |
| owner | Account name | String | No leading @ symbol |
| orderid | User defined ordernumber | Integer | Used to cancel orders |
| amountToSell | Amount to sell | String | "X.XXX ASSET" must have 3 decimal places. e.g. "25.100 SBD" |
| minToReceive | Amount desired | String | "X.XXX ASSET" must have 3 decimal places. e.g. "20.120 STEEM" |
| fillOrKill | Fill order from current order book or kill the order | Boolean | `false` places the order into the Order Book until either cancelled, filled, or the expiration time is reached |
| expiration | Time when order expires | Integer | Unit milliseconds. Zero is UNIX epoch |

### Account Recovery

```javascript
// Recover Account
steem.broadcast.recoverAccountAsync(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions);

// Request Account Recovery
steem.broadcast.requestAccountRecoveryAsync(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions);
```

### Transfer Operations

```javascript
// Transfer
steem.broadcast.transferAsync(wif, from, to, amount, memo);

// Transfer To Vesting
steem.broadcast.transferToVestingAsync(wif, from, to, amount);

// Transfer To Savings
steem.broadcast.transferToSavingsAsync(wif, from, to, amount, memo);

// Transfer From Savings
steem.broadcast.transferFromSavingsAsync(wif, from, requestId, to, amount, memo);

// Cancel Transfer From Savings
steem.broadcast.cancelTransferFromSavingsAsync(wif, from, requestId);
```

**Transfer Parameter Description:**

| Parameter | Description | Data Type | Notes |
|---|---|---|---|
| wif | Active private key for the `from` account | String | |
| from | Account name to take asset from | String | No leading @ symbol |
| to | Account name to place asset into | String | No leading @ symbol |
| amount | Amount of asset to transfer | String | "X.XXX ASSET" must have 3 decimal places. e.g. "5.150 SBD" |

### Vote

```javascript
steem.broadcast.voteAsync(wif, voter, author, permlink, weight).then(function(result) {
  console.log(result);
});
```

### Withdraw Vesting

```javascript
steem.broadcast.withdrawVestingAsync(wif, account, vestingShares).then(function(result) {
  console.log(result);
});
```

### Witness Update

```javascript
steem.broadcast.witnessUpdateAsync(wif, owner, url, blockSigningKey, props, fee).then(function(result) {
  console.log(result);
});
```

### Set Withdraw Vesting Route

```javascript
steem.broadcast.setWithdrawVestingRouteAsync(wif, fromAccount, toAccount, percent, autoVest).then(function(result) {
  console.log(result);
});
```

### Get Withdraw Routes

Gets withdraw routes (Steem Power withdraws).

```javascript
steem.api.getWithdrawRoutesAsync(account, withdrawRouteType).then(function(data) {
  console.log(data);
});
```

### Claim Reward Balance

Claims pending rewards, be they Steem, SBD or Vests.

```javascript
steem.broadcast.claimRewardBalanceAsync(wif, account, reward_steem, reward_sbd, reward_vests).then(function(data) {
  console.log(data);
});
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| wif | string | Use steem.auth.toWif(user, pass, type) |
| account | string | A Steem username |
| reward_steem | string | Balance like "0.000 STEEM" |
| reward_sbd | string | Balance like "0.000 SBD" |
| reward_vests | string | Balance like "0.000006 VESTS" |

### Multisig

You can use multisignature to broadcast an operation.

```javascript
steem.broadcast.sendAsync({
  extensions: [],
  operations: [
    ['vote', {
      voter: 'guest123',
      author: 'fabien',
      permlink: 'test',
      weight: 1000
    }]
  ]
}, [privPostingWif1, privPostingWif2]).then(result => {
  console.log(result);
});
```

---

## Authentication

### Verify

```javascript
steem.auth.verify(name, password, auths);
```

### Generate Keys

```javascript
steem.auth.generateKeys(name, password, roles);
```

### Get Private Keys

```javascript
steem.auth.getPrivateKeys(name, password, roles);
```

### Is Wif

```javascript
steem.auth.isWif(privWif);
```

### To Wif

```javascript
steem.auth.toWif(name, password, role);
```

### Wif Is Valid

```javascript
steem.auth.wifIsValid(privWif, pubWif);
```

### Wif To Public

```javascript
steem.auth.wifToPublic(privWif);
```

### Sign Transaction

```javascript
steem.auth.signTransaction(trx, keys);
```

---

## Formatter

### Amount

Formats number and currency to the valid way for sending (for example - it trims the number's floating point remainder to 3 digits only).

```javascript
steem.formatter.amount(_amount, asset);
```

**Parameter Description:**

| Parameter | Data Type | Description |
|---------|--------|-----------|
| _amount | number | A positive number |
| asset | string | The name of a Steem asset (steem, sbd) |

**Call Example:**

```javascript
steem.formatter.amount(53.442346, "STEEM"); // "53.442 STEEM"
```

### Vesting Steem

Converts the vests of `account` into the number of Steem they represent.

```javascript
steem.formatter.vestingSteem(account, gprops);
```

**Call Example:**

```javascript
steem.api.getAccountsAsync(["username"]).then(function(accounts) {
  steem.api.getStateAsync("/@username").then(function(state) {        
    const vestingSteem = steem.formatter.vestingSteem(accounts[0], state.props);
    console.log(vestingSteem); // 7.42431235
  });
});
```

### Number With Commas

Formats a big number, by adding a comma on every 3 digits. Attention - only works on strings. No numbers can be passed directly.

```javascript
steem.formatter.numberWithCommas(x);
```

**Call Example:**

```javascript
steem.formatter.numberWithCommas("53304432342.432"); // "53,304,432,342.432"
```

### Estimate Account Value

Gets the estimated dollar value of the assets of `account`.

```javascript
steem.formatter.estimateAccountValue(account).then(function(data) {
  console.log(data); // 32.25
});
```

### Create Suggested Password

```javascript
const password = steem.formatter.createSuggestedPassword();
console.log(password); // 'GAz3GYFvvQvgm7t2fQmwMDuXEzDqTzn9'
```

### Comment Permlink

```javascript
const parentAuthor = 'ned';
const parentPermlink = 'a-selfie';
const commentPermlink = steem.formatter.commentPermlink(parentAuthor, parentPermlink);
console.log(commentPermlink); // 're-ned-a-selfie-20170621t080403765z'
```

### Reputation

```javascript
const reputation = steem.formatter.reputation(3512485230915);
console.log(reputation); // 56
```

### Vest To Steem

```javascript
const steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
console.log(steemPower);
```

---

## Utils

### Validate Username

```javascript
const isValidUsername = steem.utils.validateAccountName('test1234');
console.log(isValidUsername); // null

const isValidUsername2 = steem.utils.validateAccountName('a1');
console.log(isValidUsername2); // 'Account name should be longer.'
```

### Camel Case

Formats a string with '_' characters to follow the CamelCase notation instead.

```javascript
steem.utils.camelCase(str);
```

**Call Example:**

```javascript
steem.utils.camelCase("example_string"); // "exampleString"
```

---

## Usage Examples

### Basic Usage

```javascript
import { steem } from '@steemit/steem-js';

// Configure API endpoint
steem.config.set({
  nodes: ['https://api.steemit.com'],
  address_prefix: 'STM',
  chain_id: '0000000000000000000000000000000000000000000000000000000000000000'
});

// Get account information
const account = await steem.api.getAccountsAsync(['ned']);
console.log(account);

// Generate keys
const keys = steem.auth.generateKeys('username', 'password', ['owner', 'active', 'posting', 'memo']);
console.log(keys);
```

### Voting Example

```javascript
// Vote on a post
const postingWif = steem.auth.toWif('username', 'password', 'posting');
await steem.broadcast.voteAsync(
  postingWif,
  'voter',
  'author',
  'permlink',
  10000 // weight
);
```

### Transfer Example

```javascript
// Transfer STEEM
const activeWif = steem.auth.toWif('username', 'password', 'active');
await steem.broadcast.transferAsync(
  activeWif,
  'from',
  'to',
  '1.000 STEEM',
  'memo'
);
```

### Publishing Post Example

```javascript
// Publish new post
const postingWif = steem.auth.toWif('username', 'password', 'posting');
await steem.broadcast.commentAsync(
  postingWif,
  '', // parentAuthor (empty string means main post)
  'general', // parentPermlink (category)
  'author',
  'my-post-permlink',
  'My Post Title',
  'This is the body of my post.',
  JSON.stringify({
    tags: ['general', 'blog'],
    app: 'my-app/1.0'
  })
);
```

---

## Error Handling

All async methods will throw errors and should be handled appropriately:

```javascript
try {
  const account = await steem.api.getAccountsAsync(['nonexistent']);
  console.log(account);
} catch (error) {
  console.error('Error fetching account:', error.message);
}

// Or using Promise catch
steem.api.getAccountsAsync(['nonexistent'])
  .then(account => console.log(account))
  .catch(error => console.error('Error:', error.message));
```

---

## Security Notes

- Private keys are never logged or exposed
- Uses cryptographically secure random number generation
- All cryptographic operations use proper implementations
- Always verify transaction parameters in production
- Never hardcode private keys in client-side code

---

## TypeScript Support

Steem.js fully supports TypeScript with complete type definitions:

```typescript
import { steem, Account, DynamicGlobalProperties } from '@steemit/steem-js';

// Type-safe API calls
const accounts: Account[] = await steem.api.getAccountsAsync(['ned']);
const props: DynamicGlobalProperties = await steem.api.getDynamicGlobalPropertiesAsync();

// Typed configuration
steem.config.set({
  nodes: ['https://api.steemit.com'],
  address_prefix: 'STM' as const,
  chain_id: '0000000000000000000000000000000000000000000000000000000000000000'
});
```

---

## License

MIT

---

## Additional Resources

- **[SignedCall Examples](./signedCall-examples.md)** - Comprehensive guide for authenticated API calls
- **[Signature Verification Examples](./signature-verification-examples.md)** - Complete guide for verifying signatures
- **[Refactoring History](./refactoring-2025.md)** - Technical details about the 2025 modernization

## Contributing

Contributions are welcome! Please check the project's GitHub repository for more information.

---

*This documentation is based on Steem.js v1.0.4. For updates, please refer to the latest version documentation.*