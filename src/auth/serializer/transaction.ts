import ByteBuffer from 'bytebuffer';
import { PublicKey } from '../ecc/src/key_public';
import { resolveAuthorityForSerialize } from '../account-update-chain';

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
 * Operation type index based on Steem blockchain operation order.
 *
 * Exported so the serializer-coverage test can assert that every operation type
 * known here also has a `serializeOperationData` case — an entry without a
 * serializer fails only at runtime, inside the browser, with
 * "Operation type <x> serialization not fully implemented" (that is exactly how
 * delegate_vesting_shares revocation broke in a client wallet).
 *
 * Indices follow the authoritative on-chain ordering: legacy steem-js 0.7
 * `operation.st_operations` (origin/legacy src/auth/serializer/src/operations.js)
 * and the C++ reference `libraries/protocol/include/steem/protocol/operations.hpp`.
 * Indices 48–65 include vote2 / smt_* placeholders and the virtual operations
 * (fill_*, author/curation/comment_reward, liquidity_reward, interest,
 * shutdown_witness). Everything from 56 on is virtual — clients never sign those;
 * the serializers below exist only so the byte encoding stays verifiable.
 * Indices 66+ (hardfork, comment_payout_update, return_vesting_delegation,
 * comment_benefactor_reward, producer_reward, ...) are omitted: all virtual,
 * never signed, and unsupported here.
 */
export const OPERATION_TYPE_INDEX: Readonly<Record<string, number>> = Object.freeze({
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
    'report_over_production': 16,
    'delete_comment': 17,
    'custom_json': 18,
    'comment_options': 19,
    'set_withdraw_vesting_route': 20,
    'limit_order_create2': 21,
    'claim_account': 22,
    'create_claimed_account': 23,
    'request_account_recovery': 24,
    'recover_account': 25,
    'change_recovery_account': 26,
    'escrow_transfer': 27,
    'escrow_dispute': 28,
    'escrow_release': 29,
    'pow2': 30,
    'escrow_approve': 31,
    'transfer_to_savings': 32,
    'transfer_from_savings': 33,
    'cancel_transfer_from_savings': 34,
    'custom_binary': 35,
    'decline_voting_rights': 36,
    'reset_account': 37,
    'set_reset_account': 38,
    'claim_reward_balance': 39,
    'delegate_vesting_shares': 40,
    'account_create_with_delegation': 41,
    'witness_set_properties': 42,
    'account_update2': 43,
    'create_proposal': 44,
    'update_proposal_votes': 45,
    'remove_proposal': 46,
    'claim_reward_balance2': 47,
    'vote2': 48,
    'smt_setup': 49,
    'smt_setup_emissions': 50,
    'smt_setup_ico_tier': 51,
    'smt_set_setup_parameters': 52,
    'smt_set_runtime_parameters': 53,
    'smt_create': 54,
    'smt_contribute': 55,
    'fill_convert_request': 56,
    'author_reward': 57,
    'curation_reward': 58,
    'comment_reward': 59,
    'liquidity_reward': 60,
    'interest': 61,
    'fill_vesting_withdraw': 62,
    'fill_order': 63,
    'shutdown_witness': 64,
    'fill_transfer_from_savings': 65,
});

/**
 * Operation types listed in the type-index map that intentionally have no
 * serializer:
 * - `report_over_production` was disabled on chain and its payload embeds two
 *   full signed_block_headers.
 * - `vote2` and the `smt_*` operations were never enabled on mainnet.
 * - `author_reward`, `curation_reward` and `shutdown_witness` are virtual
 *   operations: produced by the chain, never signed by a client.
 *
 * Everything else in the map must be serializable (enforced by
 * test/serializer-op-coverage.test.ts, both directions).
 */
export const UNSERIALIZED_OPERATION_TYPES: readonly string[] = Object.freeze([
    'report_over_production',
    'vote2',
    'smt_setup',
    'smt_setup_emissions',
    'smt_setup_ico_tier',
    'smt_set_setup_parameters',
    'smt_set_runtime_parameters',
    'smt_create',
    'smt_contribute',
    'author_reward',
    'curation_reward',
    'shutdown_witness',
]);

/**
 * Get operation type index based on Steem blockchain operation order
 */
