let bigi = require("bigi"),
  bs58 = require("bs58"),
  ecurve = require("ecurve"),
  Point = ecurve.Point,
  secp256k1 = ecurve.getCurveByName("secp256k1"),
  config = require("../config"),
  operations = require("./serializer/src/operations"),
  Signature = require("./ecc/src/signature"),
  KeyPrivate = require("./ecc/src/key_private"),
  PublicKey = require("./ecc/src/key_public"),
  hash = require("./ecc/src/hash");

const Auth = {};
const transaction = operations.transaction;
const signed_transaction = operations.signed_transaction;

Auth.verify = function(name, password, auths) {
  let hasKey = false;
  const roles = [];
  for (const role in auths) {
    roles.push(role);
  }
  const pubKeys = this.generateKeys(name, password, roles);
  roles.forEach(function(role) {
    if (auths[role][0][0] === pubKeys[role]) {
      hasKey = true;
    }
  });
  return hasKey;
};

Auth.generateKeys = function(name, password, roles) {
  const pubKeys = {};
  roles.forEach(function(role) {
    const seed = name + role + password;
    const brainKey = seed
      .trim()
      .split(/[\t\n\v\f\r ]+/)
      .join(" ");
    const hashSha256 = hash.sha256(brainKey);
    const bigInt = bigi.fromBuffer(hashSha256);
    const toPubKey = secp256k1.G.multiply(bigInt);
    const point = new Point(toPubKey.curve, toPubKey.x, toPubKey.y, toPubKey.z);
    const pubBuf = point.getEncoded(toPubKey.compressed);
    const checksum = hash.ripemd160(pubBuf);
    const addy = Buffer.concat([pubBuf, checksum.slice(0, 4)]);
    pubKeys[role] = config.get("address_prefix") + bs58.encode(addy);
  });
  return pubKeys;
};

/**
	@arg {string} name - blockchain account name
	@arg {string} password - very strong password typically no shorter than a private key
	@arg {array} roles - defaults to standard Steem blockchain-level roles
*/
Auth.getPrivateKeys = function(
  name,
  password,
  roles = ["owner", "active", "posting", "memo"]
) {
  const privKeys = {};
  roles.forEach(
    function(role) {
      privKeys[role] = this.toWif(name, password, role);
      privKeys[role + "Pubkey"] = this.wifToPublic(privKeys[role]);
    }.bind(this)
  );
  return privKeys;
};

Auth.isWif = function(privWif) {
  let isWif = false;
  try {
    const bufWif = new Buffer(bs58.decode(privWif));
    const privKey = bufWif.slice(0, -4);
    const checksum = bufWif.slice(-4);
    let newChecksum = hash.sha256(privKey);
    newChecksum = hash.sha256(newChecksum);
    newChecksum = newChecksum.slice(0, 4);
    if (checksum.toString() == newChecksum.toString()) {
      isWif = true;
    }
  } catch (e) {}
  return isWif;
};

Auth.toWif = function(name, password, role) {
  const seed = name + role + password;
  const brainKey = seed
    .trim()
    .split(/[\t\n\v\f\r ]+/)
    .join(" ");
  const hashSha256 = hash.sha256(brainKey);
  const privKey = Buffer.concat([new Buffer([0x80]), hashSha256]);
  let checksum = hash.sha256(privKey);
  checksum = hash.sha256(checksum);
  checksum = checksum.slice(0, 4);
  const privWif = Buffer.concat([privKey, checksum]);
  return bs58.encode(privWif);
};

Auth.wifIsValid = function(privWif, pubWif) {
  return this.wifToPublic(privWif) == pubWif;
};

Auth.wifToPublic = function(privWif) {
  let pubWif = KeyPrivate.fromWif(privWif);
  pubWif = pubWif.toPublic().toString();
  return pubWif;
};

Auth.isPubkey = function(pubkey, address_prefix) {
  return PublicKey.fromString(pubkey, address_prefix) != null;
};

Auth.signTransaction = function(trx, keys) {
  let signatures = [];
  if (trx.signatures) {
    signatures = [].concat(trx.signatures);
  }

  const cid = new Buffer(config.get("chain_id"), "hex");
  const buf = transaction.toBuffer(trx);

  for (const key in keys) {
    const sig = Signature.signBuffer(Buffer.concat([cid, buf]), keys[key]);
    signatures.push(sig.toBuffer());
  }

  return signed_transaction.toObject(
    Object.assign(trx, { signatures: signatures })
  );
};

module.exports = Auth;
