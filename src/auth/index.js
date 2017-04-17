var bigi = require('bigi'),
	bs58 = require('bs58'),
	ecurve = require('ecurve'),
	Point = ecurve.Point,
	secp256k1 = ecurve.getCurveByName('secp256k1'),
	config = require('../config'),
	operations = require('./serializer/src/operations'),
	Signature = require('./ecc/src/signature'),
	KeyPrivate = require('./ecc/src/key_private'),
	PublicKey = require('./ecc/src/key_public'),
  hash = require('./ecc/src/hash');

var Auth = {};
var transaction = operations.transaction;
var signed_transaction = operations.signed_transaction;

Auth.verify = function (name, password, auths) {
	var hasKey = false;
	var roles = [];
	for (var role in auths) {
		roles.push(role);
	}
	var pubKeys = this.generateKeys(name, password, roles);
	roles.forEach(function (role) {
		if (auths[role][0][0] === pubKeys[role]) {
			hasKey = true;
		}
	});
	return hasKey;
};

Auth.generateKeys = function (name, password, roles) {
	var pubKeys = {};
	roles.forEach(function (role) {
		var seed = name + role + password;
		var brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
		var hashSha256 = hash.sha256(brainKey);
		var bigInt = bigi.fromBuffer(hashSha256);
		var toPubKey = secp256k1.G.multiply(bigInt);
		var point = new Point(toPubKey.curve, toPubKey.x, toPubKey.y, toPubKey.z);
		var pubBuf = point.getEncoded(toPubKey.compressed);
		var checksum = hash.ripemd160(pubBuf);
		var addy = Buffer.concat([pubBuf, checksum.slice(0, 4)]);
		pubKeys[role] = config.get('address_prefix') + bs58.encode(addy);
	});
	return pubKeys;
};

/**
	@arg {string} name - blockchain account name
	@arg {string} password - very strong password typically no shorter than a private key
	@arg {array} roles - defaults to standard Steem blockchain-level roles
*/
Auth.getPrivateKeys = function (name, password, roles = ['owner', 'active', 'posting', 'memo']) {
	var privKeys = {};
	roles.forEach(function (role) {
		privKeys[role] = this.toWif(name, password, role);
		privKeys[role + 'Pubkey'] = this.wifToPublic(privKeys[role]);
	}.bind(this));
	return privKeys;
};

Auth.isWif = function (privWif) {
	var isWif = false;
	try {
		var bufWif = new Buffer(bs58.decode(privWif));
		var privKey = bufWif.slice(0, -4);
		var checksum = bufWif.slice(-4);
		var newChecksum = hash.sha256(privKey);
		newChecksum = hash.sha256(newChecksum);
		newChecksum = newChecksum.slice(0, 4);
		if (checksum.toString() == newChecksum.toString()) {
			isWif = true;
		}
	} catch (e) { }
	return isWif;
};

Auth.toWif = function (name, password, role) {
	var seed = name + role + password;
	var brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
	var hashSha256 = hash.sha256(brainKey);
	var privKey = Buffer.concat([new Buffer([0x80]), hashSha256]);
	var checksum = hash.sha256(privKey);
	checksum = hash.sha256(checksum);
	checksum = checksum.slice(0, 4);
	var privWif = Buffer.concat([privKey, checksum]);
	return bs58.encode(privWif);
};

Auth.wifIsValid = function (privWif, pubWif) {
	return (this.wifToPublic(privWif) == pubWif);
};

Auth.wifToPublic = function (privWif) {
	var pubWif = KeyPrivate.fromWif(privWif);
	pubWif = pubWif.toPublic().toString();
	return pubWif;
};

Auth.isPubkey = function(pubkey, address_prefix) {
	return PublicKey.fromString(pubkey, address_prefix) != null
}

Auth.signTransaction = function (trx, keys) {
	var signatures = [];
	if (trx.signatures) {
		signatures = [].concat(trx.signatures);
	}

	var cid = new Buffer(config.get('chain_id'), 'hex');
	var buf = transaction.toBuffer(trx);

	for (var key in keys) {
		var sig = Signature.signBuffer(Buffer.concat([cid, buf]), keys[key]);
		signatures.push(sig.toBuffer())
	}

	return signed_transaction.toObject(Object.assign(trx, { signatures: signatures }))
};

module.exports = Auth;
