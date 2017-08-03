const steem = require('../lib');

/* Generate private active WIF */
const username = process.env.STEEM_USERNAME;
const password = process.env.STEEM_PASSWORD;
const privActiveWif = steem.auth.toWif(username, password, 'active');

/** Add posting key auth */
steem.broadcast.addKeyAuth({
    signingKey: privActiveWif,
    username,
    authorizedKey: 'STM88CPfhCmeEzCnvC1Cjc3DNd1DTjkMcmihih8SSxmm4LBqRq5Y9',
    role: 'posting',
  },
  (err, result) => {
    console.log(err, result);
  }
);
