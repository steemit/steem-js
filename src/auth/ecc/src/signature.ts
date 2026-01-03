import { ec as EC } from 'elliptic';
import BN from 'bn.js';
import { sha256 } from './hash';
import { PrivateKey } from './key_private';
import { PublicKey } from './key_public';
import { sign as ecdsaSign, calcPubKeyRecoveryParam } from './ecdsa';
import ECSignature from './ecsignature';
// import { debug } from '../../../utils/debug'; // Unused import

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
        // Support both formats: 27-30 (old/legacy) and 31-34 (dsteem compatible)
        // Check if it's in the old format (27-30) or new format (31-34)
        const recoveryOld = i - 27;
        const recoveryNew = i - 31;
        const isValidOld = recoveryOld >= 0 && recoveryOld <= 3 && (recoveryOld === (recoveryOld & 7));
        const isValidNew = recoveryNew >= 0 && recoveryNew <= 3 && (recoveryNew === (recoveryNew & 7));
        if (!isValidOld && !isValidNew) {
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

        const d = privKey.d;
        let ecsignature: ECSignature;
        let nonce = 0;

        // Match old-steem-js behavior: find canonical signature (lenR === 32 && lenS === 32)
        // Based on C++ is_fc_canonical logic
        while (true) {
            ecsignature = ecdsaSign(secp256k1, buf_sha256, d, nonce++);
            const rBa = ecsignature.r.toArrayLike(Buffer, 'be', 32);
            const sBa = ecsignature.s.toArrayLike(Buffer, 'be', 32);

            // Check for canonical signature based on Steem C++ implementation
            // libraries/fc/src/crypto/elliptic_common.cpp is_fc_canonical
            const isCanonical = !(rBa[0] & 0x80)
                && !(rBa[0] === 0 && !(rBa[1] & 0x80))
                && !(sBa[0] & 0x80)
                && !(sBa[0] === 0 && !(sBa[1] & 0x80));

            if (isCanonical) {
                break;
            }

            if (nonce % 10 === 0) {
                console.debug("WARN: " + nonce + " attempts to find canonical signature");
            }
        }

        const i = calcPubKeyRecoveryParam(secp256k1, new BN(buf_sha256), ecsignature, privKey.toPublic().Q!);
        // Use recovery byte 31-34 (instead of 27-30) to be compatible with dsteem
        // dsteem expects: recovery = byte - 31, so byte = recovery + 31
        return new Signature(ecsignature.r, ecsignature.s, i + 31);
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
        const n = new BN(secp256k1.n!.toString());
        const G = secp256k1.g;
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
        
        // Use elliptic.js API: R = u1*G + u2*Q
        const R = G.mul(u1).add(Q.mul(u2));
        
        if (R.isInfinity()) {
            return false;
        }
        
        const v = R.getX().mod(n);
        return v.eq(this.r);
    }

    static fromHex(hex: string): Signature {
        return Signature.fromBuffer(Buffer.from(hex, 'hex'));
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }
}
