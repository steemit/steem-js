import assert from 'assert';
import * as crypto from './hash';
import enforce from './enforce_types';
import BigInteger from 'bigi';
import ECSignature from './ecsignature';

// Use any type to avoid namespace issues
type Curve = any;
type Point = any;

// https://tools.ietf.org/html/rfc6979#section-3.2
function deterministicGenerateK(curve: Curve, hash: Buffer, d: BigInteger, checkSig: (k: BigInteger) => boolean, nonce?: number): BigInteger {
    enforce('Buffer', hash);
    enforce(BigInteger, d);

    if (nonce) {
        hash = crypto.sha256(Buffer.concat([hash, Buffer.alloc(nonce)])) as Buffer;
    }

    // sanity check
    assert.equal(hash.length, 32, 'Hash must be 256 bit');

    const x = d.toBuffer(32);
    let k = Buffer.alloc(32);
    let v = Buffer.alloc(32);

    // Step B
    v.fill(1);

    // Step C
    k.fill(0);

    // Step D
    k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([0]), x, hash]), k);

    // Step E
    v = crypto.HmacSHA256(v, k);

    // Step F
    k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([1]), x, hash]), k);

    // Step G
    v = crypto.HmacSHA256(v, k);

    // Step H1/H2a, ignored as tlen === qlen (256 bit)
    // Step H2b
    v = crypto.HmacSHA256(v, k);

    let T = BigInteger.fromBuffer(v);

    // Step H3, repeat until T is within the interval [1, n - 1] and passes the supplied check
    while ((T.signum() <= 0) || (T.compareTo(curve.n) >= 0) || !checkSig(T)) {
        k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([0])]), k);
        v = crypto.HmacSHA256(v, k);

        // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
        // Step H2b again
        v = crypto.HmacSHA256(v, k);

        T = BigInteger.fromBuffer(v);
    }

    return T;
}

export function sign(curve: Curve, hash: Buffer, d: BigInteger, nonce?: number): ECSignature {
    const e = BigInteger.fromBuffer(hash);
    const n = curve.n;
    const G = curve.G;

    let r: BigInteger | undefined;
    let s: BigInteger | undefined;

    deterministicGenerateK(curve, hash, d, function (k) {
        // find canonically valid signature
        const Q = G.multiply(k);

        if (curve.isInfinity(Q)) return false;

        const tempR = Q.affineX.mod(n);
        if (tempR.signum() === 0) return false;

        const tempS = k.modInverse(n).multiply(e.add(d.multiply(tempR))).mod(n);
        if (tempS.signum() === 0) return false;

        r = tempR;
        s = tempS;
        return true;
    }, nonce);

    if (!r || !s) throw new Error('Unable to find valid signature');

    const N_OVER_TWO = n.shiftRight(1);

    // enforce low S values, see bip62: 'low s values in signatures'
    const finalS = s.compareTo(N_OVER_TWO) > 0 ? n.subtract(s) : s;

    return new ECSignature(r, finalS);
}

export function verify(curve: Curve, hash: Buffer, signature: ECSignature, Q: Point): boolean {
    const e = BigInteger.fromBuffer(hash);
    return verifyRaw(curve, e, signature, Q);
}

function verifyRaw(curve: Curve, e: BigInteger, signature: ECSignature, Q: Point): boolean {
    const n = curve.n;
    const G = curve.G;

    const r = signature.r;
    const s = signature.s;

    // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
    if (r.signum() <= 0 || r.compareTo(n) >= 0) return false;
    if (s.signum() <= 0 || s.compareTo(n) >= 0) return false;

    // c = s^-1 mod n
    const c = s.modInverse(n);

    // 1.4.4 Compute u1 = es^−1 mod n
    //               u2 = rs^−1 mod n
    const u1 = e.multiply(c).mod(n);
    const u2 = r.multiply(c).mod(n);

    // 1.4.5 Compute R = (xR, yR) = u1G + u2Q
    const R = G.multiplyTwo(u1, Q, u2);

    // 1.4.5 (cont.) Enforce R is not at infinity
    if (curve.isInfinity(R)) return false;

    // 1.4.6 Convert the field element R.x to an integer
    const xR = R.affineX;

    // 1.4.7 Set v = xR mod n
    const v = xR.mod(n);

    // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
    return v.equals(r);
}

/**
 * Recover a public key from a signature.
 *
 * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
 * Key Recovery Operation".
 *
 * http://www.secg.org/download/aid-780/sec1-v2.pdf
 */
export function recoverPubKey(curve: Curve, e: BigInteger, signature: ECSignature, i: number): Point {
    assert.strictEqual(i & 3, i, 'Recovery param is more than two bits');

    const n = curve.n;
    const G = curve.G;

    const r = signature.r;
    const s = signature.s;

    assert(r.signum() > 0 && r.compareTo(n) < 0, 'Invalid r value');
    assert(s.signum() > 0 && s.compareTo(n) < 0, 'Invalid s value');

    // A set LSB signifies that the y-coordinate is odd
    const isYOdd = !!(i & 1);

    // The more significant bit specifies whether we should use the
    // first or second candidate key.
    const isSecondKey = i >> 1;

    // 1.1 Let x = r + jn
    const x = isSecondKey ? r.add(n) : r;
    const R = curve.pointFromX(isYOdd, x);

    // 1.4 Check that nR is at infinity
    const nR = R.multiply(n);
    assert(curve.isInfinity(nR), 'nR is not a valid curve point');

    // Compute -e from e
    const eNeg = e.negate().mod(n);

    // 1.6.1 Compute Q = r^-1 (sR -  eG)
    //               Q = r^-1 (sR + -eG)
    const rInv = r.modInverse(n);

    const sR = R.multiply(s);
    const eGNeg = G.multiply(eNeg);
    const Q = sR.add(eGNeg).multiply(rInv);

    curve.validate(Q);

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
export function calcPubKeyRecoveryParam(curve: Curve, e: BigInteger, signature: ECSignature, Q: Point): number {
    for (let i = 0; i < 4; i++) {
        try {
            const Qprime = recoverPubKey(curve, e, signature, i);

            // 1.6.2 Verify Q = Q'
            if (Qprime.equals(Q)) {
                return i;
            }
        } catch (error) {
            // try next value
        }
    }

    throw new Error('Unable to find valid recovery factor');
} 