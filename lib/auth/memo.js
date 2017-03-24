'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.decode = decode;
exports.encode = encode;

var _bytebuffer = require('bytebuffer');

var _bytebuffer2 = _interopRequireDefault(_bytebuffer);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bs = require('bs58');

var _bs2 = _interopRequireDefault(_bs);

var _ecc = require('./ecc');

var _serializer = require('./serializer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var encMemo = _serializer.ops.encrypted_memo;

/**
    Some fields are only required if the memo is marked for decryption (starts with a hash).
    @arg {string|PrivateKey} private_key - WIF or PrivateKey object
    @arg {string} memo - plain text is returned, hash prefix base58 is decrypted
    @return {string} - utf8 decoded string (hash prefix)
*/
function decode(private_key, memo) {
    (0, _assert2.default)(memo, 'memo is required');
    _assert2.default.equal(typeof memo === 'undefined' ? 'undefined' : _typeof(memo), 'string', 'memo');
    if (!/^#/.test(memo)) return memo;
    memo = memo.substring(1);

    (0, _assert2.default)(private_key, 'private_key is required');
    checkEncryption();

    private_key = toPrivateObj(private_key);

    memo = _bs2.default.decode(memo);
    memo = encMemo.fromBuffer(new Buffer(memo, 'binary'));

    var _memo = memo,
        from = _memo.from,
        to = _memo.to,
        nonce = _memo.nonce,
        check = _memo.check,
        encrypted = _memo.encrypted;

    var pubkey = private_key.toPublicKey().toString();
    var otherpub = pubkey === from.toString() ? to.toString() : from.toString();
    memo = _ecc.Aes.decrypt(private_key, otherpub, nonce, encrypted, check);

    // remove varint length prefix
    var mbuf = _bytebuffer2.default.fromBinary(memo.toString('binary'), _bytebuffer2.default.DEFAULT_CAPACITY, _bytebuffer2.default.LITTLE_ENDIAN);
    try {
        mbuf.mark();
        return '#' + mbuf.readVString();
    } catch (e) {
        mbuf.reset();
        // Sender did not length-prefix the memo
        memo = new Buffer(mbuf.toString('binary'), 'binary').toString('utf-8');
        return '#' + memo;
    }
}

/**
    Some fields are only required if the memo is marked for encryption (starts with a hash).
    @arg {string|PrivateKey} private_key - WIF or PrivateKey object
    @arg {string|PublicKey} public_key - Recipient
    @arg {string} memo - plain text is returned, hash prefix text is encrypted
    @arg {string} [testNonce = undefined] - just for testing
    @return {string} - base64 decoded string (or plain text)
*/
function encode(private_key, public_key, memo, testNonce) {
    (0, _assert2.default)(memo, 'memo is required');
    _assert2.default.equal(typeof memo === 'undefined' ? 'undefined' : _typeof(memo), 'string', 'memo');
    if (!/^#/.test(memo)) return memo;
    memo = memo.substring(1);

    (0, _assert2.default)(private_key, 'private_key is required');
    (0, _assert2.default)(public_key, 'public_key is required');
    checkEncryption();

    private_key = toPrivateObj(private_key);
    public_key = toPublicObj(public_key);

    var mbuf = new _bytebuffer2.default(_bytebuffer2.default.DEFAULT_CAPACITY, _bytebuffer2.default.LITTLE_ENDIAN);
    mbuf.writeVString(memo);
    memo = new Buffer(mbuf.copy(0, mbuf.offset).toBinary(), 'binary');

    var _Aes$encrypt = _ecc.Aes.encrypt(private_key, public_key, memo, testNonce),
        nonce = _Aes$encrypt.nonce,
        message = _Aes$encrypt.message,
        checksum = _Aes$encrypt.checksum;

    memo = encMemo.fromObject({
        from: private_key.toPublicKey(),
        to: public_key,
        nonce: nonce,
        check: checksum,
        encrypted: message
    });
    // serialize
    memo = encMemo.toBuffer(memo);
    return '#' + _bs2.default.encode(new Buffer(memo, 'binary'));
}

var encodeTest = undefined;

/**
  Memo encryption has failed in the browser before.  An Error will be thrown
  if a memo can't be encrypted and decrypted.
*/
function checkEncryption() {
    if (encodeTest === undefined) {
        var plaintext = void 0;
        encodeTest = true; // prevent infinate looping
        try {
            var wif = '5JdeC9P7Pbd1uGdFVEsJ41EkEnADbbHGq6p1BwFxm6txNBsQnsw';
            var pubkey = 'STM8m5UgaFAAYQRuaNejYdS8FVLVp9Ss3K1qAVk5de6F8s3HnVbvA';
            var cyphertext = encode(wif, pubkey, '#memo爱');
            plaintext = decode(wif, cyphertext);
        } catch (e) {
            console.error(e);
        } finally {
            encodeTest = plaintext === '#memo爱';
        }
    }
    if (encodeTest === false) throw new Error('This environment does not support encryption.');
}

var toPrivateObj = function toPrivateObj(o) {
    return o ? o.d ? o : _ecc.PrivateKey.fromWif(o) : o /*null or undefined*/;
};
var toPublicObj = function toPublicObj(o) {
    return o ? o.Q ? o : _ecc.PublicKey.fromString(o) : o /*null or undefined*/;
};