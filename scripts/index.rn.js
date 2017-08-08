/* Patched for react native */

// Fix issue "Can't find variable: self"
// https://github.com/matthew-andrews/isomorphic-fetch/issues/125
require('whatwg-fetch');
// module.exports = self.fetch.bind(self);
const globalObject = typeof self === 'undefined' ? global : self;
module.exports = globalObject.fetch.bind(globalObject);

global.Buffer = require('buffer').Buffer;
global.process = require('process');
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production'; // eslint-disable-line

// Needed so that 'stream-http' chooses the right default protocol.
global.location = { protocol: 'file:' };

// Don't do this in production. You're going to want to patch in
// https://github.com/mvayngrib/react-native-randombytes or similar.
global.crypto = {
  getRandomValues(byteArray) {
    for (let i = 0; i < byteArray.length; i++) {
      byteArray[i] = Math.floor(256 * Math.random());
    }
  },
};

require('../dist/steem.min.js');
module.exports = global.steem;
