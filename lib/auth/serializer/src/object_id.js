'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Long = require('bytebuffer').Long;

var v = require('./validation');
var DB_MAX_INSTANCE_ID = Long.fromNumber(Math.pow(2, 48) - 1);

var ObjectId = function () {
    function ObjectId(space, type, instance) {
        _classCallCheck(this, ObjectId);

        this.space = space;
        this.type = type;
        this.instance = instance;
        var instance_string = this.instance.toString();
        var object_id = this.space + '.' + this.type + '.' + instance_string;
        if (!v.is_digits(instance_string)) {
            throw new ('Invalid object id ' + object_id)();
        }
    }

    _createClass(ObjectId, [{
        key: 'toLong',
        value: function toLong() {
            return Long.fromNumber(this.space).shiftLeft(56).or(Long.fromNumber(this.type).shiftLeft(48).or(this.instance));
        }
    }, {
        key: 'appendByteBuffer',
        value: function appendByteBuffer(b) {
            return b.writeUint64(this.toLong());
        }
    }, {
        key: 'toString',
        value: function toString() {
            return this.space + '.' + this.type + '.' + this.instance.toString();
        }
    }], [{
        key: 'fromString',
        value: function fromString(value) {
            if (value.space !== undefined && value.type !== undefined && value.instance !== undefined) {
                return value;
            }
            var params = v.require_match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/, v.required(value, "object_id"), "object_id");
            return new ObjectId(parseInt(params[1]), parseInt(params[2]), Long.fromString(params[3]));
        }
    }, {
        key: 'fromLong',
        value: function fromLong(long) {
            var space = long.shiftRight(56).toInt();
            var type = long.shiftRight(48).toInt() & 0x00ff;
            var instance = long.and(DB_MAX_INSTANCE_ID);
            return new ObjectId(space, type, instance);
        }
    }, {
        key: 'fromByteBuffer',
        value: function fromByteBuffer(b) {
            return ObjectId.fromLong(b.readUint64());
        }
    }]);

    return ObjectId;
}();

module.exports = ObjectId;