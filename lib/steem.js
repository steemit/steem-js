var ws = require('ws');

var Steem = function(url){
	this.url = url || 'wss://this.piston.rocks';
};

Steem.prototype.send = function(data, callback) {
	var w = new ws(this.url);

	w.onmessage = function(msg) {
		var data = JSON.parse(msg.data);
		var err = data.error || '';
		callback(data.result, err);
	};

	w.onopen = function() {
		w.send(JSON.stringify(data));
	}
};

Steem.prototype.getAccountCount = function(callback) {
	this.send({
		'id': 1,
		'method': 'get_account_count'
	}, function(result, err) {
		callback(result, err);
	});
};

Steem.prototype.getAccounts = function(usernames, callback) {
	this.send({
		'id': 1,
		'method': 'get_accounts',
		'params': [usernames]
	}, function(result, err) {
		callback(result, err);
	});
};

Steem.prototype.getAccount = function(username, callback) {
	this.send({
		'id': 1,
		'method': 'get_accounts',
		'params': [[username]]
	}, function(result, err) {
		callback(result[0], err);
	});
};

Steem.prototype.getBlock = function(id, callback) {
	this.send({
		'id': 1,
		'method': 'get_block',
		'params': [id]
	}, function(result, err) {
		callback(result, err);
	});
};


Steem.prototype.streamBlockNumber = function(callback) {
	var current = '';
	var w = new ws(this.url);

	w.onmessage = function(msg) {
		var data = JSON.parse(msg.data);
		var blockId = data.result.head_block_number;
		if (blockId != current) {
			current = blockId;
			callback(current);
		}
	};

	w.onopen = function() {
		setInterval(function () {
			w.send(JSON.stringify({
				'id': 1,
				'method': 'get_dynamic_global_properties',
				'params': []
			}));
		}, 100);
	}
};

Steem.prototype.streamBlock = function(callback) {
	var w = new ws(this.url);
	var current = '';
	var last = '';
	this.streamBlockNumber(function(id) {
		current = id;
	});

	var self = this;
	w.onopen = function() {
		setInterval(function () {
			if (current != last) {
				last = current;
				self.getBlock(current, function(result) {
					callback(result);
				});
			}
		}, 100);
	}
};

Steem.prototype.streamTransactions = function(callback) {
	this.streamBlock(function(result) {
		result.transactions.forEach(function (transaction) {
			callback(transaction);
		});
	})
};

Steem.prototype.streamOperations = function(callback) {
	this.streamBlock(function(result) {
		result.transactions.forEach(function (transaction) {
			transaction.operations.forEach(function (operation) {
				callback(operation);
			});
		});
	})
};


module.exports = Steem;