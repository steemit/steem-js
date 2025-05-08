import { PrivateKey } from './key_private';
import { sha256 } from './hash';
import { randomBytes } from 'crypto';

// hash for .25 second
const HASH_POWER_MILLS = 250;

let entropyPos = 0, entropyCount = 0;
const entropyArray = randomBytes(101);

export const key_utils = {
    addEntropy(...ints: number[]) {
        entropyCount++;
        for (const i of ints) {
            const pos = entropyPos++ % 101;
            const i2 = entropyArray[pos] += i;
            if (i2 > 9007199254740991) {
                entropyArray[pos] = 0;
            }
        }
    },

    /**
     * A week random number generator can run out of entropy. This should ensure even the worst random number implementation will be reasonably safe.
     * @param entropy string entropy of at least 32 bytes
     */
    random32ByteBuffer(entropy: string = key_utils.browserEntropy()): Buffer {
        if (typeof entropy !== 'string') {
            throw new Error("string required for entropy");
        }

        if (entropy.length < 32) {
            throw new Error("expecting at least 32 bytes of entropy");
        }

        const start_t = Date.now();

        while (Date.now() - start_t < HASH_POWER_MILLS) {
            entropy = sha256(Buffer.from(entropy, 'hex')).toString('hex');
        }

        const hash_array: Buffer[] = [];
        hash_array.push(Buffer.from(entropy, 'hex'));

        // Hashing for 1 second may helps the computer is not low on entropy (this method may be called back-to-back).
        hash_array.push(randomBytes(32));

        return sha256(Buffer.concat(hash_array));
    },

    get_random_key(entropy: string): PrivateKey {
        return PrivateKey.fromBuffer(key_utils.random32ByteBuffer(entropy));
    },

    browserEntropy(): string {
        const entropy = [
            Date.now(),
            Math.random(),
            entropyCount,
            entropyPos,
            entropyArray[entropyPos % 101]
        ].join('');
        return sha256(Buffer.from(entropy)).toString('hex');
    }
};
