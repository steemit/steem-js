import ByteBuffer from 'bytebuffer';
// import Long from 'long'; // Unused import - Long is used via ByteBuffer
import { PublicKey } from '../ecc/src/key_public';

/**
 * Serialize a transaction to binary format for Steem blockchain
 * This is a simplified implementation that handles the basic structure
 */
export function serializeTransaction(trx: any): Buffer {
    const bb = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    
    // Write ref_block_num (uint16)
    bb.writeUint16(trx.ref_block_num || 0);
    
    // Write ref_block_prefix (uint32)
    bb.writeUint32(trx.ref_block_prefix || 0);
    
    // Write expiration (time_point_sec - uint32 seconds since epoch)
    // Match old-steem-js behavior: ensure UTC time and precision to seconds
    let expiration: number;
    if (typeof trx.expiration === 'string') {
        // If string doesn't end with 'Z', append it to ensure UTC time
        let expirationStr = trx.expiration;
        if (!expirationStr.endsWith('Z')) {
            expirationStr = expirationStr + 'Z';
        }
        const date = new Date(expirationStr);
        expiration = Math.floor(date.getTime() / 1000);
    } else if (typeof trx.expiration === 'number') {
        expiration = trx.expiration;
    } else {
        expiration = 0;
    }
    bb.writeUint32(expiration);
    
    // Write operations array
    const operations = trx.operations || [];
    bb.writeVarint32(operations.length);
    
    for (const op of operations) {
        serializeOperation(bb, op);
    }
    
    // Write extensions (set of future_extensions, which is void/empty)
    bb.writeVarint32(0); // Empty set
    
    // Write signatures array ONLY if explicitly present (for signed_transaction serialization)
    // Note: signatures are NOT included in digest calculation for signing
    if (trx.hasOwnProperty('signatures')) {
        const signatures = trx.signatures || [];
        bb.writeVarint32(signatures.length);
        for (const sig of signatures) {
            // Each signature should be a Buffer or hex string
            if (typeof sig === 'string') {
                const sigBuffer = Buffer.from(sig, 'hex');
                bb.append(sigBuffer);
            } else if (Buffer.isBuffer(sig)) {
                bb.append(sig);
            } else {
                throw new Error('Invalid signature format');
            }
        }
    }
    
    bb.flip();
    return Buffer.from(bb.toBuffer());
}

/**
 * Serialize an operation to binary format
 */
function serializeOperation(bb: ByteBuffer, op: any): void {
    if (!Array.isArray(op) || op.length !== 2) {
        throw new Error('Operation must be an array of [operation_type, operation_data]');
    }
    
    const [opType, opData] = op;
    
    // Write operation type index (varint32)
    const opTypeIndex = getOperationTypeIndex(opType);
    bb.writeVarint32(opTypeIndex);
    
    // Serialize operation data based on type
    serializeOperationData(bb, opType, opData);
}

/**
 * Get operation type index based on Steem blockchain operation order
 */
function getOperationTypeIndex(opType: string): number {
    const opMap: Record<string, number> = {
        'vote': 0,
        'comment': 1,
        'transfer': 2,
        'transfer_to_vesting': 3,
        'withdraw_vesting': 4,
        'limit_order_create': 5,
        'limit_order_cancel': 6,
        'feed_publish': 7,
        'convert': 8,
        'account_create': 9,
        'account_update': 10,
        'witness_update': 11,
        'account_witness_vote': 12,
        'account_witness_proxy': 13,
        'pow': 14,
        'custom': 15,
        'delete_comment': 17,
        'custom_json': 18,
        'comment_options': 19,
    };
    
    const index = opMap[opType];
    if (index === undefined) {
        throw new Error(`Unknown operation type: ${opType}. Please add it to the operation map.`);
    }
    return index;
}

/**
 * Serialize operation data based on operation type
 */
function serializeOperationData(bb: ByteBuffer, opType: string, opData: any): void {
    switch (opType) {
        case 'comment':
            serializeComment(bb, opData);
            break;
        case 'vote':
            serializeVote(bb, opData);
            break;
        case 'transfer':
            serializeTransfer(bb, opData);
            break;
        case 'account_create':
            serializeAccountCreate(bb, opData);
            break;
        default:
            throw new Error(`Operation type ${opType} serialization not fully implemented`);
    }
}

