const Benchmark = require('benchmark');
const dsteem = require('dsteem');
const steem = require('../..');

const suite = new Benchmark.Suite();

function runSteem() {
  const wif = '5JQy7moK9SvNNDxn8rKNfQYFME5VDYC2j9Mv2tb7uXV5jz3fQR8'
  const tx = {
    ref_block_num: 1234,
    ref_block_prefix: 445566,
    expiration: '2017-07-09T10:00:00.000',
    operations: [['vote', {
      voter: 'foo',
      author: 'bar',
      permlink: 'i-like-turtles',
      weight: 10000
    }]],
    extensions: [],
    signatures: []
  };
  const keys = {posting: wif};
  return steem.auth.signTransaction(tx, keys);
}
exports.runSteem = runSteem;

function runDsteem() {
  const wif = '5JQy7moK9SvNNDxn8rKNfQYFME5VDYC2j9Mv2tb7uXV5jz3fQR8'
  const tx = {
    ref_block_num: 1234,
    ref_block_prefix: 445566,
    expiration: '2017-07-09T10:00:00.000',
    operations: [['vote', {
      voter: 'foo',
      author: 'bar',
      permlink: 'i-like-turtles',
      weight: 10000
    }]],
    extensions: [],
    signatures: []
  };
  const key = dsteem.PrivateKey.fromString(wif);
  return dsteem.signTransaction(tx, key, dsteem.DEFAULT_CHAIN_ID);
}
exports.runDsteem = runDsteem;

suite.add('steem-js', runSteem);

suite.add('dsteem', runDsteem);

suite.on('complete', function() {
  console.log(this[0].toString());
  console.log(this[1].toString());
});

if (!module.parent) {
  suite.run();
}
