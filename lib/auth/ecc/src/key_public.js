'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BigInteger = require('bigi');
var ecurve = require('ecurve');
var secp256k1 = ecurve.getCurveByName('secp256k1');
BigInteger = require('bigi');
var base58 = require('bs58');
var hash = require('./hash');
var config = require('../../../config');
var assert = require('assert');

var G = secp256k1.G;
var n = secp256k1.n;

var PublicKey = function () {

    /** @param {ecurve.Point} public key */
    function PublicKey(Q) {
        _classCallCheck(this, PublicKey);

        this.Q = Q;
    }

    _createClass(PublicKey, [{
        key: 'toBuffer',
        value: function toBuffer() {
            var compressed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.Q.compressed;

            return this.Q.getEncoded(compressed);
        }
    }, {
        key: 'toUncompressed',
        value: function toUncompressed() {
            var buf = this.Q.getEncoded(false);
            var point = ecurve.Point.decodeFrom(secp256k1, buf);
            return PublicKey.fromPoint(point);
        }

        /** bts::blockchain::address (unique but not a full public key) */

    }, {
        key: 'toBlockchainAddress',
        value: function toBlockchainAddress() {
            var pub_buf = this.toBuffer();
            var pub_sha = hash.sha512(pub_buf);
            return hash.ripemd160(pub_sha);
        }
    }, {
        key: 'toString',
        value: function toString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : config.get('address_prefix');

            return this.toPublicKeyString(address_prefix);
        }

        /**
            Full public key
            {return} string
        */

    }, {
        key: 'toPublicKeyString',
        value: function toPublicKeyString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : config.get('address_prefix');

            if (this.pubdata) return address_prefix + this.pubdata;
            var pub_buf = this.toBuffer();
            var checksum = hash.ripemd160(pub_buf);
            var addy = Buffer.concat([pub_buf, checksum.slice(0, 4)]);
            this.pubdata = base58.encode(addy);
            return address_prefix + this.pubdata;
        }

        /**
            @arg {string} public_key - like STMXyz...
            @arg {string} address_prefix - like STM
            @return PublicKey or `null` (if the public_key string is invalid)
            @deprecated fromPublicKeyString (use fromString instead)
        */

    }, {
        key: 'toAddressString',
        value: function toAddressString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : config.get('address_prefix');

            var pub_buf = this.toBuffer();
            var pub_sha = hash.sha512(pub_buf);
            var addy = hash.ripemd160(pub_sha);
            var checksum = hash.ripemd160(addy);
            addy = Buffer.concat([addy, checksum.slice(0, 4)]);
            return address_prefix + base58.encode(addy);
        }
    }, {
        key: 'toPtsAddy',
        value: function toPtsAddy() {
            var pub_buf = this.toBuffer();
            var pub_sha = hash.sha256(pub_buf);
            var addy = hash.ripemd160(pub_sha);
            addy = Buffer.concat([new Buffer([0x38]), addy]); //version 56(decimal)

            var checksum = hash.sha256(addy);
            checksum = hash.sha256(checksum);

            addy = Buffer.concat([addy, checksum.slice(0, 4)]);
            return base58.encode(addy);
        }
    }, {
        key: 'child',
        value: function child(offset) {

            assert(Buffer.isBuffer(offset), "Buffer required: offset");
            assert.equal(offset.length, 32, "offset length");

            offset = Buffer.concat([this.toBuffer(), offset]);
            offset = hash.sha256(offset);

            var c = BigInteger.fromBuffer(offset);

            if (c.compareTo(n) >= 0) throw new Error("Child offset went out of bounds, try again");

            var cG = G.multiply(c);
            var Qprime = this.Q.add(cG);

            if (secp256k1.isInfinity(Qprime)) throw new Error("Child offset derived to an invalid key, try again");

            return PublicKey.fromPoint(Qprime);
        }

        // toByteBuffer() {
        //     var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        //     this.appendByteBuffer(b);
        //     return b.copy(0, b.offset);
        // }

    }, {
        key: 'toHex',
        value: function toHex() {
            return this.toBuffer().toString('hex');
        }
    }], [{
        key: 'fromBinary',
        value: function fromBinary(bin) {
            return PublicKey.fromBuffer(new Buffer(bin, 'binary'));
        }
    }, {
        key: 'fromBuffer',
        value: function fromBuffer(buffer) {
            return new PublicKey(ecurve.Point.decodeFrom(secp256k1, buffer));
        }
    }, {
        key: 'fromPoint',
        value: function fromPoint(point) {
            return new PublicKey(point);
        }
    }, {
        key: 'fromString',
        value: function fromString(public_key) {
            var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.get('address_prefix');

            try {
                return PublicKey.fromStringOrThrow(public_key, address_prefix);
            } catch (e) {
                return null;
            }
        }

        /**
            @arg {string} public_key - like STMXyz...
            @arg {string} address_prefix - like STM
            @throws {Error} if public key is invalid
            @return PublicKey
        */

    }, {
        key: 'fromStringOrThrow',
        value: function fromStringOrThrow(public_key) {
            var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.get('address_prefix');

            var prefix = public_key.slice(0, address_prefix.length);
            assert.equal(address_prefix, prefix, 'Expecting key to begin with ' + address_prefix + ', instead got ' + prefix);
            public_key = public_key.slice(address_prefix.length);

            public_key = new Buffer(base58.decode(public_key), 'binary');
            var checksum = public_key.slice(-4);
            public_key = public_key.slice(0, -4);
            var new_checksum = hash.ripemd160(public_key);
            new_checksum = new_checksum.slice(0, 4);
            assert.deepEqual(checksum, new_checksum, 'Checksum did not match');
            return PublicKey.fromBuffer(public_key);
        }
    }, {
        key: 'fromHex',
        value: function fromHex(hex) {
            return PublicKey.fromBuffer(new Buffer(hex, 'hex'));
        }
    }, {
        key: 'fromStringHex',
        value: function fromStringHex(hex) {
            return PublicKey.fromString(new Buffer(hex, 'hex'));
        }

        /* </HEX> */

    }]);

    return PublicKey;
}();

module.exports = PublicKey;