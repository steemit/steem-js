var isNode = require('detect-node');
if (isNode) var WS = require('ws');

var Steem = {
  url: 'wss://steemit.com/wspa',
  apiIds: {
    'database_api': 0,
    'login_api': 1,
    'follow_api': 2,
    'network_broadcast_api': 4
  },
  id: 0,
  reqs: [],
  isOpen: false,
  isReady: false
};

Steem.setWebSocket = function(url) {
  this.url = url;
};

Steem.init = function(callback) {
  if (!this.isReady) {
    if (isNode) {
      this.ws = new WS(this.url);
      this.ws.setMaxListeners(0);
    } else {
      this.ws = new WebSocket(this.url);
    }
    this.ws.addEventListener('close', function() {
      this.ws.close();
      this.isReady = false;
      this.isOpen = false;
    }.bind(this));
    this.isReady = true;
  }
  if (!this.isOpen) {
    this.ws.addEventListener('open', function() {
      this.isOpen = true;
      this.getApiByName('database_api', function() {});
      this.getApiByName('login_api', function() {});
      this.getApiByName('follow_api', function() {});
      this.getApiByName('network_broadcast_api', function() {});
      callback();
    }.bind(this));
  } else {
    callback();
  }
};

Steem.iterate = function() {
  this.id++;
  var id = this.id;
  this.reqs.push(id);
  return id;
};

Steem.getApi = function(api, callback) {
  if (this.apiIds[api] || this.apiIds[api] === 0) {
    callback('', this.apiIds[api]);
  } else {
    this.getApiByName(api, function(err, result) {
      this.apiIds[api] = result;
      callback('', result);
    }.bind(this));
  }
};

Steem.send = function(api, data, callback) {
  data.id = data.id || 0;
  data.params = data.params || [];
  this.init(function(){
    var call = {};
    call.id = data.id;
    call.method = 'call';
    call.params = [this.apiIds[api], data.method, data.params];
    this.ws.send(JSON.stringify(call));
  }.bind(this));

  this.ws.addEventListener('message', function(msg) {
    var data = JSON.parse(msg.data);
    var err = (data.error && data.error.data && data.error.data.stack)? data.error.data.stack : '';
    callback(err, data);
  }.bind(this));

  this.ws.addEventListener('error', function(error){
    callback(error, null);
  });
};


// [database_api]

var generatedMethods = require('./api-from-methods');
generatedMethods(Steem);

// [Stream]

Steem.streamBlockNumber = function(callback) {
  var current = '';
  var self = this;
  setInterval(function() {
    self.getDynamicGlobalProperties(function(err, result) {
      var blockId = result.head_block_number;
      if (blockId != current) {
        current = blockId;
        callback(null, current);
      }
    });
  }, 200);
};

Steem.streamBlock = function(callback) {
  var current = '';
  var last = '';
  var self = this;
  this.streamBlockNumber(function(err, id) {
    current = id;
    if (current != last) {
      last = current;
      self.getBlock(current, function(err, result) {
        callback(null, result);
      });
    }
  });
};

Steem.streamTransactions = function(callback) {
  this.streamBlock(function(err, result) {
    if (!!result) {
      result.transactions.forEach(function(transaction) {
        callback(null, transaction);
      });
    }
  })
};

Steem.streamOperations = function(callback) {
  this.streamBlock(function(err, result) {
    if (!!result) {
      result.transactions.forEach(function(transaction) {
        transaction.operations.forEach(function (operation) {
          callback(null, operation);
        });
      });
    }
  })
};


module.exports = Steem;
