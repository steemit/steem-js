import { Point, getCurveByName } from 'ecurve';
import bigi from 'bigi';
import bs58 from 'bs58';
import { sha256, sha512, ripemd160 } from './hash';
import { getConfig } from '../config';
import { PublicKey } from './key_public';
import { Signature } from './signature';

const secp256k1 = getCurveByName('secp256k1');
const G = secp256k1.G;
const n = secp256k1.n;

export interface KeyPair {
    privateKey: string;
    publicKey: string;
}

export class PrivateKey {
    private d: bigi;
    private public_key?: PublicKey;

    constructor(d: bigi) {
        this.d = d;
    }

    getPrivateKey(): bigi {
        return this.d;
    }

    static fromWif(wif: string): PrivateKey {
        const version = Number(getConfig().get('wifPrefix')) || 128;
        const decoded = bs58.decode(wif);
        const versionLength = 1;
        const keyLength = 32;
        const checksumLength = 4;

        const versionBytes = Buffer.from(decoded.slice(0, versionLength));
        const keyBytes = Buffer.from(decoded.slice(versionLength, versionLength + keyLength));
        const checksumBytes = Buffer.from(decoded.slice(versionLength + keyLength, versionLength + keyLength + checksumLength));

        const keyString = Buffer.from(decoded.slice(0, versionLength + keyLength));
        const checksum = sha256(keyString);
        const checksum2 = sha256(checksum);

        if (checksumBytes.toString('hex') !== checksum2.slice(0, 4).toString('hex')) {
            throw new Error('Invalid checksum');
        }

        if (versionBytes[0] !== version) {
            throw new Error('Invalid version');
        }

        return new PrivateKey(bigi.fromBuffer(keyBytes));
    }

    toWif(): string {
        const version = Number(getConfig().get('wifPrefix')) || 128;
        const keyBytes = this.toBuffer();
        const versionBytes = Buffer.from([version]);
        const keyString = Buffer.concat([versionBytes, keyBytes]);
        const checksum = sha256(keyString);
        const checksum2 = sha256(checksum);
        const checksumBytes = checksum2.slice(0, 4);
        const wif = Buffer.concat([versionBytes, keyBytes, checksumBytes]);
        return bs58.encode(wif);
    }

    toPublic(): PublicKey {
        return this.toPublicKey();
    }

    toPublicKey(): PublicKey {
        const Q = G.multiply(this.d);
        return new PublicKey(Q);
    }

    toBuffer(): Buffer {
        return this.d.toBuffer(32);
    }

    get_shared_secret(public_key: PublicKey | string): Buffer {
        const pub = typeof public_key === 'string' ? PublicKey.fromString(public_key) : public_key;
        const P = pub.Q!.multiply(this.d);
        const S = P.affineX.toBuffer(32);
        return sha512(S);
    }

    static fromBuffer(buffer: Buffer): PrivateKey {
        return new PrivateKey(bigi.fromBuffer(buffer));
    }

    static fromHex(hex: string): PrivateKey {
        return PrivateKey.fromBuffer(Buffer.from(hex, 'hex'));
    }

    /** Generate a private key from a seed string */
    static fromSeed(seed: string): PrivateKey {
        if (typeof seed !== 'string') {
            throw new Error('seed must be of type string');
        }
        return PrivateKey.fromBuffer(sha256(Buffer.from(seed)));
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }

    /** Sign a buffer with this private key */
    sign(buf: Buffer): Signature {
        return Signature.signBuffer(buf, this);
    }

    /** Derive a child private key from this private key */
    child(offset: Buffer): PrivateKey {
        if (!Buffer.isBuffer(offset)) {
            throw new Error('Buffer required: offset');
        }
        if (offset.length !== 32) {
            throw new Error('offset length must be 32 bytes');
        }

        const offsetHash = Buffer.concat([this.toPublic().toBuffer(), offset]);
        const c = bigi.fromBuffer(sha256(offsetHash));

        if (c.compareTo(n) >= 0) {
            throw new Error('Child offset went out of bounds, try again');
        }

        const derived = this.d.add(c);

        if (derived.signum() === 0) {
            throw new Error('Child offset derived to an invalid key, try again');
        }

        return new PrivateKey(derived);
    }

    /** Validate the private key */
    validate(): void {
        if (!this.d) {
            throw new Error('Invalid private key: d is null');
        }
        if (this.d.signum() <= 0) {
            throw new Error('Invalid private key: d must be positive');
        }
        if (this.d.compareTo(n) >= 0) {
            throw new Error('Invalid private key: d must be less than n');
        }
    }

    /** Check if the private key is valid */
    isValid(): boolean {
        try {
            this.validate();
            return true;
        } catch (e) {
            return false;
        }
    }

    /** Generate a new random private key */
    static random(): PrivateKey {
        const randomBytes = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
        }
        const d = bigi.fromBuffer(randomBytes).mod(n);
        return new PrivateKey(d);
    }

    /** Generate a key pair from this private key */
    toKeyPair(): KeyPair {
        const publicKey = this.toPublic();
        return {
            privateKey: this.toWif(),
            publicKey: publicKey.toString()
        };
    }

    /** Generate a new random key pair */
    static randomKeyPair(): KeyPair {
        return PrivateKey.random().toKeyPair();
    }
} 