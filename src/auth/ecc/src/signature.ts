import { ec as EC } from 'elliptic';
import BN from 'bn.js';
import { sha256 } from './hash';
import { PrivateKey } from './key_private';
import { PublicKey } from './key_public';
import { sign as ecdsaSign, calcPubKeyRecoveryParam } from './ecdsa';
import ECSignature from './ecsignature';
import { debug } from '../../../utils/debug';

const secp256k1 = new EC('secp256k1');

export class Signature {
    r: BN;
    s: BN;
    i: number;

    constructor(r: BN, s: BN, i: number) {
        this.r = r;
        this.s = s;
        this.i = i;
    }

    static fromBuffer(buffer: Buffer): Signature {
        if (buffer.length !== 65) {
            throw new Error('Invalid signature length');
        }

        const i = buffer.readUInt8(0);
        if ((i - 27) !== ((i - 27) & 7)) {
            throw new Error('Invalid signature parameter');
        }

        const r = new BN(buffer.slice(1, 33));
        const s = new BN(buffer.slice(33));
        return new Signature(r, s, i);
    }

    toBuffer(): Buffer {
        const buf = Buffer.alloc(65);
        buf.writeUInt8(this.i, 0);
        this.r.toArrayLike(Buffer, 'be', 32).copy(buf, 1);
        this.s.toArrayLike(Buffer, 'be', 32).copy(buf, 33);
        return buf;
    }

    static signBuffer(buf: Buffer, private_key: PrivateKey | string): Signature {
        const _hash = sha256(buf);
        return Signature.signBufferSha256(_hash, private_key);
    }

    static signBufferSha256(buf_sha256: Buffer, private_key: PrivateKey | string): Signature {
        if (buf_sha256.length !== 32 || !Buffer.isBuffer(buf_sha256)) {
            throw new Error("buf_sha256: 32 byte buffer required");
        }

        const privKey = typeof private_key === 'string' ? PrivateKey.fromWif(private_key) : private_key;
        if (!privKey) {
            throw new Error('private_key required');
        }

        const e = new BN(buf_sha256);
        let ecsignature: ECSignature;
        let i: number | null = null;
        let nonce = 0;

        // Generate signature (temporarily skip canonical check for debugging)
        ecsignature = ecdsaSign(secp256k1, buf_sha256, privKey.d, nonce);
        
        // Calculate recovery parameter to match old-steem-js
        i = calcPubKeyRecoveryParam(secp256k1, e, ecsignature, privKey.toPublic().Q);
        i += 4;  // compressed
        i += 27; // compact

        return new Signature(ecsignature.r, ecsignature.s, i!);
    }
    
    static isCanonical(r: Buffer, s: Buffer): boolean {
        // See libraries/fc/src/crypto/elliptic_common.cpp is_fc_canonical
        // return !(c.data[1] & 0x80)
        //     && !(c.data[1] == 0 && !(c.data[2] & 0x80))
        //     && !(c.data[33] & 0x80)
        //     && !(c.data[33] == 0 && !(c.data[34] & 0x80));
        
        // Note: c.data[1] corresponds to r[0], c.data[33] corresponds to s[0]
        return !(r[0] & 0x80)
            && !(r[0] === 0 && !(r[1] & 0x80))
            && !(s[0] & 0x80)
            && !(s[0] === 0 && !(s[1] & 0x80));
    }

    static sign(string: string, private_key: PrivateKey | string): Signature {
        return Signature.signBuffer(Buffer.from(string), private_key);
    }

    verifyBuffer(buf: Buffer, public_key: PublicKey): boolean {
        const _hash = sha256(buf);
        return this.verifyHash(_hash, public_key);
    }

    verifyHash(hash: Buffer, public_key: PublicKey): boolean {
        if (hash.length !== 32) {
            throw new Error("A SHA 256 should be 32 bytes long, instead got " + hash.length);
        }

        const e = new BN(hash);
        const n = secp256k1.n;
        const G = secp256k1.G;
        const Q = public_key.Q;
        if (!Q) {
            throw new Error('Invalid public key');
        }

        if (this.r.isNeg() || this.r.isZero() || this.r.gte(n)) {
            return false;
        }
        if (this.s.isNeg() || this.s.isZero() || this.s.gte(n)) {
            return false;
        }

        const c = this.s.invm(n);
        const u1 = e.mul(c).mod(n);
        const u2 = this.r.mul(c).mod(n);
        const xy = G.multiplyTwo(u1, Q, u2);
        const v = xy.affineX.mod(n);

        return v.eq(this.r);
    }

    static fromHex(hex: string): Signature {
        return Signature.fromBuffer(Buffer.from(hex, 'hex'));
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }
}
