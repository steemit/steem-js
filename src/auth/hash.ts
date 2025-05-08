import { createHash } from 'crypto';

export function sha256(data: Buffer): Buffer {
    return createHash('sha256').update(data).digest();
}

export function sha512(data: Buffer): Buffer {
    return createHash('sha512').update(data).digest();
}

export function ripemd160(data: Buffer): Buffer {
    return createHash('ripemd160').update(data).digest();
} 