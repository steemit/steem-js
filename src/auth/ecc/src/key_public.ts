import BigInteger from 'bigi';
import ecurve from 'ecurve';
const secp256k1 = ecurve.getCurveByName('secp256k1');
import base58 from 'bs58';
import * as hash from './hash';
import { getConfig } from '../../../config';
import assert from 'assert';

// Use any type to avoid namespace issues
type Point = any;

const G = secp256k1.G;
const n = secp256k1.n;

export class PublicKey {
    Q: Point | null;
    pubdata?: string;

    /** @param {Point} public key */
    constructor(Q: Point | null) {
        this.Q = Q;
    }

    static fromBinary(bin: string): PublicKey {
        return PublicKey.fromBuffer(Buffer.from(bin, 'binary'));
    }

    static fromBuffer(buffer: Buffer): PublicKey {
        if (buffer.toString("hex") === "000000000000000000000000000000000000000000000000000000000000000000") {
            return new PublicKey(null);
        }
        return new PublicKey(ecurve.Point.decodeFrom(secp256k1, buffer));
    }

    toBuffer(compressed = this.Q ? this.Q.compressed : undefined): Buffer {
        if (this.Q === null) {
            return Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000000",
                "hex"
            );
        }
        return this.Q.getEncoded(compressed);
    }

    static fromPoint(point: Point): PublicKey {
        return new PublicKey(point);
    }

    toUncompressed(): PublicKey {
        const buf = this.Q!.getEncoded(false);
        const point = ecurve.Point.decodeFrom(secp256k1, buf);
        return PublicKey.fromPoint(point);
    }

    /** bts::blockchain::address (unique but not a full public key) */
    toBlockchainAddress(): Buffer {
        const pub_buf = this.toBuffer();
        const pub_sha = hash.sha512(pub_buf) as Buffer;
        return hash.ripemd160(pub_sha);
    }

    toString(address_prefix = getConfig().get('address_prefix')): string {
        return this.toPublicKeyString(address_prefix);
    }

    /**
     * Full public key
     * {return} string
     */
    toPublicKeyString(address_prefix = getConfig().get('address_prefix')): string {
        if (this.pubdata) return address_prefix + this.pubdata;
        const pub_buf = this.toBuffer();
        const checksum = hash.ripemd160(pub_buf);
        const addy = Buffer.concat([pub_buf, checksum.slice(0, 4)]);
        this.pubdata = base58.encode(addy);
        return address_prefix + this.pubdata;
    }

    /**
     * @arg {string} public_key - like STMXyz...
     * @arg {string} address_prefix - like STM
     * @return PublicKey or `null` (if the public_key string is invalid)
     * @deprecated fromPublicKeyString (use fromString instead)
     */
    static fromString(public_key: string, address_prefix = getConfig().get('address_prefix')): PublicKey | null {
        try {
            return PublicKey.fromStringOrThrow(public_key, address_prefix);
        } catch (e) {
            return null;
        }
    }

    /**
     * @arg {string} public_key - like STMXyz...
     * @arg {string} address_prefix - like STM
     * @throws {Error} if public key is invalid
     * @return PublicKey
     */
    static fromStringOrThrow(public_key: string, address_prefix = getConfig().get('address_prefix')): PublicKey {
        const prefix = public_key.slice(0, address_prefix.length);
        assert.equal(
            address_prefix, prefix,
            `Expecting key to begin with ${address_prefix}, instead got ${prefix}`
        );
        public_key = public_key.slice(address_prefix.length);

        const decoded = base58.decode(public_key);
        const buffer = Buffer.from(decoded);
        const checksum = buffer.slice(-4);
        const key = buffer.slice(0, -4);
        const new_checksum = hash.ripemd160(key);
        new_checksum.copy(Buffer.alloc(4), 0, 0, 4);
        assert.deepEqual(checksum, new_checksum.slice(0, 4), 'Checksum did not match');
        return PublicKey.fromBuffer(key);
    }

    toAddressString(address_prefix = getConfig().get('address_prefix')): string {
        const pub_buf = this.toBuffer();
        const pub_sha = hash.sha512(pub_buf) as Buffer;
        const addy = hash.ripemd160(pub_sha);
        const checksum = hash.ripemd160(addy);
        const addr_checksum = Buffer.concat([addy, checksum.slice(0, 4)]);
        return address_prefix + base58.encode(addr_checksum);
    }

    toPtsAddy(): string {
        const pub_buf = this.toBuffer();
        const pub_sha = hash.sha256(pub_buf);
        const addy = hash.ripemd160(pub_sha);
        const versionBuffer = Buffer.from([0x38]); // version 56(decimal)
        const addr = Buffer.concat([versionBuffer, addy]);
        let checksum = hash.sha256(addr);
        checksum = hash.sha256(checksum);
        const addr_checksum = Buffer.concat([addr, checksum.slice(0, 4)]);
        return base58.encode(addr_checksum);
    }

    child(offset: Buffer): PublicKey {
        assert(Buffer.isBuffer(offset), "Buffer required: offset");
        assert.equal(offset.length, 32, "offset length");

        offset = Buffer.concat([this.toBuffer(), offset]);
        offset = hash.sha256(offset) as Buffer;

        const c = BigInteger.fromBuffer(offset);

        if (c.compareTo(n) >= 0)
            throw new Error("Child offset went out of bounds, try again");

        const cG = G.multiply(c);
        const Qprime = this.Q!.add(cG);

        if (secp256k1.isInfinity(Qprime))
            throw new Error("Child offset derived to an invalid key, try again");

        return PublicKey.fromPoint(Qprime);
    }

    static fromHex(hex: string): PublicKey {
        const buffer = Buffer.from(hex, 'hex');
        if (buffer.length === 0) {
            // Return null public key for zero hex
            return new PublicKey(null);
        }
        return PublicKey.fromBuffer(buffer);
    }

    toHex(): string {
        if (!this.Q) {
            return '000000000000000000000000000000000000000000000000000000000000000000';
        }
        return this.toBuffer().toString('hex');
    }

    static fromStringHex(hex: string): PublicKey {
        return PublicKey.fromString(Buffer.from(hex, 'hex').toString())!;
    }

    /* </HEX> */
} 