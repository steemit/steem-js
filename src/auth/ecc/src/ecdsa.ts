import * as crypto from './hash';
import enforce from './enforce_types';
import BN from 'bn.js';
import ECSignature from './ecsignature';

import { ec as EC } from 'elliptic';

// Use elliptic types directly
type ECInstance = EC;
// ECPoint is a point on the elliptic curve
// Using the actual type from elliptic library's point interface
type ECPoint = ReturnType<ECInstance['g']['mul']>;

// https://tools.ietf.org/html/rfc6979#section-3.2
function deterministicGenerateK(curve: ECInstance, hash: Buffer, d: BN, checkSig: (k: BN) => boolean, nonce?: number): BN {
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
    while ((T.isNeg() || T.isZero()) || (T.gte(new BN(curve.n!.toString()))) || !checkSig(T)) {
        k = crypto.HmacSHA256(Buffer.concat([v, Buffer.from([0])]) as Buffer, k);
        v = crypto.HmacSHA256(v, k);

        // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
        // Step H2b again
        v = crypto.HmacSHA256(v, k);

        T = new BN(v);
    }

    return T;
}

export function sign(curve: ECInstance, hash: Buffer, d: BN, nonce?: number): ECSignature {
    const e = new BN(hash);
    const n = new BN(curve.n!.toString());
    const G = curve.g;

    let r: BN | undefined;
    let s: BN | undefined;

    deterministicGenerateK(curve, hash, d, function (k) {
        // find canonically valid signature
        const Q = G.mul(k);

        if (Q.isInfinity()) return false;

        const tempR = new BN(Q.getX().toString()).mod(n);
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

export function verify(curve: ECInstance, hash: Buffer, signature: ECSignature, Q: ECPoint): boolean {
    const e = new BN(hash);
    return verifyRaw(curve, e, signature, Q);
}

function verifyRaw(curve: ECInstance, e: BN, signature: ECSignature, Q: ECPoint): boolean {
    const n = new BN(curve.n!.toString());
    const G = curve.g;

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

    // 1.4.5 Compute R = (xR, yR) = u1G + u2Q
    const R = G.mul(u1).add(Q.mul(u2));

    // 1.4.5 (cont.) Enforce R is not at infinity
    if (R.isInfinity()) return false;

    // 1.4.6 Convert the field element R.x to an integer
    const xR = new BN(R.getX().toString());

    // 1.4.7 Set v = xR mod n
    const v = xR.mod(n);

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
export function recoverPubKey(curve: ECInstance, e: BN, signature: ECSignature, i: number): ECPoint {
    if ((i & 3) !== i) {
      throw new Error('Recovery param is more than two bits');
    }

    const n = new BN(curve.n!.toString());
    const r = signature.r;
    const s = signature.s;

    if (r.isNeg() || r.isZero() || !r.lt(n)) throw new Error('Invalid r value');
    if (s.isNeg() || s.isZero() || !s.lt(n)) throw new Error('Invalid s value');

    // Try using elliptic's built-in recoverPubKey method
    // It expects: msg (Buffer), signature ({r: BN, s: BN}), j (recovery param)
    try {
        // Convert e (BN) to Buffer
        const msgBuffer = e.toArrayLike(Buffer, 'be', 32);
        
        // Create signature object compatible with elliptic's recoverPubKey
        // elliptic expects {r: BN, s: BN} format
        const sigObj = { r: r, s: s };
        
        // Use elliptic's built-in method
        const Q = curve.recoverPubKey(msgBuffer, sigObj, i);
        return Q;
    } catch (error) {
        // Fallback to manual implementation if elliptic's method fails
        const G = curve.g;

        // A set LSB signifies that the y-coordinate is odd
        const isYOdd = !!(i & 1);

        // The more significant bit specifies whether we should use the
        // first or second candidate key.
        const isSecondKey = i >> 1;

        // 1.1 Let x = r + jn
        const x = isSecondKey ? r.add(n) : r;
        // pointFromX expects a hex string (not BN object)
        // Convert BN to hex string and ensure proper padding
        const xHex = x.toString(16);
        // Ensure hex string is properly padded to 64 characters (32 bytes)
        const xHexPadded = xHex.padStart(64, '0');
        // pointFromX may also accept a Buffer, but hex string is more reliable
        let R: ECPoint;
        try {
            R = curve.curve.pointFromX(xHexPadded, isYOdd);
        } catch (error) {
            // If hex string fails, try with Buffer
            const xBuffer = x.toArrayLike(Buffer, 'be', 32);
            R = curve.curve.pointFromX(xBuffer, isYOdd);
        }

        // 1.4 Check that nR is at infinity
        const nR = R.mul(n);
        if (!nR.isInfinity()) throw new Error('nR is not a valid curve point');

        // Compute -e from e
        const eNeg = e.neg().mod(n);

        // 1.6.1 Compute Q = r^-1 (sR -  eG)
        //               Q = r^-1 (sR + -eG)
        const rInv = r.invm(n);

        const sR = R.mul(s);
        const eGNeg = G.mul(eNeg);
        const Q = sR.add(eGNeg).mul(rInv);

        return Q;
    }
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
export function calcPubKeyRecoveryParam(curve: ECInstance, e: BN, signature: ECSignature, Q: ECPoint): number {
    for (let i = 0; i < 4; i++) {
        try {
            // Use our own recoverPubKey function instead of curve.recoverPubKey
            const Qprime = recoverPubKey(curve, e, signature, i);

            // 1.6.2 Verify Q = Q'
            // Compare points by checking coordinates (more reliable than eq method)
            const Qx = Q.getX().toString(16);
            const Qy = Q.getY().toString(16);
            const QprimeX = Qprime.getX().toString(16);
            const QprimeY = Qprime.getY().toString(16);
            
            if (Qx === QprimeX && Qy === QprimeY) {
                return i;
            }
        } catch (error) {
            // try next value
            console.debug(`Recovery attempt ${i} failed:`, (error as Error).message);
        }
    }

    // Additional debugging
    console.debug('All recovery attempts failed. Signature:', {
        r: signature.r.toString(16),
        s: signature.s.toString(16)
    });
    console.debug('Expected public key:', {
        x: Q.getX().toString(16),
        y: Q.getY().toString(16)
    });

    throw new Error('Unable to find valid recovery factor');
} 