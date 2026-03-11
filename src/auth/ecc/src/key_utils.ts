import { PrivateKey } from './key_private';
import * as hash from './hash';
import secureRandom from 'secure-random';

let entropyPos = 0;
let entropyCount = 0;
const entropyArray = secureRandom.randomBuffer(101);

export function addEntropy(...ints: number[]): void {
    entropyCount++;
    for (const i of ints) {
        const pos = entropyPos++ % 101;
        const i2 = entropyArray[pos] += i;
        if (i2 > 9007199254740991) {
            entropyArray[pos] = 0;
        }
    }
}

/**
 * Cryptographically secure 32-byte random buffer.
 * Optionally mix in caller-provided entropy (e.g. from browser) via one-shot hash.
 * @param entropy optional string entropy of at least 32 bytes to mix in
 */
export function random32ByteBuffer(entropy?: string): Buffer {
    const randomPart = secureRandom.randomBuffer(32);

    if (entropy != null && typeof entropy === 'string' && entropy.length >= 32) {
        const entropySlice = Buffer.from(entropy.slice(0, 32), 'utf8');
        return hash.sha256(Buffer.concat([randomPart, entropySlice])) as Buffer;
    }

    return randomPart as Buffer;
}

export function get_random_key(entropy?: string): PrivateKey {
    return PrivateKey.fromBuffer(random32ByteBuffer(entropy));
}

export function browserEntropy(): string {
    let entropyStr = Array.from(entropyArray).join('');
    try {
        entropyStr += (new Date()).toString() + " " + window.screen.height + " " + window.screen.width + " " +
            window.screen.colorDepth + " " + " " + window.screen.availHeight + " " + window.screen.availWidth + " " +
            window.screen.pixelDepth + navigator.language + " " + window.location + " " + window.history.length;

        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            const mimeType = navigator.mimeTypes[i];
            entropyStr += mimeType.description + " " + mimeType.type + " " + mimeType.suffixes + " ";
        }
        console.log("INFO\tbrowserEntropy gathered", entropyCount, 'events');
    } catch {
        // nodejs: ReferenceError: window is not defined
        entropyStr += hash.sha256((new Date()).toString()).toString('hex');
    }

    const b = Buffer.from(entropyStr);
    entropyStr += b.toString('binary') + " " + (new Date()).toString();
    return entropyStr;
} 