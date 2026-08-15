import { secp256k1 } from '@noble/curves/secp256k1.js';
import BN from 'bn.js';

export { secp256k1 };

/** A point on the secp256k1 curve (noble-curves projective point). */
export type ECPoint = typeof secp256k1.Point.BASE;

/** Curve order n and field prime p, as native bigint values. */
export const CURVE_N = secp256k1.Point.CURVE().n;
export const CURVE_P = secp256k1.Point.CURVE().p;

export const G = secp256k1.Point.BASE;

/** BN form of the curve order, for arithmetic that stays in bn.js. */
export const N_BN = new BN(CURVE_N.toString());

export function bnToBigint(b: BN): bigint {
    return BigInt(b.toString());
}

export function bigintToBn(x: bigint): BN {
    return new BN(x.toString(16), 16);
}

/** Encode a coordinate (x or y) as a fixed-width 32-byte big-endian buffer. */
export function coordToBuffer(x: bigint): Buffer {
    return Buffer.from(x.toString(16).padStart(64, '0'), 'hex');
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    base %= mod;
    while (exp > 0n) {
        if (exp & 1n) result = (result * base) % mod;
        base = (base * base) % mod;
        exp >>= 1n;
    }
    return result;
}

/**
 * Construct a curve point from an x coordinate plus the parity of y,
 * mirroring elliptic's curve.pointFromX. Throws when x is not on the curve.
 */
export function pointFromX(x: bigint, isYOdd: boolean): ECPoint {
    const ySq = (x * x * x + 7n) % CURVE_P;
    // secp256k1 p ≡ 3 (mod 4), so the square root is ySq^((p+1)/4)
    const root = modPow(ySq, (CURVE_P + 1n) / 4n, CURVE_P);
    if ((root * root) % CURVE_P !== ySq) {
        throw new Error('Invalid point: x is not on the curve');
    }
    const y = (root & 1n) === (isYOdd ? 1n : 0n) ? root : CURVE_P - root;
    return secp256k1.Point.fromAffine({ x, y });
}
