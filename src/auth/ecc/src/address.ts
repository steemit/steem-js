import { ripemd160, sha256 } from './hash';
import { getConfig } from '../../../config';
import bs58 from 'bs58';
import { PublicKey } from './key_public';

export class Address {
    private addy: Buffer;

    constructor(addy: Buffer) {
        this.addy = addy;
    }

    static fromBuffer(buffer: Buffer): string {
        const checksum = buffer.slice(-4);
        const addr = buffer.slice(0, -4);
        const new_checksum = ripemd160(addr).slice(0, 4);
        if (!checksum.equals(new_checksum as Buffer)) {
            throw new Error('Invalid address checksum');
        }
        return getConfig().get('address_prefix') + bs58.encode(addr);
    }

    static fromString(address: string): Buffer {
        const prefix = getConfig().get('address_prefix');
        if (!address.startsWith(prefix)) {
            throw new Error(`Expecting address to begin with ${prefix}`);
        }
        const addr = address.slice(prefix.length);
        const buffer = bs58.decode(addr);
        const checksum = buffer.slice(-4);
        const addr_part = buffer.slice(0, -4);
        const new_checksum = ripemd160(addr_part).slice(0, 4);
        if (!checksum.equals(new_checksum as Buffer)) {
            throw new Error('Invalid address checksum');
        }
        return buffer;
    }

    static fromPublicKey(public_key: PublicKey, compressed: boolean = true): string {
        const pub_buffer = public_key.toBuffer(compressed);
        const checksum = ripemd160(pub_buffer).slice(0, 4);
        const addr = Buffer.concat([pub_buffer, checksum as Buffer]);
        return getConfig().get('address_prefix') + bs58.encode(addr);
    }

    static fromPublic(public_key: PublicKey, compressed: boolean = true, version: number = 56): Address {
        const sha2 = sha256(public_key.toBuffer(compressed));
        const rep = ripemd160(sha2);
        const versionBuffer = Buffer.alloc(1);
        versionBuffer.writeUInt8(0xFF & version, 0);
        const addr = Buffer.concat([versionBuffer, rep]);
        let check = sha256(addr);
        check = sha256(check);
        const buffer = Buffer.concat([addr, check.slice(0, 4)]);
        return new Address(ripemd160(buffer));
    }

    static toBuffer(address: string): Buffer {
        return Address.fromString(address);
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
