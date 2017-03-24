'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ecc = require('../../ecc');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FastParser = function () {
    function FastParser() {
        _classCallCheck(this, FastParser);
    }

    _createClass(FastParser, null, [{
        key: 'fixed_data',
        value: function fixed_data(b, len, buffer) {
            if (!b) {
                return;
            }
            if (buffer) {
                var data = buffer.slice(0, len).toString('binary');
                b.append(data, 'binary');
                while (len-- > data.length) {
                    b.writeUint8(0);
                }
            } else {
                var b_copy = b.copy(b.offset, b.offset + len);
                b.skip(len);
                return new Buffer(b_copy.toBinary(), 'binary');
            }
        }
    }, {
        key: 'public_key',
        value: function public_key(b, _public_key) {
            if (!b) {
                return;
            }
            if (_public_key) {
                var buffer = _public_key.toBuffer();
                b.append(buffer.toString('binary'), 'binary');
                return;
            } else {
                buffer = FastParser.fixed_data(b, 33);
                return _ecc.PublicKey.fromBuffer(buffer);
            }
        }
    }, {
        key: 'ripemd160',
        value: function ripemd160(b, _ripemd) {
            if (!b) {
                return;
            }
            if (_ripemd) {
                FastParser.fixed_data(b, 20, _ripemd);
                return;
            } else {
                return FastParser.fixed_data(b, 20);
            }
        }
    }, {
        key: 'time_point_sec',
        value: function time_point_sec(b, epoch) {
            if (epoch) {
                epoch = Math.ceil(epoch / 1000);
                b.writeInt32(epoch);
                return;
            } else {
                epoch = b.readInt32(); // fc::time_point_sec
                return new Date(epoch * 1000);
            }
        }
    }]);

    return FastParser;
}();

module.exports = FastParser;