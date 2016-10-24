const steemauth = require('steemauth');
const steem = require('..');

const username = process.env.STEEM_USERNAME;
const password = process.env.STEEM_PASSWORD;
const wif = steemauth.toWif(username, password, 'posting');

steem
  .broadcast
  .upvote(
    wif,
    username,
    'yamadapc',
    'test-post-bop-1-2-3-4-5-6',
    null,
    function(err, result) {
      console.log(err, result);
    }
  );
