import { sha256, sha512, ripemd160 } from './hash';
import { getConfig } from '../config';
import bs58 from 'bs58';
import { PublicKey } from './key_public';

export class Address {
    private addy: Buffer;

    constructor(addy: Buffer) {
        this.addy = addy;
    }

    static fromBuffer(buffer: Buffer): Address {
        // Original: sha512 then ripemd160
        const _hash = sha512(buffer);
        const addy = ripemd160(_hash);
        return new Address(addy);
    }

    static fromString(string: string, address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): Address {
        // Remove prefix if present
        let base58str = string;
        if (string.startsWith(address_prefix)) {
            base58str = string.slice(address_prefix.length);
        }
        let addy = Buffer.from(bs58.decode(base58str));
        // For Steem: last 4 bytes are ripemd160 checksum
        // For BTC/PTS: last 4 bytes are double sha256 checksum
        let version = addy[0];
        let body = addy.slice(0, -4);
        let checksum = addy.slice(-4);
        let new_checksum;
        if (version === 56 || version === 0) {
            new_checksum = sha256(sha256(body)).slice(0, 4);
        } else {
            new_checksum = ripemd160(body).slice(0, 4);
        }
        if (!checksum.equals(new_checksum)) {
            throw new Error('Checksum did not match');
        }
        return new Address(addy);
    }

    static fromPublic(publicKey: PublicKey, compressed: boolean = true, version: number = 56): Address {
        const pub_buf = publicKey.toBuffer(compressed);
        const sha2 = sha256(pub_buf);
        const rep = ripemd160(sha2);
        const versionBuffer = Buffer.from([version]);
        const addr = Buffer.concat([versionBuffer, rep]);
        let check;
        if (version === 56 || version === 0) {
            check = sha256(sha256(addr)).slice(0, 4);
        } else {
            check = ripemd160(addr).slice(0, 4);
        }
        const buffer = Buffer.concat([addr, check]);
        return new Address(ripemd160(buffer));
    }

    toBuffer(): Buffer {
        return this.addy;
    }

    getVersion(): number {
        return this.addy[0];
    }

    toString(address_prefix: string = String(getConfig().get('address_prefix')) || 'STM'): string {
        // Always use ripemd160 checksum and STM prefix, as in original Steem-js
        const checksum = ripemd160(this.addy).slice(0, 4);
        const addy = Buffer.concat([this.addy, checksum]);
        return address_prefix + bs58.encode(addy);
    }
}
