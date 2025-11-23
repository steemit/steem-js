import { getCurveByName } from 'ecurve';
import bigi from 'bigi';
import { sha256 } from './hash';
import { PrivateKey } from './key_private';
import { PublicKey } from './key_public';

const secp256k1 = getCurveByName('secp256k1');

export class Signature {
    r: bigi;
    s: bigi;
    i: number;

    constructor(r: bigi, s: bigi, i: number) {
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

        const r = bigi.fromBuffer(buffer.slice(1, 33));
        const s = bigi.fromBuffer(buffer.slice(33));
        return new Signature(r, s, i);
    }

    toBuffer(): Buffer {
        const buf = Buffer.alloc(65);
        buf.writeUInt8(this.i, 0);
        this.r.toBuffer(32).copy(buf, 1);
        this.s.toBuffer(32).copy(buf, 33);
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

        const e = bigi.fromBuffer(buf_sha256);
        const n = secp256k1.n;
        const G = secp256k1.G;
        const d = privKey.d;

        let r: bigi, s: bigi;
        let nonce = 0;

        while (true) {
            const k = bigi.fromBuffer(sha256(Buffer.concat([buf_sha256, Buffer.from([nonce++])])));
            const Q = G.multiply(k);
            r = Q.affineX.mod(n);
            if (r.signum() === 0) continue;
            s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);
            if (s.signum() === 0) continue;
            break;
        }

        const N_OVER_TWO = n.shiftRight(1);
        if (s.compareTo(N_OVER_TWO) > 0) {
            s = n.subtract(s);
        }

        const i = 27 + 4; // compressed + compact
        return new Signature(r, s, i);
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

        const e = bigi.fromBuffer(hash);
        const n = secp256k1.n;
        const G = secp256k1.G;
        const Q = public_key.Q;
        if (!Q) {
            throw new Error('Invalid public key');
        }

        if (this.r.signum() <= 0 || this.r.compareTo(n) >= 0) {
            return false;
        }
        if (this.s.signum() <= 0 || this.s.compareTo(n) >= 0) {
            return false;
        }

        const c = this.s.modInverse(n);
        const u1 = e.multiply(c).mod(n);
        const u2 = this.r.multiply(c).mod(n);
        const xy = G.multiplyTwo(u1, Q, u2);
        const v = xy.affineX.mod(n);

        return v.equals(this.r);
    }

    static fromHex(hex: string): Signature {
        return Signature.fromBuffer(Buffer.from(hex, 'hex'));
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }
}
