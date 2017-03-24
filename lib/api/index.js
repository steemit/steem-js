'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _methods = require('./methods');

var _methods2 = _interopRequireDefault(_methods);

var _ecc = require('../auth/ecc');

var _serializer = require('../auth/serializer');

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debugSetup = (0, _debug2.default)('steem:setup');

var Steem = function (_EventEmitter) {
  _inherits(Steem, _EventEmitter);

  function Steem() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Steem);

    var _this = _possibleConstructorReturn(this, (Steem.__proto__ || Object.getPrototypeOf(Steem)).call(this, options));

    _this.id = 0;
    _this.uri = _config2.default.get('uri');
    return _this;
  }

  _createClass(Steem, [{
    key: 'send',
    value: function send(api, data, callback) {
      debugSetup('Steem::send', api, data);
      var id = data.id || this.id++;
      var payload = {
        id: id,
        method: 'call',
        params: [api, data.method, data.params]
      };
      (0, _isomorphicFetch2.default)(this.uri, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json();
      }).then(function (json) {
        var err = json.error || '';
        var result = json.result || '';
        callback(err, result);
      }).catch(function (err) {
        callback(err, '');
      });
    }
  }, {
    key: 'setUri',
    value: function setUri(uri) {
      this.uri = uri;
    }
  }, {
    key: 'streamBlockNumber',
    value: function streamBlockNumber(callback) {
      var _this2 = this;

      var ts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

      var current = '';
      var running = true;

      var update = function update() {
        if (!running) return;

        _this2.getDynamicGlobalPropertiesAsync().then(function (result) {
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
      var _this3 = this;

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
          _this3.getBlock(current, callback);
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

        if (result && result.transactions) {
          result.transactions.forEach(function (transaction) {
            callback(null, transaction);
          });
        }
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
  var methodName = method.method_name || (0, _util.camelCase)(method.method);
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

/*
 Wrap transaction broadcast: serializes the object and adds error reporting
 */
Steem.prototype.broadcastTransactionSynchronousWith = function Steem$$specializedSendWith(options, callback) {
  var trx = options.trx;
  return this.send('network_broadcast_api', {
    method: 'broadcast_transaction_synchronous',
    params: [trx]
  }, function (err, result) {
    if (err) {
      var signed_transaction = _serializer.ops.signed_transaction;
      // console.log('-- broadcastTransactionSynchronous -->', JSON.stringify(signed_transaction.toObject(trx), null, 2));
      // toObject converts objects into serializable types

      var trObject = signed_transaction.toObject(trx);
      var buf = signed_transaction.toBuffer(trx);
      err.digest = _ecc.hash.sha256(buf).toString('hex');
      err.transaction_id = buf.toString('hex');
      err.transaction = JSON.stringify(trObject);
      callback(err, '');
    } else {
      callback('', result);
    }
  });
};

delete Steem.prototype.broadcastTransaction; // not supported
delete Steem.prototype.broadcastTransactionWithCallback; // not supported

_bluebird2.default.promisifyAll(Steem.prototype);

// Export singleton instance
var steem = new Steem();
exports = module.exports = steem;
exports.Steem = Steem;