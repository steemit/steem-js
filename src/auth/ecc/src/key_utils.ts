import { PrivateKey } from './key_private';
import * as hash from './hash';
import secureRandom from 'secure-random';

// hash for .25 second
const HASH_POWER_MILLS = 250;

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
 * A weak random number generator can run out of entropy.  This should ensure even the worst random number implementation will be reasonably safe.
 * @param entropy string entropy of at least 32 bytes
 */
export function random32ByteBuffer(entropy: string = browserEntropy()): Buffer {
    if (typeof entropy !== 'string') {
        throw new Error("string required for entropy");
    }

    if (entropy.length < 32) {
        throw new Error("expecting at least 32 bytes of entropy");
    }

    const start_t = Date.now();

    while (Date.now() - start_t < HASH_POWER_MILLS) {
        entropy = hash.sha256(entropy).toString('hex');
    }

    const hash_array: Buffer[] = [];
    hash_array.push(Buffer.from(entropy));

    // Hashing for 1 second may help if the computer is low on entropy (this method may be called back-to-back).
    hash_array.push(secureRandom.randomBuffer(32));

    return hash.sha256(Buffer.concat(hash_array)) as Buffer;
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
    } catch (error) {
        // nodejs: ReferenceError: window is not defined
        entropyStr += hash.sha256((new Date()).toString()).toString('hex');
    }

    const b = Buffer.from(entropyStr);
    entropyStr += b.toString('binary') + " " + (new Date()).toString();
    return entropyStr;
} 