function getOperationTypeIndex(opType: string): number {
    const index = OPERATION_TYPE_INDEX[opType];
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
        case 'account_update':
            serializeAccountUpdate(bb, opData);
            break;
        case 'account_create_with_delegation':
            serializeAccountCreateWithDelegation(bb, opData);
            break;
        case 'create_claimed_account':
            serializeCreateClaimedAccount(bb, opData);
            break;
        case 'account_update2':
            serializeAccountUpdate2(bb, opData);
            break;
        case 'request_account_recovery':
            serializeRequestAccountRecovery(bb, opData);
            break;
        case 'recover_account':
            serializeRecoverAccount(bb, opData);
            break;
        case 'change_recovery_account':
            serializeChangeRecoveryAccount(bb, opData);
            break;
        case 'reset_account':
            serializeResetAccount(bb, opData);
            break;
        case 'set_reset_account':
            serializeSetResetAccount(bb, opData);
            break;
        case 'decline_voting_rights':
            serializeDeclineVotingRights(bb, opData);
            break;
        case 'transfer_to_vesting':
            serializeTransferToVesting(bb, opData);
            break;
        case 'withdraw_vesting':
            serializeWithdrawVesting(bb, opData);
            break;
        case 'set_withdraw_vesting_route':
            serializeSetWithdrawVestingRoute(bb, opData);
            break;
        case 'transfer_to_savings':
            serializeTransferToSavings(bb, opData);
            break;
        case 'transfer_from_savings':
            serializeTransferFromSavings(bb, opData);
            break;
        case 'cancel_transfer_from_savings':
            serializeCancelTransferFromSavings(bb, opData);
            break;
        case 'limit_order_create':
            serializeLimitOrderCreate(bb, opData);
            break;
        case 'limit_order_create2':
            serializeLimitOrderCreate2(bb, opData);
            break;
        case 'limit_order_cancel':
            serializeLimitOrderCancel(bb, opData);
            break;
        case 'feed_publish':
            serializeFeedPublish(bb, opData);
            break;
        case 'convert':
            serializeConvert(bb, opData);
            break;
        case 'fill_order':
            serializeFillOrder(bb, opData);
            break;
        case 'escrow_transfer':
            serializeEscrowTransfer(bb, opData);
            break;
        case 'escrow_dispute':
            serializeEscrowDispute(bb, opData);
            break;
        case 'escrow_release':
            serializeEscrowRelease(bb, opData);
            break;
        case 'escrow_approve':
            serializeEscrowApprove(bb, opData);
            break;
        case 'claim_reward_balance':
            serializeClaimRewardBalance(bb, opData);
            break;
        case 'claim_reward_balance2':
            serializeClaimRewardBalance2(bb, opData);
            break;
        case 'comment_reward':
            serializeCommentReward(bb, opData);
            break;
        case 'liquidity_reward':
            serializeLiquidityReward(bb, opData);
            break;
        case 'interest':
            serializeInterest(bb, opData);
            break;
        case 'fill_vesting_withdraw':
            serializeFillVestingWithdraw(bb, opData);
            break;
        case 'fill_convert_request':
            serializeFillConvertRequest(bb, opData);
            break;
        case 'fill_transfer_from_savings':
            serializeFillTransferFromSavings(bb, opData);
            break;
        case 'pow':
            serializePow(bb, opData);
            break;
        case 'pow2':
            serializePow2(bb, opData);
            break;
        case 'witness_update':
            serializeWitnessUpdate(bb, opData);
            break;
        case 'witness_set_properties':
            serializeWitnessSetProperties(bb, opData);
            break;
        case 'account_witness_vote':
            serializeAccountWitnessVote(bb, opData);
            break;
        case 'account_witness_proxy':
            serializeAccountWitnessProxy(bb, opData);
            break;
        case 'custom':
            serializeCustom(bb, opData);
            break;
        case 'custom_binary':
            serializeCustomBinary(bb, opData);
            break;
        case 'comment_options':
            serializeCommentOptions(bb, opData);
            break;
        case 'custom_json':
            serializeCustomJson(bb, opData);
            break;
        case 'delete_comment':
            serializeDeleteComment(bb, opData);
            break;
        case 'claim_account':
            serializeClaimAccount(bb, opData);
            break;
        case 'delegate_vesting_shares':
            serializeDelegateVestingShares(bb, opData);
            break;
        case 'create_proposal':
            serializeCreateProposal(bb, opData);
            break;
        case 'update_proposal_votes':
            serializeUpdateProposalVotes(bb, opData);
            break;
        case 'remove_proposal':
            serializeRemoveProposal(bb, opData);
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
 * Serialize account_update_operation (steem_operations.hpp).
 * JSON fields: account, owner/active/posting (authority objects), memo_key, json_metadata (string).
 * Optional authorities use a presence byte before serializeAuthority.
 */
function serializeAccountUpdate(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));

    // Optional authorities: 0 = not present, 1 = present then serialize authority
    if (dataObj.owner != null && dataObj.owner !== '') {
        bb.writeUint8(1);
        serializeAuthority(bb, resolveAuthorityForSerialize(dataObj.owner, 'owner'));
    } else {
        bb.writeUint8(0);
    }
    if (dataObj.active != null && dataObj.active !== '') {
        bb.writeUint8(1);
        serializeAuthority(bb, resolveAuthorityForSerialize(dataObj.active, 'active'));
    } else {
        bb.writeUint8(0);
    }
    if (dataObj.posting != null && dataObj.posting !== '') {
        bb.writeUint8(1);
        serializeAuthority(bb, resolveAuthorityForSerialize(dataObj.posting, 'posting'));
    } else {
        bb.writeUint8(0);
    }

    // memo_key (public key, required)
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

    writeString(
        bb,
        typeof dataObj.json_metadata === 'string'
            ? dataObj.json_metadata
            : dataObj.json_metadata != null
              ? JSON.stringify(dataObj.json_metadata)
              : '',
    );
}

/**
 * Serialize account_create_with_delegation operation.
 * Fields (see FC_REFLECT): fee, delegation, creator, new_account_name,
 * owner, active, posting, memo_key, json_metadata, extensions.
 */
function serializeAccountCreateWithDelegation(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    serializeAsset(bb, String(dataObj.fee || '0.000 STEEM'));
    serializeAsset(bb, String(dataObj.delegation || '0.000 VESTS'));
    writeString(bb, String(dataObj.creator || ''));
    writeString(bb, String(dataObj.new_account_name || ''));
    serializeAuthority(bb, dataObj.owner);
    serializeAuthority(bb, dataObj.active);
    serializeAuthority(bb, dataObj.posting);
    const memoKey = String(dataObj.memo_key || '');
    const pubKey = PublicKey.fromStringOrThrow(memoKey);
    bb.append(pubKey.toBuffer());
    writeString(bb, String(dataObj.json_metadata || ''));
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize create_claimed_account operation.
 * Fields: creator, new_account_name, owner, active, posting,
 * memo_key, json_metadata, extensions.
 */
function serializeCreateClaimedAccount(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.creator || ''));
    writeString(bb, String(dataObj.new_account_name || ''));
    serializeAuthority(bb, dataObj.owner);
    serializeAuthority(bb, dataObj.active);
    serializeAuthority(bb, dataObj.posting);
    const memoKey = String(dataObj.memo_key || '');
    const pubKey = PublicKey.fromStringOrThrow(memoKey);
    bb.append(pubKey.toBuffer());
    writeString(bb, String(dataObj.json_metadata || ''));
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize account_update2 operation.
 * Fields: account, owner/active/posting (optional authority objects),
 * memo_key (optional public key), json_metadata, posting_json_metadata,
 * extensions.
 *
 * Unlike account_update, all three authorities AND memo_key are optional in
 * account_update2 — a metadata-only update (e.g. condenser profile settings)
 * carries none of them. Each absent optional serializes as a 0x00 presence
 * byte, matching legacy steem-js 0.7's optional() and the chain protocol.
 */
