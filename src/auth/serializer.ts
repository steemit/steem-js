import ByteBuffer from 'bytebuffer';
import Long from 'long';
import { PublicKey } from './ecc/src/key_public';

export interface EncryptedMemo {
    from: PublicKey;
    to: PublicKey;
    nonce: string;
    check: number;
    encrypted: string;
}

export class Serializer {
    static fromBuffer(buffer: Buffer): EncryptedMemo {
        const bb = ByteBuffer.fromBinary(buffer.toString('binary'), ByteBuffer.LITTLE_ENDIAN);
        
        // Read public keys
        const fromKey = PublicKey.fromBuffer(bb.readBytes(33).toBuffer());
        const toKey = PublicKey.fromBuffer(bb.readBytes(33).toBuffer());
        
        // Read nonce (uint64)
        const nonce = bb.readUint64().toString();
        
        // Read checksum (uint32)
        const check = bb.readUint32();
        
        // Read encrypted data
        const encryptedLength = bb.readVarint32();
        const encrypted = bb.readBytes(encryptedLength).toString('hex');
        
        return {
            from: fromKey,
            to: toKey,
            nonce,
            check,
            encrypted
        };
    }

    static toBuffer(memo: EncryptedMemo): Buffer {
        const bb = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        
        // Write public keys
        bb.append(memo.from.toBuffer());
        bb.append(memo.to.toBuffer());
        
        // Write nonce (uint64) - handle both string and number
        let nonceLong: Long;
        if (typeof memo.nonce === 'string') {
            // Use Long.fromString with unsigned flag for large numbers
            try {
                nonceLong = Long.fromString(memo.nonce, true, 10); // unsigned, base 10
            } catch (e) {
                // Fallback: try as number if string parsing fails
                const num = Number(memo.nonce);
                if (!isNaN(num) && isFinite(num)) {
                    nonceLong = Long.fromNumber(num, true); // unsigned
                } else {
                    throw new Error(`Invalid nonce format: ${memo.nonce}`);
                }
            }
        } else {
            nonceLong = Long.fromNumber(memo.nonce, true); // unsigned
        }
        // ByteBuffer.writeUint64 may not accept Long objects directly, so write manually
        const nonceBuf = Buffer.from(nonceLong.toBytesLE());
        bb.append(nonceBuf);
        
        // Write checksum (uint32)
        bb.writeUint32(memo.check);
        
        // Write encrypted data
        const encryptedBuffer = Buffer.from(memo.encrypted, 'hex');
        bb.writeVarint32(encryptedBuffer.length);
        bb.append(encryptedBuffer);
        
        bb.flip();
        return Buffer.from(bb.toBuffer());
    }
}

import { serializeTransaction as serializeTransactionBinary } from './serializer/transaction';

export const transaction = {
    toBuffer(trx: any): Buffer {
        // Use binary serialization for proper signature generation
        return serializeTransactionBinary(trx);
    }
};

export const signed_transaction = {
    toObject(trx: any): any {
        return trx;
    },
    toBuffer(trx: any): Buffer {
        return Buffer.from(JSON.stringify(trx));
    }
}; 