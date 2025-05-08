declare module 'bigi' {
    class BigInteger {
        constructor(a: number | string | Buffer | BigInteger, b?: number, c?: number);
        static fromBuffer(buf: Buffer): BigInteger;
        static fromHex(hex: string): BigInteger;
        static valueOf(n: number): BigInteger;
        static ONE: BigInteger;
        static ZERO: BigInteger;

        toBuffer(size?: number): Buffer;
        toHex(): string;
        toString(radix?: number): string;
        compareTo(other: BigInteger): number;
        add(other: BigInteger): BigInteger;
        subtract(other: BigInteger): BigInteger;
        multiply(other: BigInteger): BigInteger;
        divide(other: BigInteger): BigInteger;
        mod(other: BigInteger): BigInteger;
        modInverse(other: BigInteger): BigInteger;
        modPow(e: BigInteger, m: BigInteger): BigInteger;
        square(): BigInteger;
        pow(e: number): BigInteger;
        shiftLeft(n: number): BigInteger;
        shiftRight(n: number): BigInteger;
        testBit(n: number): boolean;
        bitLength(): number;
        byteLength(): number;
        signum(): number;
        isEven(): boolean;
        isOdd(): boolean;
        isZero(): boolean;
        isNegative(): boolean;
        isPositive(): boolean;
        negate(): BigInteger;
        abs(): BigInteger;
        clone(): BigInteger;
    }

    export = BigInteger;
} 