function serializeAccountUpdate2(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));

    // Optional authorities: 0 = not present, 1 = present then serialize authority
    // (same pattern as serializeAccountUpdate above).
    for (const field of ['owner', 'active', 'posting'] as const) {
        const auth = dataObj[field];
        if (auth != null && auth !== '') {
            bb.writeUint8(1);
            serializeAuthority(bb, resolveAuthorityForSerialize(auth, field));
        } else {
            bb.writeUint8(0);
        }
    }

    // Optional memo_key: 0 = not present, 1 = present then the 33-byte key.
    const memoKey = dataObj.memo_key;
    if (memoKey != null && memoKey !== '') {
        bb.writeUint8(1);
        const pubKey = PublicKey.fromStringOrThrow(String(memoKey));
        bb.append(pubKey.toBuffer());
    } else {
        bb.writeUint8(0);
    }

    writeString(bb, String(dataObj.json_metadata || ''));
    writeString(bb, String(dataObj.posting_json_metadata || ''));
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize request_account_recovery operation.
 * Fields: recovery_account, account_to_recover, new_owner_authority, extensions.
 */
function serializeRequestAccountRecovery(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.recovery_account || ''));
    writeString(bb, String(dataObj.account_to_recover || ''));
    serializeAuthority(bb, dataObj.new_owner_authority);
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize recover_account operation.
 * Fields: account_to_recover, new_owner_authority, recent_owner_authority, extensions.
 */
function serializeRecoverAccount(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account_to_recover || ''));
    serializeAuthority(bb, dataObj.new_owner_authority);
    serializeAuthority(bb, dataObj.recent_owner_authority);
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize change_recovery_account operation.
 * Fields: account_to_recover, new_recovery_account, extensions.
 */
function serializeChangeRecoveryAccount(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account_to_recover || ''));
    writeString(bb, String(dataObj.new_recovery_account || ''));
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize reset_account operation.
 * Fields: reset_account, account_to_reset, new_owner_authority.
 */
function serializeResetAccount(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.reset_account || ''));
    writeString(bb, String(dataObj.account_to_reset || ''));
    serializeAuthority(bb, dataObj.new_owner_authority);
}

/**
 * Serialize set_reset_account operation.
 * Fields: account, reset_account.
 */
function serializeSetResetAccount(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    writeString(bb, String(dataObj.reset_account || ''));
}

/**
 * Serialize decline_voting_rights operation.
 * Fields: account, decline.
 */
function serializeDeclineVotingRights(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    // C++ default: bool decline = true (steem_operations.hpp) — missing must throw.
    serializeBool(bb, dataObj.decline, 'decline_voting_rights.decline', { protocolDefault: true });
}

/**
 * Serialize transfer_to_vesting operation.
 * Fields: from, to, amount.
 */
function serializeTransferToVesting(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    serializeAsset(bb, String(dataObj.amount || '0.000 STEEM'));
}

/**
 * Serialize withdraw_vesting operation.
 * Fields: account, vesting_shares.
 */
function serializeWithdrawVesting(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    serializeAsset(bb, String(dataObj.vesting_shares || '0.000 VESTS'));
}

/**
 * Serialize set_withdraw_vesting_route operation.
 * Fields: from_account, to_account, percent, auto_vest.
 */
function serializeSetWithdrawVestingRoute(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from_account || ''));
    writeString(bb, String(dataObj.to_account || ''));
    // percent is uint16
    bb.writeUint16((dataObj.percent as number) ?? 0);
    serializeBool(bb, dataObj.auto_vest, 'set_withdraw_vesting_route.auto_vest', { protocolDefault: false });
}

/**
 * Serialize transfer_to_savings operation.
 * Fields: from, to, amount, memo.
 */
function serializeTransferToSavings(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    serializeAsset(bb, String(dataObj.amount || '0.000 STEEM'));
    writeString(bb, String(dataObj.memo || ''));
}

/**
 * Serialize transfer_from_savings operation.
 * Fields: from, request_id, to, amount, memo.
 */
function serializeTransferFromSavings(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    bb.writeUint32((dataObj.request_id as number) ?? (dataObj.requestID as number) ?? 0);
    writeString(bb, String(dataObj.to || ''));
    serializeAsset(bb, String(dataObj.amount || '0.000 STEEM'));
    writeString(bb, String(dataObj.memo || ''));
}

/**
 * Serialize cancel_transfer_from_savings operation.
 * Fields: from, request_id.
 */
function serializeCancelTransferFromSavings(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    bb.writeUint32((dataObj.request_id as number) ?? (dataObj.requestID as number) ?? 0);
}

/**
 * Serialize limit_order_create operation.
 * Fields: owner, orderid, amount_to_sell, min_to_receive, fill_or_kill, expiration.
 */
function serializeLimitOrderCreate(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    bb.writeUint32((dataObj.orderid as number) ?? 0);
    serializeAsset(bb, String(dataObj.amount_to_sell || '0.000 STEEM'));
    serializeAsset(bb, String(dataObj.min_to_receive || '0.000 STEEM'));
    serializeBool(bb, dataObj.fill_or_kill, 'limit_order_create.fill_or_kill', { protocolDefault: false });
    serializeTimePointSec(bb, dataObj.expiration, 'limit_order_create.expiration');
}

/**
 * Serialize limit_order_create2 operation.
 * Fields: owner, orderid, amount_to_sell, exchange_rate{base, quote}, fill_or_kill, expiration.
 */
function serializeLimitOrderCreate2(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    bb.writeUint32((dataObj.orderid as number) ?? 0);
    serializeAsset(bb, String(dataObj.amount_to_sell || '0.000 STEEM'));
    const rate = (dataObj.exchange_rate ?? dataObj.exchangeRate) as Record<string, unknown> | undefined;
    const base = rate?.base ?? '0.000 STEEM';
    const quote = rate?.quote ?? '0.000 SBD';
    serializeAsset(bb, String(base));
    serializeAsset(bb, String(quote));
    serializeBool(bb, dataObj.fill_or_kill, 'limit_order_create2.fill_or_kill', { protocolDefault: false });
    serializeTimePointSec(bb, dataObj.expiration, 'limit_order_create2.expiration');
}

/**
 * Serialize limit_order_cancel operation.
 * Fields: owner, orderid.
 */
function serializeLimitOrderCancel(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    bb.writeUint32((dataObj.orderid as number) ?? 0);
}

/**
 * Serialize feed_publish operation.
 * Fields: publisher, exchange_rate{base, quote}.
 */
