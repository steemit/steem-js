declare module 'ecurve' {
    import { BigInteger } from 'bigi';

    export class Point {
        constructor(curve: Curve, x: BigInteger | null, y: BigInteger | null, z: BigInteger);
        curve: Curve;
        x: BigInteger | null;
        y: BigInteger | null;
        z: BigInteger;
        compressed: boolean;

        readonly zInv: BigInteger;
        readonly affineX: BigInteger;
        readonly affineY: BigInteger;

        static fromAffine(curve: Curve, x: BigInteger, y: BigInteger): Point;

        equals(other: Point): boolean;
        negate(): Point;
        add(b: Point): Point;
        twice(): Point;
        multiply(k: BigInteger): Point;
        multiplyTwo(j: BigInteger, x: Point, k: BigInteger): Point;
        getEncoded(compressed?: boolean): Buffer;
        toString(): string;
        static decodeFrom(curve: Curve, buffer: Buffer): Point;
    }

    export class Curve {
        constructor(
            p: BigInteger,
            a: BigInteger,
            b: BigInteger,
            Gx: BigInteger,
            Gy: BigInteger,
            n: BigInteger,
            h: BigInteger,
        );
        p: BigInteger;
        a: BigInteger;
        b: BigInteger;
        n: BigInteger;
        h: BigInteger;
        G: Point;
        infinity: Point;

        isInfinity(Q: any): boolean;
        isOnCurve(Q: any): boolean;
        pointFromX(isOdd: boolean, x: BigInteger): Point;
        validate(Q: any): boolean;

        static getCurveByName(name: string): Curve;
    }

    export function getCurveByName(name: string): Curve;
} 