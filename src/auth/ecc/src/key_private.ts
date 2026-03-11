import { ec as EC } from 'elliptic';
const secp256k1 = new EC('secp256k1');
import BN from 'bn.js';
import base58 from 'bs58';
import * as hash from './hash';
import { PublicKey } from './key_public';
import { debug } from '../../../utils/debug';

// Use elliptic types directly
// ECPoint is a point on the elliptic curve
type ECPoint = ReturnType<typeof secp256k1.g.mul>;

const G = secp256k1.g;
const n = new BN(secp256k1.n!.toString());
export class PrivateKey {
    d: BN;
    public_key?: PublicKey;

    /**
     * @private see static functions
     * @param {BN} d
     */
    constructor(d: BN) {
        this.d = d;
    }

    static fromBuffer(buf: Buffer): PrivateKey {
        if (!Buffer.isBuffer(buf)) {
            throw new Error("Expecting parameter to be a Buffer type");
        }
        if (32 !== buf.length) {
            debug.warn(`WARN: Expecting 32 bytes, instead got ${buf.length}, stack trace:`, new Error().stack);
        }
        if (buf.length === 0) {
            throw new Error("Empty buffer");
        }
        return new PrivateKey(new BN(buf));
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
        } catch {
            return false;
        }
    }

    /**
     * @throws {AssertError|Error} parsing key
     * @return {string} Wallet Import Format (still a secret, Not encrypted)
     */
    static fromWif(private_wif: string): PrivateKey {
        if (!private_wif || typeof private_wif !== 'string') {
            throw new Error('Invalid WIF: empty or not a string');
        }

        let private_wif_buffer: Buffer;
        try {
            private_wif_buffer = Buffer.from(base58.decode(private_wif));
        } catch {
            throw new Error('Invalid WIF: failed to decode base58');
        }

        // Valid WIF: 1 byte version + 32 bytes key + 4 bytes checksum = 37 bytes
        if (private_wif_buffer.length !== 37) {
            throw new Error(
                `Invalid WIF: expected 37 bytes, got ${private_wif_buffer.length}`
            );
        }

        const version = private_wif_buffer.readUInt8(0);
        if (version !== 0x80) {
            throw new Error(`Invalid WIF: expected version 0x80, got 0x${version.toString(16)}`);
        }

        const private_key = private_wif_buffer.slice(1, 33);
        const checksum = private_wif_buffer.slice(33);

        let new_checksum = hash.sha256(Buffer.concat([Buffer.from([0x80]), private_key]));
        new_checksum = hash.sha256(new_checksum);
        new_checksum = new_checksum.slice(0, 4);
        if (checksum.toString() !== new_checksum.toString()) {
            throw new Error('Invalid WIF key (checksum miss-match)');
        }

        return PrivateKey.fromBuffer(private_key);
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
    toPublicKeyPoint(): ECPoint {
        return G.mul(this.d);
    }

    toPublic(): PublicKey {
        if (this.public_key) {
            return this.public_key;
        }
        return this.public_key = PublicKey.fromPoint(this.toPublicKeyPoint());
    }

    toBuffer(): Buffer {
        return this.d.toArrayLike(Buffer, 'be', 32);
    }

    /** ECIES */
    get_shared_secret(public_key: PublicKey | string): Buffer {
        const pubKey = typeof public_key === 'string' 
            ? PublicKey.fromStringOrThrow(public_key)
            : public_key;
        
        if (!pubKey || !pubKey.Q) {
            throw new Error('Invalid public key');
        }
        
        // ECDH: shared_secret = private_key * public_key_point
        const P = pubKey.Q.mul(this.d);
        const S = P.getX().toArrayLike(Buffer, 'be', 32);
        
        // SHA512 used in ECIES
        return hash.sha512(S);
    }

    /** @throws {Error} - overflow of the key could not be derived */
    child(offset: Buffer): PrivateKey {
        offset = Buffer.concat([this.toPublicKey().toBuffer(), offset]);
        offset = hash.sha256(offset) as Buffer;
        const c = new BN(offset);

        if (c.gte(n)) {
            throw new Error("Child offset went out of bounds, try again");
        }

        const derived = this.d.add(c);

        if (derived.isZero()) {
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