function serializeFeedPublish(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.publisher || ''));
    const rate = (dataObj.exchange_rate ?? dataObj.exchangeRate) as Record<string, unknown> | undefined;
    const base = rate?.base ?? '0.000 STEEM';
    const quote = rate?.quote ?? '0.000 SBD';
    serializeAsset(bb, String(base));
    serializeAsset(bb, String(quote));
}

/**
 * Serialize convert operation.
 * Fields: owner, requestid, amount.
 */
function serializeConvert(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    bb.writeUint32((dataObj.requestid as number) ?? (dataObj.request_id as number) ?? 0);
    serializeAsset(bb, String(dataObj.amount || '0.000 STEEM'));
}

/**
 * Serialize fill_order operation (virtual).
 * Fields: current_owner, current_orderid, current_pays,
 *         open_owner, open_orderid, open_pays.
 */
function serializeFillOrder(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.current_owner || ''));
    bb.writeUint32((dataObj.current_orderid as number) ?? 0);
    serializeAsset(bb, String(dataObj.current_pays || '0.000 STEEM'));
    writeString(bb, String(dataObj.open_owner || ''));
    bb.writeUint32((dataObj.open_orderid as number) ?? 0);
    serializeAsset(bb, String(dataObj.open_pays || '0.000 STEEM'));
}

/**
 * Serialize escrow_transfer operation.
 * Fields: from, to, sbd_amount, steem_amount, escrow_id, agent,
 *         fee, json_meta, ratification_deadline, escrow_expiration.
 */
function serializeEscrowTransfer(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    serializeAsset(bb, String(dataObj.sbd_amount || '0.000 SBD'));
    serializeAsset(bb, String(dataObj.steem_amount || '0.000 STEEM'));
    bb.writeUint32((dataObj.escrow_id as number) ?? 0);
    writeString(bb, String(dataObj.agent || ''));
    serializeAsset(bb, String(dataObj.fee || '0.000 STEEM'));
    writeString(bb, String(dataObj.json_meta || ''));
    serializeTimePointSec(bb, dataObj.ratification_deadline, 'escrow_transfer.ratification_deadline');
    serializeTimePointSec(bb, dataObj.escrow_expiration, 'escrow_transfer.escrow_expiration');
}

/**
 * Serialize escrow_dispute operation.
 * Fields: from, to, who, escrow_id.
 */
function serializeEscrowDispute(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    writeString(bb, String(dataObj.who || ''));
    bb.writeUint32((dataObj.escrow_id as number) ?? 0);
}

/**
 * Serialize escrow_release operation.
 * Fields: from, to, who, escrow_id, sbd_amount, steem_amount.
 */
function serializeEscrowRelease(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    writeString(bb, String(dataObj.who || ''));
    bb.writeUint32((dataObj.escrow_id as number) ?? 0);
    serializeAsset(bb, String(dataObj.sbd_amount || '0.000 SBD'));
    serializeAsset(bb, String(dataObj.steem_amount || '0.000 STEEM'));
}

/**
 * Serialize escrow_approve operation.
 * Fields: from, to, agent, who, escrow_id, approve.
 */
function serializeEscrowApprove(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    writeString(bb, String(dataObj.agent || ''));
    writeString(bb, String(dataObj.who || ''));
    bb.writeUint32((dataObj.escrow_id as number) ?? 0);
    // C++ default: bool approve = true (steem_operations.hpp) — missing must throw.
    serializeBool(bb, dataObj.approve, 'escrow_approve.approve', { protocolDefault: true });
}

/**
 * Serialize claim_reward_balance operation.
 * Fields: account, reward_steem, reward_sbd, reward_vests.
 */
function serializeClaimRewardBalance(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    serializeAsset(bb, String(dataObj.reward_steem || '0.000 STEEM'));
    serializeAsset(bb, String(dataObj.reward_sbd || '0.000 SBD'));
    serializeAsset(bb, String(dataObj.reward_vests || '0.000000 VESTS'));
}

/**
 * Serialize claim_reward_balance2 operation.
 * Fields: account, extensions, reward_tokens (array of asset strings).
 */
function serializeClaimRewardBalance2(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    serializeExtensions(bb, dataObj.extensions);
    const tokens = Array.isArray(dataObj.reward_tokens) ? dataObj.reward_tokens : [];
    bb.writeVarint32(tokens.length);
    for (const tok of tokens) {
        serializeAsset(bb, typeof tok === 'string' ? tok : String(tok));
    }
}

/**
 * Serialize comment_reward operation.
 * Fields: author, permlink, payout.
 */
function serializeCommentReward(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.author || ''));
    writeString(bb, String(dataObj.permlink || ''));
    serializeAsset(bb, String(dataObj.payout || '0.000 STEEM'));
}

/**
 * Serialize liquidity_reward operation.
 * Fields: owner, payout.
 */
function serializeLiquidityReward(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    serializeAsset(bb, String(dataObj.payout || '0.000 STEEM'));
}

/**
 * Serialize interest operation.
 * Fields: owner, interest.
 */
function serializeInterest(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    serializeAsset(bb, String(dataObj.interest || '0.000 STEEM'));
}

/**
 * Serialize fill_vesting_withdraw operation.
 * Fields: from_account, to_account, withdrawn, deposited.
 */
function serializeFillVestingWithdraw(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from_account || ''));
    writeString(bb, String(dataObj.to_account || ''));
    serializeAsset(bb, String(dataObj.withdrawn || '0.000000 VESTS'));
    serializeAsset(bb, String(dataObj.deposited || '0.000 STEEM'));
}

/**
 * Serialize fill_convert_request operation.
 * Fields: owner, requestid, amount_in, amount_out.
 */
function serializeFillConvertRequest(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    bb.writeUint32((dataObj.requestid as number) ?? 0);
    serializeAsset(bb, String(dataObj.amount_in || '0.000 STEEM'));
    serializeAsset(bb, String(dataObj.amount_out || '0.000 STEEM'));
}

/**
 * Serialize fill_transfer_from_savings operation.
 * Fields: from, to, amount, request_id, memo.
 */
function serializeFillTransferFromSavings(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.from || ''));
    writeString(bb, String(dataObj.to || ''));
    serializeAsset(bb, String(dataObj.amount || '0.000 STEEM'));
    bb.writeUint32((dataObj.request_id as number) ?? 0);
    writeString(bb, String(dataObj.memo || ''));
}

