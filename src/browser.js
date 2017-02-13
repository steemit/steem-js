const steem = {
  api: require('./api'),
  auth: require('./auth'),
  broadcast: require('./broadcast'),
  formatter: require('./formatter'),
};

if (typeof window !== 'undefined') {
  window.steem = steem;
}

if (typeof global !== 'undefined') {
  global.steem = steem;
}

exports = module.exports = steem;
