import { createCipheriv, createDecipheriv } from 'crypto';
import { PrivateKey } from './key_private';
import { PublicKey } from './key_public';
import { sha256, sha512 } from './hash';
import ByteBuffer from 'bytebuffer';
import Long from 'long';

let uniqueNonceEntropy: number | null = null;

function sha512Buffer(data: string | Buffer): Buffer {
    const result = sha512(data);
    return Buffer.isBuffer(result) ? result : Buffer.from(result, 'hex');
}

export class Aes {
    static uniqueNonce(): string {
        if (uniqueNonceEntropy === null) {
            uniqueNonceEntropy = Math.floor(Math.random() * 0xFFFF);
        }
        let long = Long.fromNumber(Date.now());
        const entropy = ++uniqueNonceEntropy % 0xFFFF;
        long = long.shiftLeft(16).or(Long.fromNumber(entropy));
        return long.toString();
    }

    static encrypt(private_key: PrivateKey, public_key: PublicKey, message: Buffer | string, nonce: string = Aes.uniqueNonce()): { nonce: string; message: string; checksum: number } {
        if (!private_key) {
            throw new TypeError('private_key is required');
        }

        if (!public_key) {
            throw new TypeError('public_key is required');
        }

        if (!nonce) {
            throw new TypeError('nonce is required');
        }

        let messageBuffer: Buffer;
        if (!Buffer.isBuffer(message)) {
            if (typeof message !== 'string') {
                throw new TypeError('message should be buffer or string');
            }
            messageBuffer = Buffer.from(message, 'binary');
        } else {
            messageBuffer = message;
        }

        const S = private_key.get_shared_secret(public_key);
        let ebuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        ebuf.writeUint64(Long.fromString(nonce));
        ebuf.append(S.toString('binary'), 'binary');
        const ebufBuffer = Buffer.from(ebuf.copy(0, ebuf.offset).toBinary(), 'binary');
        const encryption_key = sha512Buffer(ebufBuffer);

        const iv = encryption_key.slice(32, 48);
        const key = encryption_key.slice(0, 32);

        let check = sha256(encryption_key);
        if (!Buffer.isBuffer(check)) {
            check = Buffer.from(check, 'hex');
        }
        check = check.slice(0, 4);
        const checkBinary = check.toString('binary');
        const cbuf = ByteBuffer.fromBinary(checkBinary, ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        const checksum = cbuf.readUint32();

        const cipher = createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([cipher.update(messageBuffer), cipher.final()]);

        return {
            nonce,
            message: encrypted.toString('hex'),
            checksum
        };
    }

    static decrypt(private_key: PrivateKey, public_key: PublicKey, nonce: string, message: string, checksum: number): Buffer {
        if (!private_key) {
            throw new TypeError('private_key is required');
        }

        if (!public_key) {
            throw new TypeError('public_key is required');
        }

        if (!nonce) {
            throw new TypeError('nonce is required');
        }

        if (!message) {
            throw new TypeError('message is required');
        }

        if (typeof checksum !== 'number') {
            throw new TypeError('checksum should be a number');
        }

        const S = private_key.get_shared_secret(public_key);
        let ebuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        ebuf.writeUint64(Long.fromString(nonce));
        ebuf.append(S.toString('binary'), 'binary');
        const ebufBuffer = Buffer.from(ebuf.copy(0, ebuf.offset).toBinary(), 'binary');
        const encryption_key = sha512Buffer(ebufBuffer);

        const iv = encryption_key.slice(32, 48);
        const key = encryption_key.slice(0, 32);

        let check = sha256(encryption_key);
        if (!Buffer.isBuffer(check)) {
            check = Buffer.from(check, 'hex');
        }
        check = check.slice(0, 4);
        const checkBinary = check.toString('binary');
        const cbuf = ByteBuffer.fromBinary(checkBinary, ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        const calculatedChecksum = cbuf.readUint32();

        if (calculatedChecksum !== checksum) {
            throw new Error('Invalid checksum');
        }

        const decipher = createDecipheriv('aes-256-cbc', key, iv);
        const messageBuffer = Buffer.from(message, 'hex');
        return Buffer.concat([decipher.update(messageBuffer), decipher.final()]);
    }

    static fromSeed(seed: string): Buffer {
        return sha256(seed);
    }

    static fromBuffer(buffer: Buffer): Buffer {
        return buffer;
    }

    static fromString(string: string): Buffer {
        return Buffer.from(string, 'hex');
    }

    static toBuffer(aes: Buffer): Buffer {
        return aes;
    }

    static toString(aes: Buffer): string {
        return aes.toString('hex');
    }
} 