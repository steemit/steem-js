# SteemJS

## Install

```
$ npm install steem --save
```

## Usage

```js
var steem = require('./lib/steem');
var Steem = new steem();

Steem.getAccount('steemit', function(result, err) {
	console.log(result, err);
});
```

## Send
```js
var data = {
	'id': 1,
	'method': 'get_accounts',
	'params': [['steemit']]
};

Steem.send(data, function(result, err) {
	console.log(result, err);
});
```

http://piston.readthedocs.io/en/develop/lib.html#piston-api

## Get Accounts
```js
Steem.getAccounts(['ned', 'dan'], function(result, err) {
	console.log(result, err);
});
```

## Get Account
```js
Steem.getAccount('steemit', function(result, err) {
	console.log(result, err);
});
```

## Get Block
```js
Steem.getBlock(3000000, function(result, err) {
	console.log(result, err);
});
```

## Streaming Block Number
```js
Steem.streamBlockNumber(function(result) {
	console.log(result);
});
```

## Streaming Block
```js
Steem.streamBlock(function(result) {
	console.log(result);
});
```

## Streaming Transactions
```js
Steem.streamTransactions(function(result) {
	console.log(result);
});
```

## Streaming Operations
```js
Steem.streamOperations(function(result) {
	console.log(result);
});
```

## TO-DO
- Cancel All Subscriptions method
- Connect Account method
- Create Account method
- You have some suggestions? Let me know on Slack https://steem.slack.com/ channel #steemjs

## License

MIT




