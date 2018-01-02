import each from 'lodash/each';
const defaultConfig = require('../config.json');

class Config {
  constructor(c) {
    each(c, (value, key) => {
      this[key] = value;
    });
  }

  get(k) {
    return this[k];
  }

  set(k, v) {
    this[k] = v;
  }
}

module.exports = new Config(defaultConfig);
if(typeof module.exports.Config !== 'undefined') {
  throw new Error("default config.json file may not contain a property 'Config'");
}
module.exports.Config = Config;
