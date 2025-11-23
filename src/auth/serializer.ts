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
        
        // Write nonce (uint64)
        bb.writeUint64(Long.fromString(memo.nonce));
        
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

export const transaction = {
    toBuffer(trx: any): Buffer {
        return Buffer.from(JSON.stringify(trx));
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