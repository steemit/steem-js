const should = require('should');
const runSteem = require('./benchmark').runSteem;
const runDsteem = require('./benchmark').runDsteem;

function run() {
  const r = runSteem();
  console.log('steem:');
  console.log(r);

  const dr = runDsteem();
  console.log('dsteem:');
  console.log(dr);

  r.signatures.should.eql(dr.signatures);
}

if (!module.parent) {
  run();
}