/**
 * Serialize ChainProperties (used in pow, witness_update).
 * Fields: account_creation_fee (asset string), maximum_block_size (uint32), sbd_interest_rate (uint16).
 */
function serializeChainProperties(bb: ByteBuffer, props: unknown): void {
    const p = (props as Record<string, unknown>) || {};
    const fee = p.account_creation_fee;
    if (typeof fee === 'string' && fee.split(' ').length >= 2) {
        serializeAsset(bb, fee);
    } else {
        serializeAsset(bb, '0.000 STEEM');
    }
    bb.writeUint32((p.maximum_block_size as number) ?? 0);
    bb.writeUint16((p.sbd_interest_rate as number) ?? 0);
}

/**
 * Serialize POW inner struct (worker, input, signature, work).
 */
function serializePOWInner(bb: ByteBuffer, work: unknown): void {
    const w = (work as Record<string, unknown>) || {};
    writeString(bb, String(w.worker || ''));
    writeString(bb, String(w.input || ''));
    writeString(bb, String(w.signature || ''));
    writeString(bb, String(w.work || ''));
}

/**
 * Serialize pow operation.
 * Fields: worker_account, block_id, nonce (optional), work (POW), props (ChainProperties).
 */
function serializePow(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.worker_account || ''));
    writeString(bb, String(dataObj.block_id || ''));
    const nonce = dataObj.nonce;
    if (nonce !== undefined && nonce !== null) {
        bb.writeUint8(1);
        bb.writeUint64(Number(nonce));
    } else {
        bb.writeUint8(0);
    }
    serializePOWInner(bb, dataObj.work);
    serializeChainProperties(bb, dataObj.props);
}

/**
 * Serialize pow2 operation.
 * Fields: input, pow_summary (opaque bytes; if string treated as hex).
 */
function serializePow2(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.input || ''));
    const summary = dataObj.pow_summary;
    let bytes: Buffer;
    if (typeof summary === 'string') {
        const hex = summary.startsWith('0x') ? summary.slice(2) : summary;
        bytes = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(summary)) {
        bytes = summary;
    } else {
        bytes = Buffer.alloc(0);
    }
    bb.writeVarint32(bytes.length);
    bb.append(bytes);
}

/**
 * Serialize witness_update operation.
 * Fields: owner, url, block_signing_key, props (ChainProperties), fee.
 */
function serializeWitnessUpdate(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    writeString(bb, String(dataObj.url || ''));
    const key = dataObj.block_signing_key;
    if (typeof key === 'string') {
        const pubKey = PublicKey.fromStringOrThrow(key);
        bb.append(pubKey.toBuffer());
    } else if (Buffer.isBuffer(key)) {
        bb.append(key);
    } else if (key && typeof (key as { toBuffer?: () => Buffer }).toBuffer === 'function') {
        bb.append((key as { toBuffer: () => Buffer }).toBuffer());
    } else {
        bb.append(Buffer.alloc(33));
    }
    serializeChainProperties(bb, dataObj.props);
    serializeAsset(bb, String(dataObj.fee || '0.000 STEEM'));
}

/**
 * Serialize witness_set_properties operation.
 * Fields: owner, props (map string -> bytes), extensions.
 */
function serializeWitnessSetProperties(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.owner || ''));
    const props = dataObj.props as Record<string, string> | undefined;
    const keys = props ? Object.keys(props).sort() : [];
    bb.writeVarint32(keys.length);
    for (const k of keys) {
        writeString(bb, k);
        const v = props![k];
        const buf = typeof v === 'string' ? Buffer.from(v, 'utf8') : Buffer.isBuffer(v) ? v : Buffer.alloc(0);
        bb.writeVarint32(buf.length);
        bb.append(buf);
    }
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize account_witness_vote operation.
 * Fields: account, witness, approve.
 */
function serializeAccountWitnessVote(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    writeString(bb, String(dataObj.witness || ''));
    // C++ default: bool approve = true (steem_operations.hpp) — missing must throw.
    serializeBool(bb, dataObj.approve, 'account_witness_vote.approve', { protocolDefault: true });
}

/**
 * Serialize account_witness_proxy operation.
 * Fields: account, proxy.
 */
function serializeAccountWitnessProxy(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.account || ''));
    writeString(bb, String(dataObj.proxy || ''));
}

/**
 * Serialize custom operation (required_auths, id, data).
 * id is uint16 in protocol; data is bytes.
 */
function serializeCustom(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    const requiredAuths = Array.isArray(dataObj.required_auths)
        ? (dataObj.required_auths as string[]).slice().sort()
        : [];
    bb.writeVarint32(requiredAuths.length);
    for (const account of requiredAuths) {
        writeString(bb, String(account));
    }
    bb.writeUint16((dataObj.id as number) ?? 0);
    const dataBytes = dataObj.data;
    let buf: Buffer;
    if (typeof dataBytes === 'string') {
        const hex = dataBytes.startsWith('0x') ? dataBytes.slice(2) : dataBytes;
        buf = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(dataBytes)) {
        buf = dataBytes;
    } else {
        buf = Buffer.alloc(0);
    }
    bb.writeVarint32(buf.length);
    bb.append(buf);
}

/**
 * Serialize custom_binary operation.
 * Fields: id (string), data (bytes).
 */
function serializeCustomBinary(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.id || ''));
    const dataBytes = dataObj.data;
    let buf: Buffer;
    if (typeof dataBytes === 'string') {
        const hex = dataBytes.startsWith('0x') ? dataBytes.slice(2) : dataBytes;
        buf = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(dataBytes)) {
        buf = dataBytes;
    } else {
        buf = Buffer.alloc(0);
    }
    bb.writeVarint32(buf.length);
    bb.append(buf);
}

/**
 * Serialize comment_options operation.
 * Fields: author, permlink, max_accepted_payout, percent_steem_dollars, allow_votes, allow_curation_rewards, extensions.
 */
