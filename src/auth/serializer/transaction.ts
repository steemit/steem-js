import ByteBuffer from 'bytebuffer';
// import Long from 'long'; // Unused import - Long is used via ByteBuffer
import { PublicKey } from '../ecc/src/key_public';

/**
 * Serialize a transaction to binary format for Steem blockchain
 * This is a simplified implementation that handles the basic structure
 */
export function serializeTransaction(trx: unknown): Buffer {
    const bb = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    const trxObj = trx as Record<string, unknown>;
    
    // Write ref_block_num (uint16)
    bb.writeUint16((trxObj.ref_block_num as number) || 0);
    
    // Write ref_block_prefix (uint32)
    bb.writeUint32((trxObj.ref_block_prefix as number) || 0);
    
    // Write expiration (time_point_sec - uint32 seconds since epoch)
    // Match old-steem-js behavior: ensure UTC time and precision to seconds
    let expiration: number;
    if (typeof trxObj.expiration === 'string') {
        // If string doesn't end with 'Z', append it to ensure UTC time
        let expirationStr = trxObj.expiration;
        if (!expirationStr.endsWith('Z')) {
            expirationStr = expirationStr + 'Z';
        }
        const date = new Date(expirationStr);
        expiration = Math.floor(date.getTime() / 1000);
    } else if (typeof trxObj.expiration === 'number') {
        expiration = trxObj.expiration;
    } else {
        expiration = 0;
    }
    bb.writeUint32(expiration);
    
    // Write operations array
    const operations = (Array.isArray(trxObj.operations) ? trxObj.operations : []) as unknown[];
    bb.writeVarint32(operations.length);
    
    for (const op of operations) {
        serializeOperation(bb, op);
    }
    
    // Write extensions (set of future_extensions, which is void/empty)
    bb.writeVarint32(0); // Empty set
    
    // Write signatures array ONLY if explicitly present (for signed_transaction serialization)
    // Note: signatures are NOT included in digest calculation for signing
    if ('signatures' in trxObj) {
        const signatures = (Array.isArray(trxObj.signatures) ? trxObj.signatures : []) as unknown[];
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
function serializeOperation(bb: ByteBuffer, op: unknown): void {
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
function serializeOperationData(bb: ByteBuffer, opType: string, opData: unknown): void {
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
        case 'custom_json':
            serializeCustomJson(bb, opData);
            break;
        default:
            throw new Error(`Operation type ${opType} serialization not fully implemented`);
    }
}

/**
 * Serialize comment operation
 */
function serializeComment(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.parent_author || ''));
    writeString(bb, String(dataObj.parent_permlink || ''));
    writeString(bb, String(dataObj.author || ''));
    writeString(bb, String(dataObj.permlink || ''));
    writeString(bb, String(dataObj.title || ''));
    writeString(bb, String(dataObj.body || ''));
    writeString(bb, String(dataObj.json_metadata || '{}'));
}

/**
 * Serialize vote operation
 */
function serializeVote(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.voter || ''));
    writeString(bb, String(dataObj.author || ''));
    writeString(bb, String(dataObj.permlink || ''));
    bb.writeInt16((dataObj.weight as number) || 0);
}

/**
 * Serialize transfer operation
 */
function serializeTransfer(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    serializeAsset(bb, String(dataObj.amount || '0.000 STEEM'));
    writeString(bb, String(dataObj.memo || ''));
}

/**
 * Serialize account_create operation
 */
