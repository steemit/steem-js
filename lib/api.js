'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _cloneDeep = require('lodash/cloneDeep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

var _defaults = require('lodash/defaults');

var _defaults2 = _interopRequireDefault(_defaults);

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
    follow_api: 3,
    network_broadcast_api: 2
  },
  id: 0
};

var Steem = function (_EventEmitter) {
  _inherits(Steem, _EventEmitter);

  function Steem() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Steem);

    var _this = _possibleConstructorReturn(this, (Steem.__proto__ || Object.getPrototypeOf(Steem)).call(this, options));

    (0, _defaults2.default)(options, DEFAULTS);
    _this.options = (0, _cloneDeep2.default)(options);

    _this.id = 0;
    _this.inFlight = 0;
    _this.currentP = _bluebird2.default.fulfilled();
    _this.apiIds = _this.options.apiIds;
    _this.isOpen = false;
    _this.releases = [];
    return _this;
  }

  _createClass(Steem, [{
    key: 'setWebSocket',
    value: function setWebSocket(url) {
      debugSetup('Setting WS', url);
      this.options.url = url;
      this.stop();
    }
  }, {
    key: 'start',
    value: function start() {
      var _this2 = this;

      if (this.startP) {
        return this.startP;
      }

      var startP = new _bluebird2.default(function (resolve, reject) {
        if (startP !== _this2.startP) return;
        var url = _this2.options.url;
        _this2.ws = new WebSocket(url);

        var releaseOpen = _this2.listenTo(_this2.ws, 'open', function () {
          debugWs('Opened WS connection with', url);
          _this2.isOpen = true;
          releaseOpen();
          resolve();
        });

        var releaseClose = _this2.listenTo(_this2.ws, 'close', function () {
          debugWs('Closed WS connection with', url);
          _this2.isOpen = false;
          _this2.stop();

          if (startP.isPending()) {
            reject(new Error('The WS connection was closed before this operation was made'));
          }
        });

        var releaseMessage = _this2.listenTo(_this2.ws, 'message', function (message) {
          debugWs('Received message', message.data);
          _this2.emit('message', JSON.parse(message.data));
        });

        _this2.releases = _this2.releases.concat([releaseOpen, releaseClose, releaseMessage]);
      });

      this.startP = startP;
      this.getApiIds();

      return startP;
    }
  }, {
    key: 'stop',
    value: function stop() {
      debugSetup('Stopping...');
      if (this.ws) this.ws.close();
      delete this.apiIdsP;
      delete this.startP;
      delete this.ws;
      this.releases.forEach(function (release) {
        return release();
      });
      this.releases = [];
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

      if (this.apiIdsP) return this.apiIdsP;
      this.apiIdsP = _bluebird2.default.map(Object.keys(this.apiIds), function (name) {
        debugSetup('Syncing API IDs', name);
        return _this3.getApiByNameAsync(name).then(function (result) {
          if (result != null) {
            _this3.apiIds[name] = result;
          } else {
            debugSetup('Dropped null API ID for', name, result);
          }
        });
      }).then(function (ret) {
        debugSetup('DONE - Synced API IDs', _this3.apiIds);
        return ret;
      });
      return this.apiIdsP;
    }
  }, {
    key: 'waitForSlot',
    value: function waitForSlot() {
      var _this4 = this;

      if (this.inFlight < 10) {
        debugEmitters('Less than 10 in-flight messages, moving on');
        return null;
      }

      debugEmitters('More than 10 in-flight messages, waiting');
      return _bluebird2.default.delay(100).then(function () {
        if (_this4.inFlight < 10) {
          debugEmitters('Less than 10 in-flight messages, moving on');
          return null;
        }
        return _this4.waitForSlot();
      });
    }
  }, {
    key: 'send',
    value: function send(api, data, callback) {
      var _this5 = this;

      debugSetup('Steem::send', api, data);
      var id = data.id || this.id++;
      var startP = this.start();

      // const currentP = this.currentP;

      var apiIdsP = api === 'login_api' && data.method === 'get_api_by_name' ? _bluebird2.default.fulfilled() : this.getApiIds();

      if (api === 'login_api' && data.method === 'get_api_by_name') {
        debugProtocol('Sending setup message');
      } else {
        debugProtocol('Going to wait for setup messages to resolve');
      }

      this.currentP = _bluebird2.default.join(startP, apiIdsP, this.waitForSlot()).then(function () {
        return new _bluebird2.default(function (resolve, reject) {
          if (!_this5.ws) {
            reject(new Error('The WS connection was closed while this request was pending'));
            return;
          }

          var payload = JSON.stringify({
            id: id,
            method: 'call',
            params: [_this5.apiIds[api], data.method, data.params]
          });

          var release = _this5.listenTo(_this5, 'message', function (message) {
            // We're still seeing old messages
            if (message.id < id) {
              debugProtocol('Old message was dropped', message);
              return;
            }

            _this5.inFlight -= 1;
            release();

            // We dropped a message
            if (message.id !== id) {
              debugProtocol('Response to RPC call was dropped', payload);
              reject(new Error('The response to this RPC call was dropped, please file this as a bug at https://github.com/adcpm/steem/issues'));
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

            debugProtocol('Resolved', api, data, '->', message);
            resolve(message.result);
          });

          debugWs('Sending message', payload);
          _this5.ws.send(payload);
        });
      }).then(function (result) {
        return callback(null, result);
      }, function (err) {
        callback(err);
        throw err;
      });

      this.inFlight += 1;

      return this.currentP;
    }
  }, {
    key: 'streamBlockNumber',
    value: function streamBlockNumber(callback) {
      var _this6 = this;

      var ts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

      var current = '';
      var running = true;

      var update = function update() {
        if (!running) return;

        _this6.getDynamicGlobalPropertiesAsync().then(function (result) {
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
      var _this7 = this;

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
          _this7.getBlock(current, callback);
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


_methods2.default.forEach(function (method) {
  var methodName = (0, _util.camelCase)(method.method);
  var methodParams = method.params || [];

  Steem.prototype[methodName + 'With'] = function Steem$$specializedSendWith(options, callback) {
    var params = methodParams.map(function (param) {
      return options[param];
    });
    return this.send(method.api, {
      method: method.method,
      params: params
    }, callback);
  };

  Steem.prototype[methodName] = function Steem$specializedSend() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var options = methodParams.reduce(function (memo, param, i) {
      memo[param] = args[i]; // eslint-disable-line no-param-reassign
      return memo;
    }, {});
    var callback = args[methodParams.length];

    return this[methodName + 'With'](options, callback);
  };
});

_bluebird2.default.promisifyAll(Steem.prototype);

// Export singleton instance
var steem = new Steem();
exports = module.exports = steem;
exports.Steem = Steem;
exports.Steem.DEFAULTS = DEFAULTS;