function serializeCommentOptions(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.author || ''));
    writeString(bb, String(dataObj.permlink || ''));
    serializeAsset(bb, String(dataObj.max_accepted_payout || '1000000.000 SBD'));
    bb.writeUint16((dataObj.percent_steem_dollars as number) ?? 0);
    // C++ defaults: allow_votes = true, allow_curation_rewards = true
    // (steem_operations.hpp) — missing must throw.
    serializeBool(bb, dataObj.allow_votes, 'comment_options.allow_votes', { protocolDefault: true });
    serializeBool(bb, dataObj.allow_curation_rewards, 'comment_options.allow_curation_rewards', { protocolDefault: true });
    serializeCommentOptionsExtensions(bb, dataObj.extensions);
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
 * Serialize delete_comment operation (op 17).
 * Fields: author, permlink.
 */
function serializeDeleteComment(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.author || ''));
    writeString(bb, String(dataObj.permlink || ''));
}

/**
 * Serialize claim_account operation (op 22).
 * Fields: creator, fee (asset), extensions (set<future_extensions>).
 */
function serializeClaimAccount(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.creator || ''));
    serializeAsset(bb, String(dataObj.fee || '0.000 STEEM'));
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize delegate_vesting_shares operation (op 40).
 * Fields: delegator, delegatee, vesting_shares (asset).
 *
 * Revoking a delegation is the same operation with vesting_shares set to
 * 0.000000 VESTS, which is why an unimplemented serializer here breaks both
 * "delegate" and "revoke delegation" in a wallet UI — and why a missing
 * vesting_shares must throw instead of defaulting: on this operation a zero
 * amount is a destructive action (full revocation), never a safe default.
 * A camelCase typo like `vestingShares` therefore fails loudly too.
 *
 * The value is additionally shape-validated op-locally: serializeAsset's
 * strict amount check turns a malformed amount like 'abc.000000 VESTS' into a
 * field-level error, and the op-local regex pins the field name in the
 * message. VESTS has precision 6 on chain, so the exact form
 * `<digits>.<6 digits> VESTS` is required — a decimal-less '10 VESTS' would
 * otherwise serialize at precision 0, signing 10 base units instead of 10
 * VESTS.
 */
function serializeDelegateVestingShares(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.delegator || ''));
    writeString(bb, String(dataObj.delegatee || ''));
    const vestingShares = dataObj.vesting_shares;
    if (vestingShares === undefined || vestingShares === null || vestingShares === '') {
        throw new Error(
            'delegate_vesting_shares.vesting_shares is required: a missing amount would silently sign a full delegation revocation. Pass an explicit asset string (use \'0.000000 VESTS\' to revoke).'
        );
    }
    if (typeof vestingShares !== 'string' || !/^\d+\.\d{6} VESTS$/.test(vestingShares)) {
        throw new Error(
            `Invalid delegate_vesting_shares.vesting_shares: expected a VESTS asset string with 6 decimals (e.g. '1000.000000 VESTS'), received ${JSON.stringify(vestingShares)}`
        );
    }
    serializeAsset(bb, vestingShares);
}

/**
 * Serialize create_proposal operation (op 44).
 * Fields: creator, receiver, start_date, end_date (time_point_sec),
 * daily_pay (asset), subject, permlink, extensions (set<future_extensions>).
 */
function serializeCreateProposal(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.creator || ''));
    writeString(bb, String(dataObj.receiver || ''));
    serializeTimePointSec(bb, dataObj.start_date, 'create_proposal.start_date');
    serializeTimePointSec(bb, dataObj.end_date, 'create_proposal.end_date');
    serializeAsset(bb, String(dataObj.daily_pay || '0.000 SBD'));
    writeString(bb, String(dataObj.subject || ''));
    writeString(bb, String(dataObj.permlink || ''));
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize update_proposal_votes operation (op 45).
 * Fields: voter, proposal_ids (flat_set_ex<int64_t>, written ascending),
 * approve (bool), extensions (set<future_extensions>).
 *
 * `approve` has no separate "unset" encoding: omitting it serializes as false,
 * which the chain reads as removing the vote. That matches the protocol's
 * `bool approve = false` default and this library's other bool fields, so
 * callers must pass it explicitly.
 */
function serializeUpdateProposalVotes(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.voter || ''));
    serializeUint64Array(bb, dataObj.proposal_ids);
    serializeBool(bb, dataObj.approve, 'update_proposal_votes.approve', { protocolDefault: false });
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize remove_proposal operation (op 46).
 * Fields: proposal_owner, proposal_ids (flat_set_ex<int64_t>, written
 * ascending), extensions (set<future_extensions>).
 */
function serializeRemoveProposal(bb: ByteBuffer, data: unknown): void {
    const dataObj = data as Record<string, unknown>;
    writeString(bb, String(dataObj.proposal_owner || ''));
    serializeUint64Array(bb, dataObj.proposal_ids);
    serializeExtensions(bb, dataObj.extensions);
}

/**
 * Serialize an array<uint64> field: varint32 length followed by each element
 * as uint64 little-endian, in ascending numeric order.
 *
 * Order is canonical, not caller order. The fields this serializes
 * (`update_proposal_votes` / `remove_proposal` `proposal_ids`) are
 * `flat_set_ex<int64_t>` on chain, and `fc::raw::pack` casts that to
 * `flat_set`, i.e. the packed form is a sorted set; the JSON path is stricter
 * still (`from_variant` asserts `tmp > last`, "Items should be unique and
 * sorted"). Legacy 0.7 also emitted sorted bytes — `proposal_ids` was declared
 * `array(uint64)` and `Types.array` ran every numeric array through
 * `sortOperation`, which orders numbers by `a - b`. Signing caller order would
 * therefore produce a digest the node recomputes over the sorted set and
 * rejects as invalid.
 *
 * Duplicates are the caller's problem: this is the legacy behaviour, and the
 * chain rejects a repeated id (JSON path) or collapses it (binary path).
 *
 * Fails loudly rather than coercing: this runs on the signing path, where a
 * malformed element silently becoming 0 would sign a vote for proposal 0 — a
 * transaction the caller never intended — instead of surfacing the bad input.
 *
 * Elements must be safe integers: string and number values are capped at
 * `Number.MAX_SAFE_INTEGER` (2^53 - 1). That is narrower than legacy, which
 * accepted the full uint64 range via Long, but proposal ids come from a
 * sequential on-chain counter and never approach that range.
 *
 * `Array.from` (not `values.map`) so that holes in a sparse array are also
 * validated — `map` skips holes, which would fall through to ByteBuffer's
 * opaque "Illegal value: undefined" instead of the field-level error below.
 */