/**
 * Serialize comment operation
 */
function serializeComment(bb: ByteBuffer, data: any): void {
    writeString(bb, data.parent_author || '');
    writeString(bb, data.parent_permlink || '');
    writeString(bb, data.author || '');
    writeString(bb, data.permlink || '');
    writeString(bb, data.title || '');
    writeString(bb, data.body || '');
    writeString(bb, data.json_metadata || '{}');
}

/**
 * Serialize vote operation
 */
function serializeVote(bb: ByteBuffer, data: any): void {
    writeString(bb, data.voter || '');
    writeString(bb, data.author || '');
    writeString(bb, data.permlink || '');
    bb.writeInt16(data.weight || 0);
}

/**
 * Serialize transfer operation
 */
function serializeTransfer(bb: ByteBuffer, data: any): void {
    writeString(bb, data.from || '');
    writeString(bb, data.to || '');
    serializeAsset(bb, data.amount || '0.000 STEEM');
    writeString(bb, data.memo || '');
}

/**
 * Serialize account_create operation
 */
function serializeAccountCreate(bb: ByteBuffer, data: any): void {
    serializeAsset(bb, data.fee || '0.000 STEEM');
    writeString(bb, data.creator || '');
    writeString(bb, data.new_account_name || '');
    serializeAuthority(bb, data.owner);
    serializeAuthority(bb, data.active);
    serializeAuthority(bb, data.posting);
    
    // Serialize memo_key (public_key)
    // PublicKey.fromStringOrThrow returns a PublicKey object which has toBuffer
    // Or we can manually parse the string
    if (typeof data.memo_key === 'string') {
        const pubKey = PublicKey.fromStringOrThrow(data.memo_key);
        bb.append(pubKey.toBuffer());
    } else if (Buffer.isBuffer(data.memo_key)) {
        bb.append(data.memo_key);
    } else if (data.memo_key && typeof data.memo_key.toBuffer === 'function') {
        bb.append(data.memo_key.toBuffer());
    } else {
        throw new Error('Invalid memo_key format');
    }
    
    writeString(bb, data.json_metadata || '');
}

/**
 * Serialize Authority
 */
function serializeAuthority(bb: ByteBuffer, auth: any): void {
    bb.writeUint32(auth.weight_threshold || 1);
    
    // Account auths (map<string, uint16>)
    const accountAuths = auth.account_auths || [];
    // Maps in Steem serialization are sorted by key
    accountAuths.sort((a: any[], b: any[]) => a[0].localeCompare(b[0]));
    
    bb.writeVarint32(accountAuths.length);
    for (const [name, weight] of accountAuths) {
        writeString(bb, name);
        bb.writeUint16(weight);
    }
    
    // Key auths (map<public_key, uint16>)
    const keyAuths = auth.key_auths || [];
    // Maps in Steem serialization are sorted by key (public key string)
    // But serialized as bytes. Usually sorting by string representation of public key works.
    keyAuths.sort((a: any[], b: any[]) => a[0].localeCompare(b[0]));
    
    bb.writeVarint32(keyAuths.length);
    for (const [keyStr, weight] of keyAuths) {
        const pubKey = PublicKey.fromStringOrThrow(keyStr);
        bb.append(pubKey.toBuffer());
        bb.writeUint16(weight);
    }
}

/**
 * Serialize asset (simplified)
 */
function serializeAsset(bb: ByteBuffer, amount: string): void {
    const parts = amount.split(' ');
    const valueStr = parts[0] || '0.000';
    const symbol = parts[1] || 'STEEM';
    
    const [intPart, decPart = ''] = valueStr.split('.');
    const precision = decPart.length;
    const amountValue = parseInt(intPart + decPart.padEnd(precision, '0'), 10) || 0;
    
    // ByteBuffer can accept number directly for small values
    bb.writeInt64(amountValue);
    
    bb.writeUint8(precision);
    const symbolBytes = Buffer.from(symbol, 'utf8');
    bb.append(symbolBytes);
    for (let i = symbolBytes.length; i < 7; i++) {
        bb.writeUint8(0);
    }
}

/**
 * Write a string using ByteBuffer's writeVString method
 */
function writeString(bb: ByteBuffer, str: string): void {
    bb.writeVString(str);
}
