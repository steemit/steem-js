const steem = require('../lib');

/* Generate private active WIF */
const username = process.env.STEEM_USERNAME;
const password = process.env.STEEM_PASSWORD;
const privActiveWif = steem.auth.toWif(username, password, 'active');

/* Output public active WIF */
//const pubActiveWif = steem.auth.wifToPublic(privActiveWif);
//console.log(pubActiveWif);

/* Add posting key auth */
steem.broadcast.addKeyAuth(
  privActiveWif,
  username,
  'STM88CPfhCmeEzCnvC1Cjc3DNd1DTjkMcmihih8SSxmm4LBqRq5Y9', // @fabien public posting WIF
  'posting',
  1,
  (err, result) => {
    console.log(err, result);
  }
);
