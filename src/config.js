import each from 'lodash/each';
const defaultConfig = require('../config.json');

module.exports = (function () {
  const config = defaultConfig;
  const get = (key) => config[key];
  const set = (key, value) => {
    config[key] = value;
  };
  const c = {
    get,
    set
  };
  each(config, (value, key) => {
    Object.defineProperty(c, key, {
      get: () => get(key),
      set: (value) => set(key, value),
    });
  });
  return c;
})();
