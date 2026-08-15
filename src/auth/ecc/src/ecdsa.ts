import * as crypto from './hash';
import enforce from './enforce_types';
import BN from 'bn.js';
import ECSignature from './ecsignature';

import { type ECPoint, G, CURVE_N, N_BN, bnToBigint, bigintToBn, pointFromX } from './curve';

// https://tools.ietf.org/html/rfc6979#section-3.2
function deterministicGenerateK(hash: Buffer, d: BN, checkSig: (k: BN) => boolean, nonce?: number): BN {
    enforce('Buffer', hash);
    enforce(BN as { new(...args: unknown[]): unknown }, d);

    if (nonce) {
        hash = crypto.sha256(Buffer.concat([hash, Buffer.alloc(nonce)])) as Buffer;
    }

    // sanity check
    if (hash.length !== 32) throw new Error('Hash must be 256 bit');

    const x = d.toArrayLike(Buffer, 'be', 32);
    let k: Buffer = Buffer.alloc(32);
    let v: Buffer = Buffer.alloc(32);

    // Step B
    v.fill(1);

    // Step C
    k.fill(0);

    // Step D
    k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([0]), x, hash]) as Buffer, k);

    // Step E
    v = crypto.HmacSHA256(v, k);

    // Step F
    k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([1]), x, hash]) as Buffer, k);

    // Step G
    v = crypto.HmacSHA256(v, k);

    // Step H1/H2a, ignored as tlen === qlen (256 bit)
    // Step H2b
    v = crypto.HmacSHA256(v, k);

    let T = new BN(v);

    // Step H3, repeat until T is within the interval [1, n - 1] and passes the supplied check
    while ((T.isNeg() || T.isZero()) || (T.gte(N_BN)) || !checkSig(T)) {
        k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([0])]) as Buffer, k);
        v = crypto.HmacSHA256(v, k);

        // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
        // Step H2b again
        v = crypto.HmacSHA256(v, k);

        T = new BN(v);
    }

    return T;
}

export function sign(hash: Buffer, d: BN, nonce?: number): ECSignature {
    const e = new BN(hash);
    const n = N_BN;

    let r: BN | undefined;
    let s: BN | undefined;

    deterministicGenerateK(hash, d, function (k) {
        // find canonically valid signature
        const Q = G.multiply(bnToBigint(k));

        if (Q.is0()) return false;

        const tempR = bigintToBn(Q.x % CURVE_N);
        if (tempR.isZero()) return false;

        const tempS = k.invm(n).mul(e.add(d.mul(tempR))).mod(n);
        if (tempS.isZero()) return false;

        r = tempR;
        s = tempS;
        return true;
    }, nonce);

    if (!r || !s) throw new Error('Unable to find valid signature');

    const N_OVER_TWO = n.shrn(1);

    // enforce low S values, see bip62: 'low s values in signatures'
    const finalS = s.gt(N_OVER_TWO) ? n.sub(s) : s;

    return new ECSignature(r, finalS);
}

export function verify(signature: ECSignature, hash: Buffer, Q: ECPoint): boolean {
    const e = new BN(hash);
    return verifyRaw(e, signature, Q);
}

function verifyRaw(e: BN, signature: ECSignature, Q: ECPoint): boolean {
    const n = N_BN;
    const r = signature.r;
    const s = signature.s;

    // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
    if (r.isNeg() || r.isZero() || r.gte(n)) return false;
    if (s.isNeg() || s.isZero() || s.gte(n)) return false;

    // c = s^-1 mod n
    const c = s.invm(n);

    // 1.4.4 Compute u1 = es^−1 mod n
    //               u2 = rs^−1 mod n
    const u1 = e.mul(c).mod(n);
    const u2 = r.mul(c).mod(n);

    // 1.4.5 Compute R = (xR, yR) = u1G + u2Q via double-scalar
    // multiplication (non-secret scalars)
    const R = G.mulAddUnsafe(bnToBigint(u1), Q, bnToBigint(u2));

    // 1.4.5 (cont.) Enforce R is not at infinity
    if (R.is0()) return false;

    // 1.4.6/1.4.7 Convert the field element R.x to an integer mod n
    const v = bigintToBn(R.x % CURVE_N);

    // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
    return v.eq(r);
}

/**
 * Recover a public key from a signature.
 *
 * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
 * Key Recovery Operation".
 *
 * http://www.secg.org/download/aid-780/sec1-v2.pdf
 */
export function recoverPubKey(e: BN, signature: ECSignature, i: number): ECPoint {
    if ((i & 3) !== i) {
        throw new Error('Recovery param is more than two bits');
    }

    const n = N_BN;
    const r = signature.r;
    const s = signature.s;

    if (r.isNeg() || r.isZero() || !r.lt(n)) throw new Error('Invalid r value');
    if (s.isNeg() || s.isZero() || !s.lt(n)) throw new Error('Invalid s value');

    // A set LSB signifies that the y-coordinate is odd
    const isYOdd = !!(i & 1);

    // The more significant bit specifies whether we should use the
    // first or second candidate key.
    const isSecondKey = i >> 1;

    // 1.1 Let x = r + jn
    const x = isSecondKey ? r.add(n) : r;
    const R = pointFromX(bnToBigint(x), isYOdd);
    // nR = O holds by construction: secp256k1 has cofactor 1, so every
    // on-curve point built here has order n. (Replaces the explicit nR
    // check of the elliptic-based implementation, which noble-curves
    // cannot express because multiply() rejects scalars >= n.)

    // Compute -e from e
    // umod (not mod): bn.js mod keeps the sign of the dividend, which
    // would feed a negative scalar into the point multiplication.
    const eNeg = e.neg().umod(n);

    // 1.6.1 Compute Q = r^-1 (sR - eG)
    //               Q = r^-1 (sR + -eG)
    const rInv = r.invm(n);

    // multiplyUnsafe is used throughout: recovery involves non-secret
    // scalars and -e mod n may be zero, which multiply() rejects.
    const sR = R.multiplyUnsafe(bnToBigint(s));
    const eGNeg = G.multiplyUnsafe(bnToBigint(eNeg));
    const Q = sR.add(eGNeg).multiplyUnsafe(bnToBigint(rInv));

    return Q;
}

/**
 * Calculate pubkey extraction parameter.
 *
 * When extracting a pubkey from a signature, we have to
 * distinguish four different cases. Rather than putting this
 * burden on the verifier, Bitcoin includes a 2-bit value with the
 * signature.
 *
 * This function simply tries all four cases and returns the value
 * that resulted in a successful pubkey recovery.
 */
export function calcPubKeyRecoveryParam(e: BN, signature: ECSignature, Q: ECPoint): number {
    for (let i = 0; i < 4; i++) {
        try {
            const Qprime = recoverPubKey(e, signature, i);

            // 1.6.2 Verify Q = Q'
            if (Q.equals(Qprime)) {
                return i;
            }
        } catch {
            // try next value
        }
    }

    throw new Error('Unable to find valid recovery factor');
}
