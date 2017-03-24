'use strict';

var defaultConfig = require('../config.json');
module.exports = function () {
    var config = defaultConfig;
    var get = function get(key) {
        return config[key];
    };
    var set = function set(key, value) {
        config[key] = value;
    };
    return { get: get, set: set };
}();