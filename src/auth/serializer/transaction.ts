import ByteBuffer from 'bytebuffer';
import Long from 'long';

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
    // For now, we'll use a simple mapping. In a full implementation,
    // this would use the static_variant index
    const opTypeIndex = getOperationTypeIndex(opType);
    bb.writeVarint32(opTypeIndex);
    
    // Serialize operation data based on type
    serializeOperationData(bb, opType, opData);
}

/**
 * Get operation type index based on Steem blockchain operation order
 * This matches the operation.st_operations array from the blockchain
 */
function getOperationTypeIndex(opType: string): number {
    // Operation type indices based on Steem blockchain operation.st_operations
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
        default:
            // For other operations, try to serialize common fields
            // This is a fallback and may not work for all operations
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
 * Serialize transfer operation (simplified - asset serialization is complex)
 */
function serializeTransfer(bb: ByteBuffer, data: any): void {
    writeString(bb, data.from || '');
    writeString(bb, data.to || '');
    // Asset serialization is complex and requires parsing amount string
    // For now, this is a placeholder
    serializeAsset(bb, data.amount || '0.000 STEEM');
    writeString(bb, data.memo || '');
}

/**
 * Serialize asset (simplified - full implementation is complex)
 */
function serializeAsset(bb: ByteBuffer, amount: string): void {
    // Parse amount string like "1.000 STEEM"
    const parts = amount.split(' ');
    const valueStr = parts[0] || '0.000';
    const symbol = parts[1] || 'STEEM';
    
    // Parse decimal value
    const [intPart, decPart = ''] = valueStr.split('.');
    const precision = decPart.length;
    const amountValue = parseInt(intPart + decPart.padEnd(precision, '0'), 10);
    
    // Write amount as int64
    const amountLong = Long.fromNumber(amountValue, false);
    bb.writeInt64(amountLong);
    
    // Write precision and symbol (uint8 + 7 bytes)
    bb.writeUint8(precision);
    const symbolBytes = Buffer.from(symbol, 'utf8');
    bb.append(symbolBytes);
    // Pad to 7 bytes
    for (let i = symbolBytes.length; i < 7; i++) {
        bb.writeUint8(0);
    }
}

/**
 * Write a string using ByteBuffer's writeVString method
 * This matches the old implementation exactly
 */
function writeString(bb: ByteBuffer, str: string): void {
    bb.writeVString(str);
}

