import createHash from 'create-hash';
import createHmac from 'create-hmac';

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
export function sha1(data: string | Buffer, encoding?: BufferEncoding): string | Buffer {
    return createHash('sha1').update(data).digest(encoding);
}

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
export function sha256(data: string | Buffer, encoding?: BufferEncoding): Buffer {
    if (encoding) {
        return Buffer.from(createHash('sha256').update(data).digest(encoding));
    }
    return createHash('sha256').update(data).digest();
}

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
export function sha512(data: string | Buffer, encoding?: BufferEncoding): Buffer {
    if (encoding) {
        return Buffer.from(createHash('sha512').update(data).digest(encoding));
    }
    return createHash('sha512').update(data).digest();
}

export function HmacSHA256(buffer: Buffer, secret: Buffer): Buffer {
    return createHmac('sha256', secret).update(buffer).digest();
}

export function ripemd160(data: string | Buffer): Buffer {
    return createHash('rmd160').update(data).digest();
}

export default {
    sha1,
    sha256,
    sha512,
    HmacSHA256,
    ripemd160
}; 