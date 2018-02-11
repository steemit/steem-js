import * as apiExported from "./api";
const auth = require("./auth");
const broadcast = require("./broadcast");
import {Config} from "./config";
const formatter = require("./formatter")(apiExported);
const utils = require("./utils");
const defaultConfig = require('../config.json');

const config = new Config(defaultConfig);

const api = apiExported.steem;
api.Steem = apiExported.Steem;
export const steem = {
     api,     auth,
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
