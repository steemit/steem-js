var ecdsa = require('./signature/ecdsa');
var hash = require('./signature/hash');
var curve = require('ecurve').getCurveByName('secp256k1');
var assert = require('assert');
var BigInteger = require('bigi');
var PublicKey = require('./types/key-public');
var PrivateKey = require('./types/key-private');

var Signature = function () {
    function Signature(r1, s1, i1) {
        this.r = r1;
        this.s = s1;
        this.i = i1;
        assert.equal(this.r != null, true, 'Missing parameter');
        assert.equal(this.s != null, true, 'Missing parameter');
        assert.equal(this.i != null, true, 'Missing parameter');
    }

    Signature.fromBuffer = function fromBuffer(buf) {
        var i, r, s;
        assert.equal(buf.length, 65, 'Invalid signature length');
        i = buf.readUInt8(0);
        assert.equal(i - 27, i - 27 & 7, 'Invalid signature parameter');
        r = BigInteger.fromBuffer(buf.slice(1, 33));
        s = BigInteger.fromBuffer(buf.slice(33));
        return new Signature(r, s, i);
    };

    Signature.prototype.toBuffer = function toBuffer() {
        var buf;
        buf = new Buffer(65);
        buf.writeUInt8(this.i, 0);
        this.r.toBuffer(32).copy(buf, 1);
        this.s.toBuffer(32).copy(buf, 33);
        return buf;
    };

    Signature.prototype.recoverPublicKeyFromBuffer = function recoverPublicKeyFromBuffer(buffer) {
        return this.recoverPublicKey(hash.sha256(buffer));
    };

    /**
        @return {PublicKey}
    */
    Signature.prototype.recoverPublicKey = function recoverPublicKey(sha256_buffer) {
        var Q, e, i;
        e = BigInteger.fromBuffer(sha256_buffer);
        i = this.i;
        i -= 27;
        i = i & 3;
        Q = ecdsa.recoverPubKey(curve, e, this, i);
        return PublicKey.fromPoint(Q);
    };

    /**
        @param {Buffer} buf
        @param {PrivateKey} private_key
        @return {Signature}
    */
    Signature.signBuffer = function signBuffer(buf, private_key) {
        var _hash = hash.sha256(buf);
        return Signature.signBufferSha256(_hash, private_key);
    };

    /** Sign a buffer of exactally 32 bytes in size (sha256(text))
        @param {Buffer} buf - 32 bytes binary
        @param {PrivateKey} private_key
        @return {Signature}
    */


    Signature.signBufferSha256 = function signBufferSha256(buf_sha256, private_key) {
        if (buf_sha256.length !== 32 || !Buffer.isBuffer(buf_sha256)) throw new Error("buf_sha256: 32 byte buffer requred");
        private_key = toPrivateObj(private_key);
        assert(private_key, 'private_key required');

        var der, e, ecsignature, i, lenR, lenS, nonce;
        i = null;
        nonce = 0;
        e = BigInteger.fromBuffer(buf_sha256);
        while (true) {
            ecsignature = ecdsa.sign(curve, buf_sha256, private_key.d, nonce++);
            der = ecsignature.toDER();
            lenR = der[3];
            lenS = der[5 + lenR];
            if (lenR === 32 && lenS === 32) {
                i = ecdsa.calcPubKeyRecoveryParam(curve, e, ecsignature, private_key.toPublicKey().Q);
                i += 4; // compressed
                i += 27; // compact  //  24 or 27 :( forcing odd-y 2nd key candidate)
                break;
            }
            if (nonce % 10 === 0) {
                console.log("WARN: " + nonce + " attempts to find canonical signature");
            }
        }
        return new Signature(ecsignature.r, ecsignature.s, i);
    };

    Signature.sign = function sign(string, private_key) {
        return Signature.signBuffer(new Buffer(string), private_key);
    };

    /**
        @param {Buffer} un-hashed
        @param {./PublicKey}
        @return {boolean}
    */
    Signature.prototype.verifyBuffer = function verifyBuffer(buf, public_key) {
        var _hash = hash.sha256(buf);
        return this.verifyHash(_hash, public_key);
    };

    Signature.prototype.verifyHash = function verifyHash(hash, public_key) {
        assert.equal(hash.length, 32, "A SHA 256 should be 32 bytes long, instead got " + hash.length);
        return ecdsa.verify(curve, hash, {
            r: this.r,
            s: this.s
        }, public_key.Q);
    };

    /* <HEX> */
    Signature.prototype.toByteBuffer = function toByteBuffer() {
        var b;
        b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        this.appendByteBuffer(b);
        return b.copy(0, b.offset);
    };

    Signature.fromHex = function fromHex(hex) {
        return Signature.fromBuffer(new Buffer(hex, "hex"));
    };

    Signature.prototype.toHex = function toHex() {
        return this.toBuffer().toString("hex");
    };

    Signature.signHex = function signHex(hex, private_key) {
        var buf;
        buf = new Buffer(hex, 'hex');
        return Signature.signBuffer(buf, private_key);
    };

    Signature.prototype.verifyHex = function verifyHex(hex, public_key) {
        var buf;
        buf = new Buffer(hex, 'hex');
        return this.verifyBuffer(buf, public_key);
    };

    return Signature;
}();

var toPrivateObj = function toPrivateObj(o) {
    return o ? o.d ? o : PrivateKey.fromWif(o) : o /*null or undefined*/;
};
module.exports = Signature;