const defaultConfig = require('../config.json');
function isFunction(object) {
    return !!(object && object.constructor && object.call && object.apply);
}

module.exports = (function () {
    const config = defaultConfig;
    const listener = {};
    const get = (key) => config[key];
    const listen = (key, fn) => {
        listener[key] = listener[key] || [];
        listener[key].push(fn);
    };
    const set = (key, value) => {
        config[key] = value;

        // emit value to listeners
        const listeners = listener[key] || [];
        for (let i = 0; i < listeners.length; i++) {
            if (isFunction(listeners[i])) {
                listeners[i](value);
            }
        }
    }
    return { get, set, listen };
})()