function serializeUint64Array(bb: ByteBuffer, values: unknown): void {
    if (!Array.isArray(values)) {
        throw new Error('Invalid uint64 array field: expected an array');
    }
    const elements = Array.from(values, (value) => {
        const numeric =
            typeof value === 'number'
                ? value
                : typeof value === 'string' && value.trim() !== ''
                  ? Number(value)
                  : Number.NaN;
        if (!Number.isSafeInteger(numeric) || numeric < 0) {
            throw new Error(`Invalid uint64 array element: ${JSON.stringify(value)}`);
        }
        return numeric;
    });
    elements.sort((a, b) => a - b);
    bb.writeVarint32(elements.length);
    for (const element of elements) {
        bb.writeUint64(element);
    }
}

/**
 * Read authority map fields for binary packing (on-wire sorted flat_map).
 * JSON-RPC uses fc::flat_map → array of [key, weight] pairs; object maps are accepted
 * here only so callers that forgot to normalize still sign the intended keys.
 */
function authorityMapEntries(raw: unknown): [string, number][] {
    if (Array.isArray(raw)) {
        return raw
            .filter((entry): entry is [unknown, unknown] => Array.isArray(entry) && entry.length >= 2)
            .map(([key, weight]) => [String(key), Number(weight)] as [string, number])
            .filter(([, weight]) => Number.isFinite(weight));
    }
    if (raw && typeof raw === 'object') {
        return Object.entries(raw as Record<string, number>)
            .map(([key, weight]) => [String(key), Number(weight)] as [string, number])
            .filter(([, weight]) => Number.isFinite(weight));
    }
    return [];
}

/**
 * Serialize steem::protocol::authority (weight_threshold + sorted account/key flat_maps).
 */
function serializeAuthority(bb: ByteBuffer, auth: unknown): void {
    if (Array.isArray(auth)) {
        throw new Error('Invalid authority: expected object, got array');
    }
    if (auth == null || typeof auth !== 'object') {
        throw new Error('Invalid authority: expected object');
    }
    const authObj = auth as Record<string, unknown>;
    bb.writeUint32((authObj.weight_threshold as number) || 1);
    
    // Account auths (map<string, uint16>)
    const accountAuths = authorityMapEntries(authObj.account_auths).sort((a, b) =>
        a[0].localeCompare(b[0])
    );
    
    bb.writeVarint32(accountAuths.length);
    for (const [account, weight] of accountAuths) {
        writeString(bb, account);
        bb.writeUint16(weight);
    }
    
    // Key auths (map<public_key, uint16>)
    const keyAuths = authorityMapEntries(authObj.key_auths).sort((a, b) =>
        a[0].localeCompare(b[0])
    );
    
    bb.writeVarint32(keyAuths.length);
    for (const [keyStr, weight] of keyAuths) {
        const pubKey = PublicKey.fromStringOrThrow(keyStr);
        bb.append(pubKey.toBuffer());
        bb.writeUint16(weight);
    }
}

/**
 * Serialize asset (STEEM/SBD/VESTS style string) to binary.
 *
 * Format: int64 amount (little-endian) + uint8 precision + 7-byte symbol (UTF-8, null-padded).
 *
 * This helper is reused for asset fields across all operations, e.g.
 * - amount / vesting_shares / reward_* / *_pays
 *
 * The amount part must be well-formed and fit in int64 — anything else throws
 * instead of silently degrading on the signing path: the previous
 * `parseInt(...) || 0` turned a malformed amount like 'abc.000 STEEM' into
 * NaN → 0, signing byte-identical output to an explicit zero amount (for
 * delegate_vesting_shares that means a full revocation), and an amount beyond
 * int64 was silently clamped by writeInt64. Precision beyond uint8 is likewise
 * rejected here instead of falling through to ByteBuffer's opaque error.
 */
const INT64_MIN = -(1n << 63n);
const INT64_MAX = (1n << 63n) - 1n;

function serializeAsset(bb: ByteBuffer, amount: string): void {
    const parts = amount.split(' ');
    const valueStr = parts[0] || '0.000';
    const symbol = parts[1] || 'STEEM';

    const segments = valueStr.split('.');
    const intPart = segments[0] ?? '';
    const decPart = segments.length > 1 ? segments[1] ?? '' : '';
    if (segments.length > 2 || !/^-?\d+$/.test(intPart) || !/^\d+$/.test(decPart)) {
        throw new Error(
            `Invalid asset amount: expected '<digits>[.<decimals>] <SYMBOL>' (e.g. '1.000 STEEM'), received ${JSON.stringify(amount)}`
        );
    }
    const precision = decPart.length;
    if (precision > 255) {
        throw new Error(`Invalid asset amount: precision exceeds uint8 range in ${JSON.stringify(amount)}`);
    }

    // BigInt keeps the full int64 range exact; write the two 32-bit halves
    // directly (little-endian low word first) instead of going through
    // writeInt64/Long, so no precision is lost above 2^53 and there is no
    // dependency on bytebuffer's bundled Long class.
    const amountValue = BigInt(intPart + decPart);
    if (amountValue < INT64_MIN || amountValue > INT64_MAX) {
        throw new Error(`Invalid asset amount: value exceeds int64 range in ${JSON.stringify(amount)}`);
    }
    bb.writeUint32(Number(amountValue & 0xffffffffn));
    bb.writeUint32(Number((amountValue >> 32n) & 0xffffffffn));

    bb.writeUint8(precision);
    const symbolBytes = Buffer.from(symbol, 'utf8');
    bb.append(symbolBytes);
    for (let i = symbolBytes.length; i < 7; i++) {
        bb.writeUint8(0);
    }
}

/**
 * Write a string using ByteBuffer's writeVString method.
 * All string fields are serialized through this helper to avoid calling ByteBuffer API directly everywhere.
 */
function writeString(bb: ByteBuffer, str: string): void {
    bb.writeVString(str);
}

