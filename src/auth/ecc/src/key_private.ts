import ecurve from 'ecurve';
const secp256k1 = ecurve.getCurveByName('secp256k1');
import BigInteger from 'bigi';
import base58 from 'bs58';
import assert from 'assert';
import * as hash from './hash';
import { PublicKey } from './key_public';

// Use any type to avoid namespace issues
type Point = any;

const G = secp256k1.G;
const n = secp256k1.n;
export class PrivateKey {
    d: BigInteger;
    public_key?: PublicKey;

    /**
     * @private see static functions
     * @param {BigInteger} d
     */
    constructor(d: BigInteger) {
        this.d = d;
    }

    static fromBuffer(buf: Buffer): PrivateKey {
        if (!Buffer.isBuffer(buf)) {
            throw new Error("Expecting parameter to be a Buffer type");
        }
        if (32 !== buf.length) {
            console.log(`WARN: Expecting 32 bytes, instead got ${buf.length}, stack trace:`, new Error().stack);
        }
        if (buf.length === 0) {
            throw new Error("Empty buffer");
        }
        return new PrivateKey(BigInteger.fromBuffer(buf));
    }

    /** @arg {string} seed - any length string. This is private, the same seed produces the same private key every time. */
    static fromSeed(seed: string): PrivateKey {
        if (typeof seed !== 'string') {
            throw new Error('seed must be of type string');
        }
        return PrivateKey.fromBuffer(hash.sha256(seed) as Buffer);
    }

    static isWif(text: string): boolean {
        try {
            this.fromWif(text);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @throws {AssertError|Error} parsing key
     * @return {string} Wallet Import Format (still a secret, Not encrypted)
     */
    static fromWif(private_wif: string): PrivateKey {
        const private_wif_buffer = Buffer.from(base58.decode(private_wif));
        const version = private_wif_buffer.readUInt8(0);
        assert.equal(0x80, version, `Expected version ${0x80}, instead got ${version}`);
        // checksum includes the version
        const private_key = private_wif_buffer.slice(0, -4);
        const checksum = private_wif_buffer.slice(-4);
        let new_checksum = hash.sha256(private_key);
        new_checksum = hash.sha256(new_checksum);
        new_checksum = new_checksum.slice(0, 4);
        if (checksum.toString() !== new_checksum.toString()) {
            throw new Error('Invalid WIF key (checksum miss-match)');
        }

        private_key.writeUInt8(0x80, 0);
        return PrivateKey.fromBuffer(private_key.slice(1));
    }

    toWif(): string {
        const private_key = this.toBuffer();
        // checksum includes the version
        const private_wif = Buffer.concat([Buffer.from([0x80]), private_key]);
        let checksum = hash.sha256(private_wif);
        checksum = hash.sha256(checksum);
        checksum = checksum.slice(0, 4);
        const private_wif_buffer = Buffer.concat([private_wif, checksum]);
        return base58.encode(private_wif_buffer);
    }

    /** Alias for {@link toWif} */
    toString(): string {
        return this.toWif();
    }

    /**
     * @return {Point}
     */
    toPublicKeyPoint(): Point {
        return G.multiply(this.d);
    }

    toPublic(): PublicKey {
        if (this.public_key) {
            return this.public_key;
        }
        return this.public_key = PublicKey.fromPoint(this.toPublicKeyPoint());
    }

    toBuffer(): Buffer {
        return this.d.toBuffer(32);
    }

    /** ECIES */
    get_shared_secret(public_key: PublicKey | string): Buffer {
        const pubKey = toPublic(public_key);
        if (!pubKey) {
            throw new Error('Invalid public key');
        }
        const KB = pubKey.toUncompressed().toBuffer();
        const KBP = ecurve.Point.fromAffine(
            secp256k1,
            BigInteger.fromBuffer(KB.slice(1, 33)), // x
            BigInteger.fromBuffer(KB.slice(33, 65)) // y
        );
        const r = this.toBuffer();
        const P = KBP.multiply(BigInteger.fromBuffer(r));
        const S = P.affineX.toBuffer({ size: 32 });
        // SHA512 used in ECIES
        return hash.sha512(S);
    }

    /** @throws {Error} - overflow of the key could not be derived */
    child(offset: Buffer): PrivateKey {
        offset = Buffer.concat([this.toPublicKey().toBuffer(), offset]);
        offset = hash.sha256(offset) as Buffer;
        const c = BigInteger.fromBuffer(offset);

        if (c.compareTo(n) >= 0) {
            throw new Error("Child offset went out of bounds, try again");
        }

        const derived = this.d.add(c);

        if (derived.signum() === 0) {
            throw new Error("Child offset derived to an invalid key, try again");
        }

        return new PrivateKey(derived);
    }

    static fromHex(hex: string): PrivateKey {
        return PrivateKey.fromBuffer(Buffer.from(hex, 'hex'));
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }

    toPublicKey(): PublicKey {
        return this.toPublic();
    }
}

const toPublic = (data: PublicKey | string): PublicKey => {
    if (typeof data === 'string') {
        return PublicKey.fromStringOrThrow(data);
    }
    return data;
}; 