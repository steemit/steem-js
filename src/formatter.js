module.exports = steemAPI => ({
  reputation: function(reputation) {
    if (reputation == null) return reputation;
    reputation = parseInt(reputation);
    let rep = String(reputation);
    const neg = rep.charAt(0) === "-";
    rep = neg ? rep.substring(1) : rep;
    const str = rep;
    const leadingDigits = parseInt(str.substring(0, 4));
    const log = Math.log(leadingDigits) / Math.log(10);
    const n = str.length - 1;
    let out = n + (log - parseInt(log));
    if (isNaN(out)) out = 0;
    out = Math.max(out - 9, 0);
    out = (neg ? -1 : 1) * out;
    out = out * 9 + 25;
    out = parseInt(out);
    return out;
  },

  vestToSteem: function(
    vestingShares,
    totalVestingShares,
    totalVestingFundSteem
  ) {
    return (
      parseFloat(totalVestingFundSteem) *
      (parseFloat(vestingShares) / parseFloat(totalVestingShares))
    );
  },

  commentPermlink: function(parentAuthor, parentPermlink) {
    const timeStr = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9]+/g, "")
      .toLowerCase();
    parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, "");
    return "re-" + parentAuthor + "-" + parentPermlink + "-" + timeStr;
  },

  amount: function(amount, asset) {
    return amount.toFixed(3) + " " + asset;
  }
});
