# Golos.js
Golos.js the JavaScript API for Golos blockchain

[FORKED BY STEEM.js](https://github.com/adcpm/steem)

## Documentation 
Here is full documentation: https://github.com/dacom_dark_sun/golosjs/tree/master/doc

## Browser 
```html 
<script src="./golos.js"></script>
<script>
golos.api.getAccounts(['ned', 'dan'], function(err, response){
    console.log(err, response);
});
</script>
```

## WebSockets
wss://golos.io/ By Default<br/>

## Examples
### Broadcast Vote
```js
var golos = require('golos');

var wif = golos.auth.toWif(username, password, 'posting');
golos.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
	console.log(err, result);
});
```

### Get Accounts
```js
golos.api.getAccounts(['ned', 'dan'], function(err, result) {
	console.log(err, result);
});
```

### Get State
```js 
golos.api.getState('/trends/funny', function(err, result) {
	console.log(err, result);
});
```

### Reputation Formatter
```js 
var reputation = golos.formatter.reputation(user.reputation);
console.log(reputation);
```

## Contributions
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list or on Rocket Chat https://steemit.chat/ channel #steemjs.

## Issues
When you find issues, please report them!

## License
MIT
