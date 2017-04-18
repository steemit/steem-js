const defaultConfig = require('../config.json');

module.exports = (function () {
  const config = defaultConfig;
  const get = (key) => config[key];
  const set = (key, value) => {
    config[key] = value;
  };
  return { get, set };
})();