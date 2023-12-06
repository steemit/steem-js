[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/steemit/steem-js/blob/master/LICENSE)
[![Steem.js channel on steemit.chat](https://img.shields.io/badge/chat-steemit.chat-1c56a4.svg)](https://steemit.chat/channel/steemjs)

# Steem.js
Steem.js the JavaScript API for Steem blockchain

# Documentation

- [Install](https://github.com/steemit/steem-js/tree/master/doc#install)
- [Browser](https://github.com/steemit/steem-js/tree/master/doc#browser)
- [Config](https://github.com/steemit/steem-js/tree/master/doc#config)
- [Database API](https://github.com/steemit/steem-js/tree/master/doc#api)
    - [Subscriptions](https://github.com/steemit/steem-js/tree/master/doc#subscriptions)
    - [Tags](https://github.com/steemit/steem-js/tree/master/doc#tags)
    - [Blocks and transactions](https://github.com/steemit/steem-js/tree/master/doc#blocks-and-transactions)
    - [Globals](https://github.com/steemit/steem-js/tree/master/doc#globals)
    - [Keys](https://github.com/steemit/steem-js/tree/master/doc#keys)
    - [Accounts](https://github.com/steemit/steem-js/tree/master/doc#accounts)
    - [Market](https://github.com/steemit/steem-js/tree/master/doc#market)
    - [Authority / validation](https://github.com/steemit/steem-js/tree/master/doc#authority--validation)
    - [Votes](https://github.com/steemit/steem-js/tree/master/doc#votes)
    - [Content](https://github.com/steemit/steem-js/tree/master/doc#content)
    - [Witnesses](https://github.com/steemit/steem-js/tree/master/doc#witnesses)
- [Login API](https://github.com/steemit/steem-js/tree/master/doc#login)
- [Follow API](https://github.com/steemit/steem-js/tree/master/doc#follow-api)
- [Broadcast API](https://github.com/steemit/steem-js/tree/master/doc#broadcast-api)
- [Broadcast](https://github.com/steemit/steem-js/tree/master/doc#broadcast)
- [Auth](https://github.com/steemit/steem-js/tree/master/doc#auth)


Here is full documentation:
https://github.com/steemit/steem-js/tree/master/doc

## Browser
```html
<script src="./steem.min.js"></script>
<script>
steem.api.getAccounts(['ned', 'dan'], function(err, response){
    console.log(err, response);
});
</script>
```

## CDN
https://cdn.jsdelivr.net/npm/steem/dist/steem.min.js<br/>
```html
<script src="https://cdn.jsdelivr.net/npm/steem/dist/steem.min.js"></script>
```

## Webpack
[Please have a look at the webpack usage example.](https://github.com/steemit/steem-js/blob/master/examples/webpack-example)

## Server
## Install
```
$ npm install steem --save
```

## RPC Servers
https://api.steemit.com By Default<br/>

## Examples
### Broadcast Vote
```js
var steem = require('steem');

var wif = steem.auth.toWif(username, password, 'posting');
steem.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
	console.log(err, result);
});
```

### Get Accounts
```js
steem.api.getAccounts(['ned', 'dan'], function(err, result) {
	console.log(err, result);
});
```

### Get State
```js
steem.api.getState('/trends/funny', function(err, result) {
	console.log(err, result);
});
```

### Reputation Formatter
```js
var reputation = steem.formatter.reputation(user.reputation);
console.log(reputation);
```

### Steem Testnet
Steem-js requires some configuration to work on the public Steem testnet.

You need to set two Steem API options, `address_prefix` and `chain_id`.
```js
steem.api.setOptions({
  address_prefix: 'TST',
  chain_id: '46d82ab7d8db682eb1959aed0ada039a6d49afa1602491f93dde9cac3e8e6c32',
  useTestNet: true,
});
```

The Chain ID could change. If it does, it may not be reflected here, but will be documented on any testnet launch announcements.

## Contributions
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list.

## Issues
When you find issues, please report them!

## License
MIT    
