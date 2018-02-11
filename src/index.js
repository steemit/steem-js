import {Steem} from "./api";
import {Auth} from "./auth";
import broadcast from "./broadcast";
import formatterFactory from "./formatter";
import {Memo} from "./auth/memo";
import {Config} from "./config";
import * as utils from "./utils";
const defaultConfig = require('../config.json');


const config = new Config(defaultConfig);
if(typeof config.Config !== 'undefined') {
  throw new Error("default config.json file may not contain a property 'Config'");
}
const api = new Steem(config);
const auth = new Auth();
const memo = new Memo();

const formatter =formatterFactory(api);

//As we are exporting singletons it would be easier to created them one place.
export default {
  api,
  auth,
  broadcast,
  formatter,
  memo,
  config,
  utils,
};
