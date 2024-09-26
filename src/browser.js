const api = require("./api");
const auth = require("./auth");
const memo = require("./auth/memo");
const broadcast = require("./broadcast");
const config = require("./config");
const formatter = require("./formatter")(api);
const utils = require("./utils");

const steem = {
  api,
  auth,
  memo,
  broadcast,
  config,
  formatter,
  utils
};

if (typeof window !== "undefined") {
  window.steem = steem;
}

if (typeof global !== "undefined") {
  global.steem = steem;
}

exports = module.exports = steem;
