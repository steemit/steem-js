import { Point, getCurveByName } from 'ecurve';
import bigi from 'bigi';
import bs58 from 'bs58';
import { sha256, ripemd160, sha512 } from './hash';
import { getConfig } from '../config';

const secp256k1 = getCurveByName('secp256k1');

export class PublicKey {
    Q: Point | null;

    constructor(Q: Point | null) {
        this.Q = Q;
    }

    static fromBinary(bin: string): PublicKey {
        return PublicKey.fromBuffer(Buffer.from(bin, 'binary'));
    }

    static fromBuffer(buffer: Buffer): PublicKey {
        if (
            buffer.toString("hex") ===
            "000000000000000000000000000000000000000000000000000000000000000000"
        ) {
            return new PublicKey(null);
        }
        // Handle both compressed (33 bytes) and uncompressed (65 bytes) buffers
        if (buffer.length === 33 || buffer.length === 65) {
            return new PublicKey(Point.decodeFrom(secp256k1, buffer));
        }
        throw new Error('Invalid public key buffer length: ' + buffer.length);
    }

    toBuffer(compressed?: boolean): Buffer {
        if (this.Q === null) {
            return Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
            );
        }
        // Default to compressed if not specified
        return this.Q.getEncoded(compressed !== false);
    }

    toUncompressed(): PublicKey {
        if (this.Q === null) {
            return new PublicKey(null);
        }
        const buf = this.Q.getEncoded(false); // uncompressed
        return PublicKey.fromBuffer(buf);
    }

    toString(address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): string {
        return this.toPublicKeyString(address_prefix);
    }

    static fromString(public_key: string, address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): PublicKey {
        try {
            return PublicKey.fromStringOrThrow(public_key, address_prefix);
        } catch (e) {
            throw new Error('Invalid public key');
        }
    }

    static fromStringOrThrow(public_key: string, address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): PublicKey {
        const prefix = public_key.slice(0, address_prefix.length);
        if (prefix !== address_prefix) {
            throw new Error(`Expecting key to begin with ${address_prefix}, instead saw ${prefix}`);
        }
        let keyString = public_key.slice(address_prefix.length);
        const decoded = Buffer.from(bs58.decode(keyString));
        const keyBytes = decoded.slice(0, decoded.length - 4);
        const checksum = decoded.slice(decoded.length - 4);
        const new_checksum = ripemd160(keyBytes).slice(0, 4);
        if (!checksum.equals(new_checksum)) {
            throw new Error('Checksum did not match');
        }
        return PublicKey.fromBuffer(keyBytes);
    }

    static fromHex(hex: string): PublicKey {
        return PublicKey.fromBuffer(Buffer.from(hex, 'hex'));
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }

    /** Validate the public key */
    validate(): void {
        if (!this.Q) {
            throw new Error('Invalid public key: Q is null');
        }
        if (secp256k1.isInfinity(this.Q)) {
            throw new Error('Invalid public key: point is at infinity');
        }
        // Check if the point is on the curve
        if (!secp256k1.isOnCurve(this.Q)) {
            throw new Error('Invalid public key: point is not on the curve');
        }
    }

    /** Check if the public key is valid */
    isValid(): boolean {
        try {
            this.validate();
            return true;
        } catch (e) {
            return false;
        }
    }

    /** Check if the public key is the zero key */
    isZero(): boolean {
        return this.Q === null;
    }

    static fromStringHex(hex: string): PublicKey {
        return PublicKey.fromString(Buffer.from(hex, 'hex').toString());
    }

    toPublicKeyString(address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): string {
        const pub_buf = this.toBuffer();
        const checksum = ripemd160(pub_buf);
        const addy = Buffer.concat([pub_buf, checksum.slice(0, 4)]);
        return address_prefix + bs58.encode(addy);
    }

    toAddressString(address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): string {
        const pub_buf = this.toBuffer();
        const pub_sha = sha512(pub_buf);
        let addy = ripemd160(pub_sha);
        const checksum = ripemd160(addy);
        addy = Buffer.concat([addy, checksum.slice(0, 4)]);
        return address_prefix + bs58.encode(addy);
    }

    toPtsAddy(): string {
        const pub_buf = this.toBuffer();
        let addy = ripemd160(sha256(pub_buf));
        addy = Buffer.concat([Buffer.from([0x38]), addy]); // version 56 decimal
        let checksum = sha256(addy);
        checksum = sha256(checksum);
        addy = Buffer.concat([addy, checksum.slice(0, 4)]);
        return bs58.encode(addy);
    }

    /** Generate a blockchain address from the public key */
    toBlockchainAddress(): Buffer {
        const pub_buf = this.toBuffer();
        const pub_sha = sha512(pub_buf);
        return ripemd160(pub_sha);
    }

    /** Derive a child public key using the given offset */
    child(offset: Buffer): PublicKey {
        if (!Buffer.isBuffer(offset)) {
            throw new Error("Buffer required: offset");
        }
        if (offset.length !== 32) {
            throw new Error("offset length must be 32 bytes");
        }

        const offsetBuffer = Buffer.concat([this.toBuffer(), offset]);
        const offsetHash = sha256(offsetBuffer);
        const c = bigi.fromBuffer(offsetHash);

        if (c.compareTo(secp256k1.n) >= 0) {
            throw new Error("Child offset went out of bounds, try again");
        }

        const cG = secp256k1.G.multiply(c);
        const Qprime = this.Q!.add(cG);

        if (secp256k1.isInfinity(Qprime)) {
            throw new Error("Child offset derived to an invalid key, try again");
        }

        return new PublicKey(Qprime);
    }

    /** Check if two public keys are equal */
    equals(other: PublicKey): boolean {
        if (!this.Q || !other.Q) {
            return this.Q === other.Q;
        }
        return this.Q.equals(other.Q);
    }

    /** Get the compressed form of the public key */
    toCompressed(): PublicKey {
        const buf = this.toBuffer();
        return PublicKey.fromBuffer(buf);
    }
} 