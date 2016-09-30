var methods = require('./methods.json');

var snakeCaseRe = /_([a-z])/g
function camelCase(str) {
  return str.replace(snakeCaseRe, function (_m, l) {
    return l.toUpperCase();
  });
}

exports = module.exports = function generateMethods(Steem) {
  methods.reduce(function (memo, method) {
    var methodName = camelCase(method.method);

    memo[methodName + 'With'] =
      function Steem$specializedSendWith(options, callback) {
        var params = method.params.map(function (param) {
          return options[param];
        });
        var iterator = Steem.iterate();

        return Steem.send(method.api, {
          id: iterator,
          method: method.method,
          params: params,
        }, function (err, data) {
          if (err) return callback(err);
          if (data && data.id === iterator) return callback(err, data.result);
          // TODO - Do something here
        });
      };

    memo[methodName] =
      function Steem$specializedSend() {
        var args = arguments;
        var options = method.params.reduce(function (memo, param, i) {
          memo[param] = args[i];
          return memo;
        }, {});
        var callback = args[method.params.length];
        memo[methodName + 'With'](options, callback);
      };

    return memo;
  }, Steem);
};

/*

console.log(exports);

exports.getBlockWith({
  blockNum: 1,
}, function (err, operation) {
  console.log(err, operation);
});

exports.getBlock(1, function (err, operation) {
  console.log(err, operation);
});

 */
