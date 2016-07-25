# SteemJS
SteemJS the JavaScript API for Steem blockchain

## Install
```
$ npm install steem --save
```

## Documentation 
https://steemjs.com/
https://github.com/adcpm/steem/tree/master/doc

## Examples
### Get Accounts
```js
var Steem = require('steem');
var steem = new Steem();

steem.getAccounts(['ned', 'dan'], function(err, result) {
	console.log(err, result);
});
```

### Get State
```js 
steem.getState('/trends/funny', function(err, result) {
	console.log(err, result);
});
```

### Get Config
```js 
steem.getConfig(function(err, result) {
	console.log(err, result);
});
```

## Browser
Front-end library will be available soon as possible.

## Contributions
Patches are welcome! Contributors are listed in the package.json file. Please run the tests before opening a pull request and make sure that you are passing all of them. If you would like to contribute, but don't know what to work on, check the issues list or on Slack https://steem.slack.com/ channel #steemjs.

## Issues
When you find issues, please report them!

## License
MIT