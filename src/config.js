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
