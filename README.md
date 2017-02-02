# Steem.js
Steem.js the JavaScript API for Steem blockchain

## Documentation 

- [Install](https://github.com/steemit/steem-js/tree/dev/doc#install)
- [Browser](https://github.com/steemit/steem-js/tree/dev/doc#browser)
- [Database API](https://github.com/steemit/steem-js/tree/dev/doc#api)
    - [WebSocket](https://github.com/steemit/steem-js/tree/dev/doc#websocket)
    - [Subscriptions](https://github.com/steemit/steem-js/tree/dev/doc#subscriptions)
    - [Tags](https://github.com/steemit/steem-js/tree/dev/doc#tags)
    - [Blocks and transactions](https://github.com/steemit/steem-js/tree/dev/doc#blocks-and-transactions)
    - [Globals](https://github.com/steemit/steem-js/tree/dev/doc#globals)
    - [Keys](https://github.com/steemit/steem-js/tree/dev/doc#keys)
    - [Accounts](https://github.com/steemit/steem-js/tree/dev/doc#accounts)
    - [Market](https://github.com/steemit/steem-js/tree/dev/doc#market)
    - [Authority / validation](https://github.com/steemit/steem-js/tree/dev/doc#authority--validation)
    - [Votes](https://github.com/steemit/steem-js/tree/dev/doc#votes)
    - [Content](https://github.com/steemit/steem-js/tree/dev/doc#content)
    - [Witnesses](https://github.com/steemit/steem-js/tree/dev/doc#witnesses)
- [Login API](https://github.com/steemit/steem-js/tree/dev/doc#login)
- [Follow API](https://github.com/steemit/steem-js/tree/dev/doc#follow-api)
- [Broadcast API](https://github.com/steemit/steem-js/tree/dev/doc#broadcast-api)
- [Broadcast](https://github.com/steemit/steem-js/tree/dev/doc#broadcast)
- [Auth](https://github.com/steemit/steem-js/tree/dev/doc#auth)

Here is full documentation:
https://github.com/steemit/steem-js/tree/dev/doc

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
http://cdn.steemjs.com/lib/latest/steem.min.js<br/>
https://cdn.steemjs.com/lib/latest/steem.min.js<br/>
```html 
<script src="//cdn.steemjs.com/lib/latest/steem.min.js"></script>
```

## Server
## Install
```
$ npm install steem --save
```

## WebSockets
wss://steemit.com/wspa By Default<br/>
wss://node.steem.ws<br/>
wss://this.piston.rocks<br/>

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

## Contributions
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list or on Steemit Chat https://steemit.chat/ channel #steemjs.

## Issues
When you find issues, please report them!

## License
MIT
