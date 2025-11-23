import { PrivateKey } from '../auth/ecc/src/key_private';
import { PublicKey } from '../auth/ecc/src/key_public';
import { Aes } from '../auth/ecc/src/aes';
import bs58 from 'bs58';
import ByteBuffer from 'bytebuffer';
import { Serializer, EncryptedMemo } from '../auth/serializer';

export interface MemoData {
    from: string;
    to: string;
    nonce: string;
    check: number;
    encrypted: string;
}

function toPrivateObj(o: string | PrivateKey | null): PrivateKey | null {
    if (!o) return null;
    return typeof o === 'string' ? PrivateKey.fromWif(o) : o;
}

function toPublicObj(o: string | PublicKey | null): PublicKey | null {
    if (!o) return null;
    try {
        return typeof o === 'string' ? PublicKey.fromString(o) : o;
    } catch (e) {
        console.error('Failed to parse public key:', e);
        return null;
    }
}

export function encode(
    private_key: string | PrivateKey | null,
    public_key: string | PublicKey | null,
    memo: string,
    testNonce?: string
): string {
    if (!memo || typeof memo !== 'string' || !memo.startsWith('#')) {
        return memo;
    }

    const plain = memo.substring(1);

    if (!private_key || !public_key) {
        return memo;
    }

    const privateKey = toPrivateObj(private_key);
    const publicKey = toPublicObj(public_key);

    if (!privateKey || !publicKey) {
        return memo;
    }

    const mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    mbuf.writeVString(plain);
    const message = Buffer.from(mbuf.copy(0, mbuf.offset).toBinary(), 'binary');

    const { nonce, message: encrypted, checksum } = Aes.encrypt(privateKey, publicKey, message, testNonce);

    const memoData: EncryptedMemo = {
        from: privateKey.toPublicKey(),
        to: publicKey,
        nonce,
        check: checksum,
        encrypted
    };

    const serialized = Serializer.toBuffer(memoData);
    return '#' + bs58.encode(serialized);
}

export function decode(
    private_key: string | PrivateKey | null,
    memo: string
): string {
    if (!memo || typeof memo !== 'string') {
        return memo;
    }

    if (!memo.startsWith('#')) {
        return memo;
    }

    memo = memo.substring(1);

    if (!private_key) {
        return '#' + memo;
    }

    const privateKey = toPrivateObj(private_key);
    if (!privateKey) {
        return '#' + memo;
    }

    try {
        const decoded = bs58.decode(memo);
        const memoData = Serializer.fromBuffer(Buffer.from(decoded));

        const { from, to, nonce, check, encrypted } = memoData;
        const pubkey = privateKey.toPublicKey().toString();
        const otherpub = pubkey === from.toString() ? to : from;

        const decrypted = Aes.decrypt(privateKey, otherpub, nonce, encrypted, check);

        const mbuf = ByteBuffer.fromBinary(decrypted.toString('binary'), ByteBuffer.LITTLE_ENDIAN);
        try {
            mbuf.mark();
            return '#' + mbuf.readVString();
        } catch (e) {
            mbuf.reset();
            // Sender did not length-prefix the memo
            const memo = Buffer.from(mbuf.toString('binary'), 'binary').toString('utf-8');
            return '#' + memo;
        }
    } catch (e) {
        console.error('Memo decode failed:', e);
        return '#' + memo;
    }
} 