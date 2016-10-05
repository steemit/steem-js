'use strict';

module.exports = {
  reputation: function reputation(_reputation) {
    if (_reputation == null) return _reputation;
    _reputation = parseInt(_reputation);
    var rep = String(_reputation);
    var neg = rep.charAt(0) === '-';
    rep = neg ? rep.substring(1) : rep;
    var str = rep;
    var leadingDigits = parseInt(str.substring(0, 4));
    var log = Math.log(leadingDigits) / Math.log(10);
    var n = str.length - 1;
    var out = n + (log - parseInt(log));
    if (isNaN(out)) out = 0;
    out = Math.max(out - 9, 0);
    out = (neg ? -1 : 1) * out;
    out = out * 9 + 25;
    out = parseInt(out);
    return out;
  },

  vestToSteem: function vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem) {
    return parseFloat(totalVestingFundSteem) * (parseFloat(vestingShares) / parseFloat(totalVestingShares));
  },

  commentPermlink: function commentPermlink(parentAuthor, parentPermlink) {
    var timeStr = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '');
    parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '');
    return 're-' + parentAuthor + '-' + parentPermlink + '-' + timeStr;
  },

  amount: function amount(_amount, asset) {
    return _amount.toFixed(3) + ' ' + asset;
  }
};