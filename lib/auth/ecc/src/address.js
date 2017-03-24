'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var assert = require('assert');
var config = require('../../../config');
var hash = require('./hash');
var base58 = require('bs58');

/** Addresses are shortened non-reversable hashes of a public key.  The full PublicKey is preferred.
    @deprecated
*/

var Address = function () {
    function Address(addy) {
        _classCallCheck(this, Address);

        this.addy = addy;
    }

    _createClass(Address, [{
        key: 'toBuffer',
        value: function toBuffer() {
            return this.addy;
        }
    }, {
        key: 'toString',
        value: function toString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : config.get('address_prefix');

            var checksum = hash.ripemd160(this.addy);
            var addy = Buffer.concat([this.addy, checksum.slice(0, 4)]);
            return address_prefix + base58.encode(addy);
        }
    }], [{
        key: 'fromBuffer',
        value: function fromBuffer(buffer) {
            var _hash = hash.sha512(buffer);
            var addy = hash.ripemd160(_hash);
            return new Address(addy);
        }
    }, {
        key: 'fromString',
        value: function fromString(string) {
            var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.get('address_prefix');

            var prefix = string.slice(0, address_prefix.length);
            assert.equal(address_prefix, prefix, 'Expecting key to begin with ' + address_prefix + ', instead got ' + prefix);
            var addy = string.slice(address_prefix.length);
            addy = new Buffer(base58.decode(addy), 'binary');
            var checksum = addy.slice(-4);
            addy = addy.slice(0, -4);
            var new_checksum = hash.ripemd160(addy);
            new_checksum = new_checksum.slice(0, 4);
            assert.deepEqual(checksum, new_checksum, 'Checksum did not match');
            return new Address(addy);
        }

        /** @return Address - Compressed PTS format (by default) */

    }, {
        key: 'fromPublic',
        value: function fromPublic(public_key) {
            var compressed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            var version = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 56;

            var sha2 = hash.sha256(public_key.toBuffer(compressed));
            var rep = hash.ripemd160(sha2);
            var versionBuffer = new Buffer(1);
            versionBuffer.writeUInt8(0xFF & version, 0);
            var addr = Buffer.concat([versionBuffer, rep]);
            var check = hash.sha256(addr);
            check = hash.sha256(check);
            var buffer = Buffer.concat([addr, check.slice(0, 4)]);
            return new Address(hash.ripemd160(buffer));
        }
    }]);

    return Address;
}();

module.exports = Address;