'use strict';

var steem = {
  api: require('./api'),
  formatter: require('./formatter'),
  auth: require('steemauth'),
  broadcast: require('./broadcast')
};

if (typeof window !== 'undefined') {
  window.steem = steem;
}

if (typeof global !== 'undefined') {
  global.steem = steem;
}

exports = module.exports = steem;