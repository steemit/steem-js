import { sha1 as nobleSha1, ripemd160 as nobleRipemd160 } from '@noble/hashes/legacy';
import { sha256 as nobleSha256, sha512 as nobleSha512 } from '@noble/hashes/sha2';
import { hmac } from '@noble/hashes/hmac';

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
export function sha1(data: string | Buffer, encoding?: BufferEncoding): string | Buffer {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = nobleSha1(input);
    if (encoding) {
        return Buffer.from(hash).toString(encoding);
    }
    return Buffer.from(hash);
}

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
export function sha256(data: string | Buffer): Buffer;
export function sha256(data: string | Buffer, encoding: BufferEncoding): string;
export function sha256(data: string | Buffer, encoding?: BufferEncoding): string | Buffer {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = nobleSha256(input);
    if (encoding) {
        return Buffer.from(hash).toString(encoding);
    }
    return Buffer.from(hash);
}

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
export function sha512(data: string | Buffer): Buffer;
export function sha512(data: string | Buffer, encoding: BufferEncoding): string;
export function sha512(data: string | Buffer, encoding?: BufferEncoding): string | Buffer {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = nobleSha512(input);
    if (encoding) {
        return Buffer.from(hash).toString(encoding);
    }
    return Buffer.from(hash);
}

export function HmacSHA256(buffer: Buffer, secret: Buffer): Buffer {
    return Buffer.from(hmac(nobleSha256, secret, buffer));
}

export function ripemd160(data: string | Buffer): Buffer {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return Buffer.from(nobleRipemd160(input));
}

export default {
    sha1,
    sha256,
    sha512,
    HmacSHA256,
    ripemd160
}; 