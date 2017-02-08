var bigi = require('bigi'),
	crypto = require('crypto'),
	bs58 = require('bs58'),
	ecurve = require('ecurve'),
	Point = ecurve.Point,
	secp256k1 = ecurve.getCurveByName('secp256k1'),

	operations = require('./protocol/operations'),
	Signature = require('./protocol/signature'),
	KeyPrivate = require('./protocol/types/key-private');

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
		var hashSha256 = crypto.createHash('sha256').update(brainKey).digest();
		var bigInt = bigi.fromBuffer(hashSha256);
		var toPubKey = secp256k1.G.multiply(bigInt);
		var point = new Point(toPubKey.curve, toPubKey.x, toPubKey.y, toPubKey.z);
		var pubBuf = point.getEncoded(toPubKey.compressed);
		var checksum = crypto.createHash('rmd160').update(pubBuf).digest();
		var addy = Buffer.concat([pubBuf, checksum.slice(0, 4)]);
		pubKeys[role] = 'STM' + bs58.encode(addy);
	});
	return pubKeys;
};

Auth.getPrivateKeys = function (name, password, roles) {
	var privKeys = {};
	roles.forEach(function (role) {
		privKeys[role] = this.toWif(name, password, role);
	}.bind(this));
	return privKeys;
};

Auth.isWif = function (privWif) {
	var isWif = false;
	try {
		var bufWif = new Buffer(bs58.decode(privWif));
		var privKey = bufWif.slice(0, -4);
		var checksum = bufWif.slice(-4);
		var newChecksum = crypto.createHash('sha256').update(privKey).digest();
		newChecksum = crypto.createHash('sha256').update(newChecksum).digest();
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
	var hashSha256 = crypto.createHash('sha256').update(brainKey).digest();
	var privKey = Buffer.concat([new Buffer([0x80]), hashSha256]);
	var checksum = crypto.createHash('sha256').update(privKey).digest();
	checksum = crypto.createHash('sha256').update(checksum).digest();
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

Auth.signTransaction = function (trx, keys) {
	var signatures = [];
	if (trx.signatures) {
		signatures = [].concat(trx.signatures);
	}

	var cid = new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
	var buf = transaction.toBuffer(trx);

	for (var key in keys) {
		var sig = Signature.signBuffer(Buffer.concat([cid, buf]), keys[key]);
		signatures.push(sig.toBuffer())
	}

	return signed_transaction.toObject(Object.assign(trx, { signatures: signatures }))
};

module.exports = Auth;