/**
 * Serialize a time_point_sec-style field.
 *
 * Accepts ISO string / Date / seconds number; writes uint32 (seconds since epoch).
 * Used for proposal start/end, escrow_deadline, and similar fields.
 *
 * An unparseable input throws a field-level error instead of letting NaN fall
 * through to ByteBuffer's opaque "Illegal value: NaN" — on the signing path
 * the caller needs to know which field was bad and what was received.
 *
 * A missing value (undefined/null) or a wrong-typed value also throws: the
 * previous `else { seconds = 0 }` silently signed 1970-01-01 (e.g. a
 * create_proposal without start_date). Values outside the uint32 range throw
 * as well — ByteBuffer's `value >>>= 0` would otherwise wrap them silently.
 */
function serializeTimePointSec(bb: ByteBuffer, value: unknown, fieldName: string): void {
    if (value === undefined || value === null) {
        throw new Error(
            `Missing required time field ${fieldName}: refusing to silently sign epoch 0 (1970-01-01). Pass an ISO string, Date, or seconds-since-epoch number.`
        );
    }
    let seconds: number;
    if (typeof value === 'string') {
        const iso = value.endsWith('Z') ? value : `${value}Z`;
        const d = new Date(iso);
        seconds = Math.floor(d.getTime() / 1000);
    } else if (value instanceof Date) {
        seconds = Math.floor(value.getTime() / 1000);
    } else if (typeof value === 'number') {
        // Assume value is already in seconds
        seconds = value;
    } else {
        throw new Error(
            `Invalid time value for ${fieldName}: expected ISO string, Date, or seconds-since-epoch number, received ${JSON.stringify(value)}`
        );
    }
    if (!Number.isFinite(seconds)) {
        throw new Error(`Invalid time value for ${fieldName}: ${JSON.stringify(value)}`);
    }
    if (seconds < 0 || seconds > 0xffffffff) {
        throw new Error(`Invalid time value for ${fieldName}: ${seconds} is outside the uint32 seconds range`);
    }
    bb.writeUint32(seconds);
}

/**
 * Serialize a generic bool flag as uint8(0/1).
 * Reused for optional / approve / decline and similar fields.
 *
 * Accepted inputs — anything else throws, because this runs on the signing
 * path, where coercing a malformed value (e.g. the string "false", which is
 * truthy in JavaScript) would silently sign bytes the caller never intended:
 * - booleans `true` / `false`
 * - the numbers `1` / `0`
 * - the strings `'true'` / `'false'` / `'1'` / `'0'`
 * - `undefined` / `null`, but ONLY for fields whose protocol default is
 *   `false` (`options.protocolDefault === false`): those serialize as 0,
 *   matching the C++ `bool x = false` field default. For fields whose C++
 *   default is `true` (e.g. `account_witness_vote.approve`,
 *   `comment_options.allow_votes`), a missing value throws — silently writing
 *   0 would sign the opposite of the protocol default.
 */
function serializeBool(
    bb: ByteBuffer,
    value: unknown,
    fieldName: string,
    options: { protocolDefault: boolean }
): void {
    if (value === undefined || value === null) {
        if (options.protocolDefault) {
            throw new Error(
                `Missing required boolean field ${fieldName}: the protocol default for this field is true, so there is no safe silent default. Pass an explicit boolean.`
            );
        }
        bb.writeUint8(0);
        return;
    }
    if (typeof value === 'boolean') {
        bb.writeUint8(value ? 1 : 0);
        return;
    }
    if (typeof value === 'number' && (value === 0 || value === 1)) {
        bb.writeUint8(value);
        return;
    }
    if (typeof value === 'string') {
        if (value === 'true' || value === '1') {
            bb.writeUint8(1);
            return;
        }
        if (value === 'false' || value === '0') {
            bb.writeUint8(0);
            return;
        }
    }
    throw new Error(
        `Invalid boolean value for ${fieldName}: expected a boolean, 0/1, or 'true'/'false'/'0'/'1', received ${JSON.stringify(value)}`
    );
}

/**
 * Serialize comment_options extensions (flat_set<comment_options_extension>).
 * Used only for comment_options operation. Supports tag 0 (comment_payout_beneficiaries).
 * Beneficiaries are sorted alphabetically by account name before encoding to satisfy Steem protocol.
 * Any other extension tag throws instead of being silently dropped: on the
 * signing path, dropping it would sign a payload the caller never intended
 * (same rule as serializeExtensions for future_extensions).
 */
function serializeCommentOptionsExtensions(bb: ByteBuffer, extensions: unknown): void {
    if (!Array.isArray(extensions) || extensions.length === 0) {
        bb.writeVarint32(0);
        return;
    }
    for (const ext of extensions) {
        const tag = Array.isArray(ext) && ext.length >= 1 ? Number(ext[0]) : Number.NaN;
        if (tag !== 0) {
            throw new Error(
                `Unsupported comment_options extension: only tag 0 (comment_payout_beneficiaries) is supported, received ${JSON.stringify(ext)}`
            );
        }
    }
    bb.writeVarint32(extensions.length);
    for (const ext of extensions as [number, { beneficiaries?: Array<{ account: string; weight: number }> }][]) {
        const value = ext[1];
        bb.writeVarint32(0);
        const beneficiaries = Array.isArray(value?.beneficiaries) ? value.beneficiaries.slice() : [];
        beneficiaries.sort((a, b) => String(a.account).localeCompare(String(b.account)));
        bb.writeVarint32(beneficiaries.length);
        for (const b of beneficiaries) {
            writeString(bb, String(b.account ?? ''));
            bb.writeUint16(Number(b.weight) & 0xffff);
        }
    }
}

/**
 * Serialize a future_extensions / extensions-style field.
 *
 * For most on-chain transactions extensions are still an empty set. Protocol format:
 * - varint32 length
 * - then each element serialized per convention (current implementation supports empty only).
 *
 * A caller that explicitly passes a NON-empty extensions array gets an error
 * instead of silently dropped bytes: on the signing path, dropping them would
 * sign a payload the caller never intended. Absent / empty stays varint32(0).
 * When supporting specific extension types, extend this after verification.
 */
function serializeExtensions(bb: ByteBuffer, extensions: unknown): void {
    if (!Array.isArray(extensions) || extensions.length === 0) {
        bb.writeVarint32(0);
        return;
    }

    throw new Error(
        `Unsupported non-empty extensions: this serializer only supports the empty future_extensions set, received ${JSON.stringify(extensions)}`
    );
}
