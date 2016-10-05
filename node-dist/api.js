'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Steem = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _detectNode = require('detect-node');

var _detectNode2 = _interopRequireDefault(_detectNode);

var _methods = require('./methods');

var _methods2 = _interopRequireDefault(_methods);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debugEmitters = (0, _debug2.default)('steem:emitters');
var debugProtocol = (0, _debug2.default)('steem:protocol');
var debugSetup = (0, _debug2.default)('steem:setup');
var debugWs = (0, _debug2.default)('steem:ws');

var WebSocket = void 0;
if (_detectNode2.default) {
  WebSocket = require('ws'); // eslint-disable-line global-require
} else if (typeof window !== 'undefined') {
    WebSocket = window.WebSocket;
  } else {
    throw new Error('Couldn\'t decide on a `WebSocket` class');
  }

var DEFAULTS = {
  url: 'wss://steemit.com/wspa',
  apiIds: {
    database_api: 0,
    login_api: 1,
    follow_api: 2,
    network_broadcast_api: 4
  },
  id: 0
};

var Steem = exports.Steem = function (_EventEmitter) {
  _inherits(Steem, _EventEmitter);

  function Steem() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Steem);

    var _this = _possibleConstructorReturn(this, (Steem.__proto__ || Object.getPrototypeOf(Steem)).call(this, options));

    Object.assign(options, DEFAULTS);
    _this.options = options;

    _this.id = 0;
    _this.currentP = _bluebird2.default.fulfilled();
    _this.apiIds = _this.options.apiIds;
    _this.isOpen = false;
    _this.start();
    return _this;
  }

  _createClass(Steem, [{
    key: 'start',
    value: function start() {
      var _this2 = this;

      this.startP = new _bluebird2.default(function (resolve /* , reject*/) {
        _this2.ws = new WebSocket(_this2.options.url);
        _this2.releases = [_this2.listenTo(_this2.ws, 'open', function () {
          debugWs('Opened WS connection with', _this2.options.url);
          _this2.isOpen = true;
          resolve();
        }), _this2.listenTo(_this2.ws, 'close', function () {
          debugWs('Closed WS connection with', _this2.options.url);
          _this2.isOpen = false;
        }), _this2.listenTo(_this2.ws, 'message', function (message) {
          debugWs('Received message', message.data);
          _this2.emit('message', JSON.parse(message.data));
        })];
      });
      this.apiIdsP = this.getApiIds();
      return this.startP;
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.releases.forEach(function (release) {
        return release();
      });
      this.ws.removeEventListener();
      this.ws.close();
      delete this.ws;
      delete this.releases;
    }
  }, {
    key: 'listenTo',
    value: function listenTo(target, eventName, callback) {
      debugEmitters('Adding listener for', eventName, 'from', target.constructor.name);
      if (target.addEventListener) target.addEventListener(eventName, callback);else target.on(eventName, callback);

      return function () {
        debugEmitters('Removing listener for', eventName, 'from', target.constructor.name);
        if (target.removeEventListener) target.removeEventListener(eventName, callback);else target.removeListener(eventName, callback);
      };
    }
  }, {
    key: 'getApiIds',
    value: function getApiIds() {
      var _this3 = this;

      return _bluebird2.default.map(Object.keys(this.apiIds), function (name) {
        debugSetup('Syncing API IDs', name);
        return _this3.getApiByNameAsync(name).then(function (result) {
          _this3.apiIds[name] = result;
        });
      });
    }
  }, {
    key: 'send',
    value: function send(api, data, callback) {
      var _this4 = this;

      var id = data.id || this.id++;
      var currentP = this.currentP;
      this.currentP = _bluebird2.default.join(this.startP, currentP).then(function () {
        return new _bluebird2.default(function (resolve, reject) {
          var payload = JSON.stringify({
            id: id,
            method: 'call',
            params: [_this4.apiIds[api], data.method, data.params]
          });

          var release = _this4.listenTo(_this4, 'message', function (message) {
            // We're still seeing old messages
            if (message.id < id) {
              debugProtocol('Old message was dropped', message);
              return;
            }

            release();

            // We dropped a message
            if (message.id !== id) {
              debugProtocol('Response to RPC call was dropped', payload);
              return;
            }

            // Our message's response came back
            var errorCause = data.error;
            if (errorCause) {
              var err = new Error(errorCause);
              err.message = data;
              reject(err);
              return;
            }

            debugProtocol('Resolved', id);
            resolve(message.result);
          });

          debugWs('Sending message', payload);
          _this4.ws.send(payload);
        }).then(function (result) {
          return callback(null, result);
        }, function (err) {
          return callback(err);
        });
      });

      return this.currentP;
    }
  }, {
    key: 'streamBlockNumber',
    value: function streamBlockNumber(callback) {
      var _this5 = this;

      var ts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

      var current = '';
      var running = true;

      var update = function update() {
        if (!running) return;

        var result = void 0;
        _this5.getDynamicGlobalPropertiesAsync().then(function (result) {
          var blockId = result.head_block_number;
          if (blockId !== current) {
            current = blockId;
            callback(null, current);
          }

          _bluebird2.default.delay(ts).then(function () {
            update();
          });
        }, function (err) {
          callback(err);
        });
      };

      update();

      return function () {
        running = false;
      };
    }
  }, {
    key: 'streamBlock',
    value: function streamBlock(callback) {
      var _this6 = this;

      var current = '';
      var last = '';

      var release = this.streamBlockNumber(function (err, id) {
        if (err) {
          release();
          callback(err);
          return;
        }

        current = id;
        if (current !== last) {
          last = current;
          _this6.getBlock(current, callback);
        }
      });

      return release;
    }
  }, {
    key: 'streamTransactions',
    value: function streamTransactions(callback) {
      var release = this.streamBlock(function (err, result) {
        if (err) {
          release();
          callback(err);
          return;
        }

        result.transactions.forEach(function (transaction) {
          callback(null, transaction);
        });
      });

      return release;
    }
  }, {
    key: 'streamOperations',
    value: function streamOperations(callback) {
      var release = this.streamTransactions(function (err, transaction) {
        if (err) {
          release();
          callback(err);
          return;
        }

        transaction.operations.forEach(function (operation) {
          callback(null, operation);
        });
      });

      return release;
    }
  }]);

  return Steem;
}(_events2.default);

// Generate Methods from methods.json


_methods2.default.reduce(function (memo, method) {
  var methodName = (0, _util.camelCase)(method.method);
  var methodParams = method.params || [];

  memo[methodName + 'With'] = function Steem$$specializedSendWith(options, callback) {
    var params = methodParams.map(function (param) {
      return options[param];
    });

    return this.send(method.api, {
      method: method.method,
      params: params
    }, callback);
  };

  memo[methodName] = function Steem$specializedSend() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var options = methodParams.reduce(function (memo, param, i) {
      memo[param] = args[i];
      return memo;
    }, {});
    var callback = args[methodParams.length];

    return this[methodName + 'With'](options, callback);
  };

  return memo;
}, Steem.prototype);

_bluebird2.default.promisifyAll(Steem.prototype);

// Export singleton instance
var steem = new Steem();
exports.default = steem;