function serializeAccountCreate(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    serializeAsset(bb, String(dataObj.fee || '0.000 STEEM'));
    writeString(bb, String(dataObj.creator || ''));
    writeString(bb, String(dataObj.new_account_name || ''));
    serializeAuthority(bb, dataObj.owner);
    serializeAuthority(bb, dataObj.active);
    serializeAuthority(bb, dataObj.posting);
    
    // Serialize memo_key (public_key)
    // PublicKey.fromStringOrThrow returns a PublicKey object which has toBuffer
    // Or we can manually parse the string
    if (typeof dataObj.memo_key === 'string') {
        const pubKey = PublicKey.fromStringOrThrow(dataObj.memo_key);
        bb.append(pubKey.toBuffer());
    } else if (Buffer.isBuffer(dataObj.memo_key)) {
        bb.append(dataObj.memo_key);
    } else if (dataObj.memo_key && typeof (dataObj.memo_key as { toBuffer?: () => Buffer }).toBuffer === 'function') {
        bb.append((dataObj.memo_key as { toBuffer: () => Buffer }).toBuffer());
    } else {
        throw new Error('Invalid memo_key format');
    }
    
    writeString(bb, String(dataObj.json_metadata || ''));
}

/**
 * Serialize custom_json operation
 */
function serializeCustomJson(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    
    // Serialize required_auths (flat_set<account_name_type>)
    // Set serialization: varint32 length, then each element
    const requiredAuths = Array.isArray(dataObj.required_auths) 
        ? (dataObj.required_auths as string[]).slice().sort() 
        : [];
    bb.writeVarint32(requiredAuths.length);
    for (const account of requiredAuths) {
        writeString(bb, String(account));
    }
    
    // Serialize required_posting_auths (flat_set<account_name_type>)
    const requiredPostingAuths = Array.isArray(dataObj.required_posting_auths) 
        ? (dataObj.required_posting_auths as string[]).slice().sort() 
        : [];
    bb.writeVarint32(requiredPostingAuths.length);
    for (const account of requiredPostingAuths) {
        writeString(bb, String(account));
    }
    
    // Serialize id (string)
    writeString(bb, String(dataObj.id || ''));
    
    // Serialize json (string)
    writeString(bb, String(dataObj.json || '{}'));
}

/**
 * Serialize Authority
 */
function serializeAuthority(bb: ByteBuffer, auth: unknown): void {
    const authObj = auth as Record<string, unknown>;
    bb.writeUint32((authObj.weight_threshold as number) || 1);
    
    // Account auths (map<string, uint16>)
    const accountAuths = (Array.isArray(authObj.account_auths) ? authObj.account_auths : []) as unknown[][];
    // Maps in Steem serialization are sorted by key
    const accountAuthsArray = accountAuths as unknown[][];
    accountAuthsArray.sort((a: unknown[], b: unknown[]) => {
      const aKey = Array.isArray(a) && a[0] ? String(a[0]) : '';
      const bKey = Array.isArray(b) && b[0] ? String(b[0]) : '';
      return aKey.localeCompare(bKey);
    });
    
    bb.writeVarint32(accountAuths.length);
    for (const authEntry of accountAuths) {
        if (Array.isArray(authEntry) && authEntry.length >= 2) {
            writeString(bb, String(authEntry[0]));
            bb.writeUint16(authEntry[1] as number);
        }
    }
    
    // Key auths (map<public_key, uint16>)
    const keyAuths = (Array.isArray(authObj.key_auths) ? authObj.key_auths : []) as unknown[][];
    // Maps in Steem serialization are sorted by key (public key string)
    // But serialized as bytes. Usually sorting by string representation of public key works.
    const keyAuthsArray = keyAuths as unknown[][];
    keyAuthsArray.sort((a: unknown[], b: unknown[]) => {
      const aKey = Array.isArray(a) && a[0] ? String(a[0]) : '';
      const bKey = Array.isArray(b) && b[0] ? String(b[0]) : '';
      return aKey.localeCompare(bKey);
    });
    
    bb.writeVarint32(keyAuths.length);
    for (const keyAuth of keyAuths) {
        if (Array.isArray(keyAuth) && keyAuth.length >= 2) {
            const keyStr = String(keyAuth[0]);
            const weight = keyAuth[1] as number;
        const pubKey = PublicKey.fromStringOrThrow(keyStr);
        bb.append(pubKey.toBuffer());
        bb.writeUint16(weight);
        }
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
