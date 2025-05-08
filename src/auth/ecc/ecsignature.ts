import enforce from './enforce_types';
import BigInteger from 'bigi';

export default class ECSignature {
    r: BigInteger;
    s: BigInteger;

    constructor(r: BigInteger, s: BigInteger) {
        enforce(BigInteger, r);
        enforce(BigInteger, s);

        this.r = r;
        this.s = s;
    }

    static parseCompact(buffer: Buffer): { compressed: boolean; i: number; signature: ECSignature } {
        if (buffer.length !== 65) throw new Error('Invalid signature length');
        
        let i = buffer.readUInt8(0) - 27;
        if ((i & 7) !== i) throw new Error('Invalid signature parameter');
        
        const compressed = !!(i & 4);
        i = i & 3;

        const r = BigInteger.fromBuffer(buffer.slice(1, 33));
        const s = BigInteger.fromBuffer(buffer.slice(33));

        return {
            compressed,
            i,
            signature: new ECSignature(r, s)
        };
    }

    static fromDER(buffer: Buffer): ECSignature {
        if (buffer.readUInt8(0) !== 0x30) throw new Error('Not a DER sequence');
        if (buffer.readUInt8(1) !== buffer.length - 2) throw new Error('Invalid sequence length');
        if (buffer.readUInt8(2) !== 0x02) throw new Error('Expected a DER integer');

        const rLen = buffer.readUInt8(3);
        if (rLen === 0) throw new Error('R length is zero');

        let offset = 4 + rLen;
        if (buffer.readUInt8(offset) !== 0x02) throw new Error('Expected a DER integer (2)');

        const sLen = buffer.readUInt8(offset + 1);
        if (sLen === 0) throw new Error('S length is zero');

        const rB = buffer.slice(4, offset);
        const sB = buffer.slice(offset + 2);
        offset += 2 + sLen;

        if (rLen > 1 && rB.readUInt8(0) === 0x00) {
            if (!(rB.readUInt8(1) & 0x80)) throw new Error('R value excessively padded');
        }

        if (sLen > 1 && sB.readUInt8(0) === 0x00) {
            if (!(sB.readUInt8(1) & 0x80)) throw new Error('S value excessively padded');
        }

        if (offset !== buffer.length) throw new Error('Invalid DER encoding');

        const r = BigInteger.fromBuffer(rB);
        const s = BigInteger.fromBuffer(sB);

        if (r.signum() < 0) throw new Error('R value is negative');
        if (s.signum() < 0) throw new Error('S value is negative');

        return new ECSignature(r, s);
    }

    static parseScriptSignature(buffer: Buffer): { signature: ECSignature; hashType: number } {
        const hashType = buffer.readUInt8(buffer.length - 1);
        const hashTypeMod = hashType & ~0x80;

        if (hashTypeMod <= 0x00 || hashTypeMod >= 0x04) throw new Error('Invalid hashType');

        return {
            signature: ECSignature.fromDER(buffer.slice(0, -1)),
            hashType
        };
    }

    toCompact(i: number, compressed: boolean): Buffer {
        if (compressed) i += 4;
        i += 27;

        const buffer = Buffer.alloc(65);
        buffer.writeUInt8(i, 0);

        this.r.toBuffer(32).copy(buffer, 1);
        this.s.toBuffer(32).copy(buffer, 33);

        return buffer;
    }

    toDER(): Buffer {
        const rBa = this.r.toBuffer();
        const sBa = this.s.toBuffer();

        const sequence: number[] = [];

        // INTEGER
        sequence.push(0x02, rBa.length);
        Array.from(rBa).forEach(b => sequence.push(b));

        // INTEGER
        sequence.push(0x02, sBa.length);
        Array.from(sBa).forEach(b => sequence.push(b));

        // SEQUENCE
        sequence.unshift(0x30, sequence.length);

        return Buffer.from(sequence);
    }

    toScriptSignature(hashType: number): Buffer {
        const hashTypeBuffer = Buffer.alloc(1);
        hashTypeBuffer.writeUInt8(hashType, 0);

        return Buffer.concat([this.toDER(), hashTypeBuffer]);
    }
} 