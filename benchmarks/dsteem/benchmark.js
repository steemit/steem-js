const Benchmark = require('benchmark');
const dsteem = require('dsteem');
const steem = require('../..');

const suite = new Benchmark.Suite();

suite.add('steem-js', function() {
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
  const keys = {posting: wif}
  steem.auth.signTransaction(tx, keys)
});

suite.add('dsteem', function() {
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
  const key = dsteem.PrivateKey.fromString(wif)
  dsteem.signTransaction(tx, key, dsteem.DEFAULT_CHAIN_ID)
});

suite.on('complete', function() {
  console.log(this[0].toString());
  console.log(this[1].toString());
});

suite.run();
