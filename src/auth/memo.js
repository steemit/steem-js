const ByteBuffer = require('bytebuffer');
const assert = require('assert');
const base58 = require('bs58');
const ecc = require('./ecc');
const Aes = ecc.Aes;
const PrivateKey = ecc.PrivateKey;
const PublicKey = ecc.PublicKey;
const serializer = require('./serializer');
const ops = serializer.ops;

const encMemo = ops.encrypted_memo;

/**
    Some fields are only required if the memo is marked for decryption (starts with a hash).
    @arg {string|PrivateKey} private_key - WIF or PrivateKey object
    @arg {string} memo - plain text is returned, hash prefix base58 is decrypted
    @return {string} - utf8 decoded string (hash prefix)
*/
function decode(private_key, memo) {
    assert(memo, 'memo is required');
    assert.equal(typeof memo, 'string', 'memo');
    if(!/^#/.test(memo)) return memo;
    memo = memo.substring(1);

    assert(private_key, 'private_key is required');
    checkEncryption();

    private_key = toPrivateObj(private_key);

    memo = base58.decode(memo);
    memo = encMemo.fromBuffer(new Buffer.from(memo, 'binary'));

    const {from, to, nonce, check, encrypted} = memo;
    const pubkey = private_key.toPublicKey().toString();
    const otherpub = pubkey === from.toString() ? to.toString() : from.toString();
    memo = Aes.decrypt(private_key, otherpub, nonce, encrypted, check);

    // remove varint length prefix
    const mbuf = ByteBuffer.fromBinary(memo.toString('binary'), ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    try {
        mbuf.mark();
        return '#' + mbuf.readVString();
    } catch(e) {
        mbuf.reset();
        // Sender did not length-prefix the memo
        memo = new Buffer.from(mbuf.toString('binary'), 'binary').toString('utf-8');
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
    assert(memo, 'memo is required');
    assert.equal(typeof memo, 'string', 'memo');
    if(!/^#/.test(memo)) return memo;
    memo = memo.substring(1);

    assert(private_key, 'private_key is required');
    assert(public_key, 'public_key is required');
    checkEncryption();

    private_key = toPrivateObj(private_key);
    public_key = toPublicObj(public_key);

    const mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    mbuf.writeVString(memo);
    memo = new Buffer.from(mbuf.copy(0, mbuf.offset).toBinary(), 'binary');

    const {nonce, message, checksum} = Aes.encrypt(private_key, public_key, memo, testNonce);
    memo = encMemo.fromObject({
        from: private_key.toPublicKey(),
        to: public_key,
        nonce,
        check: checksum,
        encrypted: message
    });
    // serialize
    memo = encMemo.toBuffer(memo);
    return '#' + base58.encode(new Buffer.from(memo, 'binary'));
}

let encodeTest = undefined;

/**
  Memo encryption has failed in the browser before.  An Error will be thrown
  if a memo can't be encrypted and decrypted.
*/
function checkEncryption() {
  if(encodeTest === undefined) {
    let plaintext;
    encodeTest = true; // prevent infinate looping
    try {
      const wif = '5JdeC9P7Pbd1uGdFVEsJ41EkEnADbbHGq6p1BwFxm6txNBsQnsw';
      const pubkey = 'STM8m5UgaFAAYQRuaNejYdS8FVLVp9Ss3K1qAVk5de6F8s3HnVbvA';
      const cyphertext = encode(wif, pubkey, '#memo爱');
      plaintext = decode(wif, cyphertext);
    } catch(e) {
      console.error(e);
    } finally {
      encodeTest = plaintext === '#memo爱';
    }
  }
  if(encodeTest === false)
    throw new Error('This environment does not support encryption.');
}

const toPrivateObj = o => (o ? o.d ? o : PrivateKey.fromWif(o) : o/*null or undefined*/);
const toPublicObj = o => (o ? o.Q ? o : PublicKey.fromString(o) : o/*null or undefined*/);

module.exports = {
  decode,
  encode
};
