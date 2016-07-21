Number.prototype.formatMoney = function(c, d, t){
	var n = this,
		c = isNaN(c = Math.abs(c)) ? 2 : c,
		d = d == undefined ? "." : d,
		t = t == undefined ? "," : t,
		s = n < 0 ? "-" : "",
		i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;
	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

var balance = 100;
var value = 3.8;
for (var i = 1; i <= 365; i++ ) {
	balance = balance * 1.0075;
	console.log('**Day ' + i + ':** ' + (balance / value).formatMoney(2, '.', ',') + ' STEEM, $' + balance.formatMoney(2, '.', ','));
}