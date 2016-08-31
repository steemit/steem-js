# Steem.js
Steem.js the JavaScript API for Steem blockchain

## Documentation 
Here is full documentation: https://github.com/adcpm/steem/tree/master/doc

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
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list or on Rocket Chat https://steem.chat/ channel #steemjs.

## Issues
When you find issues, please report them!

## License
MIT