import { Api } from '../api';
import Auth from '../auth';
import { createOperation, createTransaction, BroadcastOptions } from './helpers';
import { operations } from './operations';
import { camelCase } from '../utils';
import { promisify } from '../utils/promisify';
import { sha256 } from '@noble/hashes/sha2.js';

export interface BroadcastConfig {
    api: Api;
    auth: Auth;
}

export class Broadcast {
    private api: Api;
    private auth: Auth;

    constructor(config: BroadcastConfig) {
        this.api = config.api;
        this.auth = config.auth;
    }

    async send(tx: { operations: unknown[]; extensions?: unknown[] }, privKeys: string | string[], callback?: (err: Error | null, result?: unknown) => void): Promise<unknown> {
        // Use instance or global steem.api/auth for compatibility
        const thisObj = this as unknown as { api?: Api; auth?: Auth };
        const api = (thisObj && thisObj.api) ? thisObj.api : (typeof steem !== 'undefined' && steem.api ? steem.api : undefined);
        const auth = (thisObj && thisObj.auth) ? thisObj.auth : (typeof steem !== 'undefined' && steem.auth ? steem.auth : undefined);
        if (!api || !auth) {
            throw new Error('API and Auth must be set on Broadcast instance or global steem object');
        }
        try {
            // Prepare the transaction (fetch global props, block header, etc.)
            const transaction = await (broadcastMethods._prepareTransaction as (this: Broadcast, transaction: { operations: unknown[]; extensions?: unknown[] }) => Promise<unknown>).call(this, tx);

            // Debug: Print transaction, digest, and hex before signing (if debug enabled)
            const { debug } = await import('../utils/debug');
            if (debug.isEnabled('transaction')) {
                const { transaction: transactionSerializer } = await import('../auth/serializer');
                const { getConfig } = await import('../config');
                // sha256 is already imported at the top
                
                const buf = transactionSerializer.toBuffer(transaction);
                const chainId = Buffer.from((getConfig().get('chain_id') as string | undefined) || '', 'hex');
                const digest = Buffer.from(sha256(Buffer.concat([chainId, buf])));
                
                debug.transaction('\n=== Transaction Debug Info (before signing) ===');
                debug.transaction('Transaction:', JSON.stringify(transaction, null, 2));
                debug.transaction('Transaction.toHex():', buf.toString('hex'));
                debug.transaction('Digest (sha256(chain_id + transaction)):', digest.toString('hex'));
                debug.transaction('===============================================\n');
            }

            // Ensure privKeys is always an array for signTransaction
            const keysArray: string[] = Array.isArray(privKeys)
                ? privKeys.filter((k): k is string => typeof k === 'string')
                : privKeys && typeof privKeys === 'object'
                    ? Object.values(privKeys).filter((k): k is string => typeof k === 'string')
                    : privKeys && typeof privKeys === 'string'
                        ? [privKeys]
                        : [];

            // Sign the transaction
            const signedTransaction = await auth.signTransaction(transaction, keysArray);

            // Broadcast synchronously and merge result
            const result = await new Promise((resolve, reject) => {
                api.send(
                    'network_broadcast_api',
                    {
                        method: 'broadcast_transaction_synchronous',
                        params: [signedTransaction],
                    },
                    (err: Error | null, res?: unknown) => {
                        if (err) reject(err);
                        else resolve(res);
                    }
                );
            });

            const merged = Object.assign({}, result, signedTransaction);

            if (callback) {
                callback(null, merged);
                return;
            }
            return merged;
        } catch (err) {
            if (callback) {
                callback(err instanceof Error ? err : new Error(String(err)));
                return;
            }
            throw err;
        }
    }

    async sendOperations(operations: BroadcastOptions[]): Promise<unknown> {
        const ops = operations.map(createOperation);
        const transaction = createTransaction(ops);
        const signedTransaction = await this.auth.signTransaction(transaction, []);
        return new Promise((resolve, reject) => {
            this.api.send('network_broadcast_api', {
                method: 'broadcast_transaction_synchronous',
                params: [signedTransaction]
            }, (err: Error | null, result?: unknown) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    async sendTransaction(transaction: unknown): Promise<unknown> {
        const signedTransaction = await this.auth.signTransaction(transaction, []);
        return new Promise((resolve, reject) => {
            this.api.send('network_broadcast_api', {
                method: 'broadcast_transaction_synchronous',
                params: [signedTransaction]
            }, (err: Error | null, result?: unknown) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    async sendSignedTransaction(signedTransaction: unknown): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.api.send('network_broadcast_api', {
                method: 'broadcast_transaction_synchronous',
                params: [signedTransaction]
            }, (err: Error | null, result?: unknown) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

/**
 * Top-level broadcast function for compatibility with tests and original API.
 */
export function broadcast(api: unknown, transaction: unknown): Promise<unknown> {
    // Handle both real API objects and mock test objects
    if (typeof api !== 'object' || !api) {
        throw new Error('First parameter must be a valid API object');
    }
    
    // First try to use the original 'broadcastTransaction' if available (for test mocks)
    const apiObj = api as Record<string, unknown>;
    if (typeof apiObj.broadcastTransaction === 'function') {
        return new Promise((resolve, reject) => {
            (apiObj.broadcastTransaction as (tx: unknown, cb: (err: Error | null, result?: unknown) => void) => void)(transaction, (err: Error | null, result?: unknown) => {
                if (err) reject(err);
                else resolve(Object.assign({}, result, transaction));
            });
        });
    }
    
    // Otherwise, use the send method directly
    if (typeof apiObj.send === 'function') {
        return new Promise((resolve, reject) => {
            (apiObj.send as (api: string, data: { method: string; params: unknown[] }, callback: (err: Error | null, result?: unknown) => void) => void)('network_broadcast_api', {
                method: 'broadcast_transaction_synchronous',
                params: [transaction]
            },             (err: Error | null, result?: unknown) => {
                if (err) reject(err);
                else resolve(Object.assign({}, result, transaction));
            });
        });
    }
    
    // If no suitable method is found, reject with an error
    return Promise.reject(new Error('No suitable broadcast method found on API object'));
}

// Dynamically generate all broadcast operation methods and their Async variants
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BroadcastMethod = (...args: any[]) => unknown | Promise<unknown> | undefined | void;
const broadcastMethods: Record<string, BroadcastMethod> = {};

operations.forEach((operation) => {
    const operationName = camelCase(operation.operation);
    const operationParams = operation.params || [];
    
    // Implement synchronous version with proper parameters
    // First parameter is WIF, then operation params, last is callback
    broadcastMethods[operationName] = function(wif: string, ...args: unknown[]) {
        // The last argument might be the callback
        let callback: ((err: Error | null, result?: unknown) => void) | undefined = undefined;
        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
            const lastArg = args.pop();
            callback = lastArg as (err: Error | null, result?: unknown) => void;
        }
        
        // For tests, 'this' may have the api as a property
        const thisObj = this as unknown as { api?: Api; auth?: Auth };
        const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : steem.api;
        const authObj = thisObj as { auth?: Auth };
        const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' && steem.auth ? steem.auth : Auth);
        
        // Build options object from args
        const options: Record<string, unknown> = {};
        operationParams.forEach((param: string, i: number) => {
            if (i < args.length) {
                options[param] = args[i] as unknown;
            }
        });
        
        // Common implementation for all operations
        try {
            const transaction = {
                operations: [[operation.operation, options]], 
                extensions: []
            };
            
            // Use send method to sign and broadcast with WIF
            if (!api) throw new Error('API is required');
            const broadcastInstance = new Broadcast({ api, auth });
            if (callback) {
                broadcastInstance.send(transaction, wif, callback);
                return;
            } else {
                return broadcastInstance.send(transaction, wif);
            }
        } catch (error) {
            if (callback) {
                callback(error instanceof Error ? error : new Error(String(error)));
                return;
            } else {
                throw error;
            }
        }
    };
    
    // Implement "With" methods for each operation
    broadcastMethods[operationName + 'With'] = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void) {
        // For tests, 'this' may have the api as a property
        const thisObj = this as unknown as { api?: Api; auth?: Auth };
        const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
        const authObj = thisObj as { auth?: Auth };
        const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
        
        if (typeof callback !== 'function') {
            callback = undefined;
        }
        
        try {
            const transaction = {
                operations: [[operation.operation, options]],
                extensions: []
            };
            
            // Use send method to sign and broadcast with WIF
            if (!api) throw new Error('API is required');
            const broadcastInstance = new Broadcast({ api, auth });
            if (callback) {
                broadcastInstance.send(transaction, wif, callback);
                return;
            } else {
                return broadcastInstance.send(transaction, wif);
            }
        } catch (error) {
            if (callback) {
                callback(error instanceof Error ? error : new Error(String(error)));
                return;
            } else {
                throw error;
            }
        }
    };
    
    // Async version
    broadcastMethods[operationName + 'Async'] = promisify(broadcastMethods[operationName]);
});

// Add any additional required stubs
broadcastMethods._prepareTransaction = async function(transaction: unknown) {
    // Use global or instance API
    const thisObj = this as unknown as { api?: Api };
    const api: Api | undefined = (thisObj && thisObj.api) ? thisObj.api : (typeof steem !== 'undefined' && steem.api ? (steem.api as Api) : undefined);
    if (!api) throw new Error('API must be set on Broadcast instance or global steem object');

    // Fetch dynamic global properties
    const apiWithMethods = api as unknown as { getDynamicGlobalPropertiesAsync: () => Promise<{ time: string; last_irreversible_block_num: number }> };
    const properties = await apiWithMethods.getDynamicGlobalPropertiesAsync();
    const chainDate = new Date(properties.time + 'Z');
    const refBlockNum = (properties.last_irreversible_block_num - 1) & 0xFFFF;
    // Fetch block header - try getBlockHeaderAsync first, fallback to getBlockAsync
    let block: unknown = null;
    try {
        const apiWithMethods = api as unknown as Record<string, (blockNum: number) => Promise<unknown>>;
        if (typeof apiWithMethods.getBlockHeaderAsync === 'function') {
            block = await apiWithMethods.getBlockHeaderAsync(properties.last_irreversible_block_num);
        } else if (typeof apiWithMethods.getBlockAsync === 'function') {
            block = await apiWithMethods.getBlockAsync(properties.last_irreversible_block_num);
        }
    } catch {
        // If block fetch fails, use default
        block = null;
    }
    const blockObj = block as { previous?: string } | null;
    const headBlockId = blockObj && blockObj.previous ? blockObj.previous : '0000000000000000000000000000000000000000';
    const refBlockPrefix = Buffer.from(headBlockId, 'hex').readUInt32LE(4);
    const transactionObj = transaction as Record<string, unknown>;
    return {
        ...transactionObj,
        ref_block_num: refBlockNum,
        ref_block_prefix: refBlockPrefix,
        expiration: new Date(chainDate.getTime() + 600 * 1000).toISOString().replace('Z', ''),
    };
};

// Mock implementation of steem for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const steem: { api: Api | null; auth: Auth; [key: string]: any } = { api: null, auth: Auth };

/**
 * Set the API reference for the broadcast module
 */
export function setApi(api: Api): void {
    steem.api = api;
}

// Implement the most commonly used methods
broadcastMethods.vote = function(wif: string, voter: string, author: string, permlink: string, weight: number, callback?: (err: Error | null, result?: unknown) => void): Promise<unknown> | void {
    // For tests, 'this' may have the api as a property
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    
    try {
        const params = {
            voter,
            author,
            permlink,
            weight
        };
        
        const transaction = {
            operations: [['vote', params]],
            extensions: []
        };
        
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};

broadcastMethods.voteWith = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void): unknown {
    // For tests, 'this' may have the api as a property
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    
    try {
        const transaction = {
            operations: [['vote', options]],
            extensions: []
        };
        
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};

broadcastMethods.comment = function(wif: string, parentAuthor: string, parentPermlink: string, author: string, permlink: string, title: string, body: string, jsonMetadata: unknown, callback?: (err: Error | null, result?: unknown) => void): unknown {
    // For tests, 'this' may have the api as a property
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    
    try {
        const params = {
            parent_author: parentAuthor,
            parent_permlink: parentPermlink,
            author,
            permlink,
            title,
            body,
            json_metadata: typeof jsonMetadata === 'object' ? JSON.stringify(jsonMetadata) : jsonMetadata
        };
        
        const transaction = {
            operations: [['comment', params]],
            extensions: []
        };
        
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};

// Note: customJson is auto-generated by the operations.forEach loop above
// The auto-generated version follows the standard signature from operations.ts:
// (wif, required_auths, required_posting_auths, id, json, callback?)
// This matches the Steem protocol definition and old-steem-js implementation

// Claim account operation
broadcastMethods.claimAccount = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void): unknown {
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    try {
        const transaction = {
            operations: [['claim_account', options]],
            extensions: []
        };
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};
broadcastMethods.claimAccountAsync = promisify(broadcastMethods.claimAccount);

// Create claimed account operation
broadcastMethods.createClaimedAccount = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void): unknown {
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    try {
        const transaction = {
            operations: [['create_claimed_account', options]],
            extensions: []
        };
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};
broadcastMethods.createClaimedAccountAsync = promisify(broadcastMethods.createClaimedAccount);

// Create proposal operation
broadcastMethods.createProposal = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void): unknown {
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    try {
        const transaction = {
            operations: [['create_proposal', options]],
            extensions: []
        };
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};
broadcastMethods.createProposalAsync = promisify(broadcastMethods.createProposal);

// Update proposal votes operation
broadcastMethods.updateProposalVotes = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void): unknown {
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    try {
        const transaction = {
            operations: [['update_proposal_votes', options]],
            extensions: []
        };
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};
broadcastMethods.updateProposalVotesAsync = promisify(broadcastMethods.updateProposalVotes);

// Remove proposal operation
broadcastMethods.removeProposal = function(wif: string, options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void): unknown {
    const thisObj = this as unknown as { api?: Api; auth?: Auth };
    const api: Api | null = (thisObj && thisObj.api) ? thisObj.api : (steem.api as Api | null);
    const authObj = thisObj as { auth?: Auth };
    const auth: Auth = (authObj && authObj.auth) ? authObj.auth : (typeof steem !== 'undefined' ? (steem.auth as Auth) : Auth);
    if (typeof callback !== 'function') {
        callback = undefined;
    }
    try {
        const transaction = {
            operations: [['remove_proposal', options]],
            extensions: []
        };
        // Use send method to sign and broadcast with WIF
        if (!api) throw new Error('API is required');
        const broadcastInstance = new Broadcast({ api, auth });
        if (callback) {
            broadcastInstance.send(transaction, wif, callback);
            return;
        } else {
            return broadcastInstance.send(transaction, wif);
        }
    } catch (error) {
        if (callback) {
            callback(error instanceof Error ? error : new Error(String(error)));
            return;
        } else {
            throw error;
        }
    }
};
broadcastMethods.removeProposalAsync = promisify(broadcastMethods.removeProposal);

// Export all generated methods
export const {
    _prepareTransaction,
    claimAccount,
    claimAccountAsync,
    createClaimedAccount,
    createClaimedAccountAsync,
    createProposal,
    createProposalAsync,
    updateProposalVotes,
    updateProposalVotesAsync,
    removeProposal,
    removeProposalAsync,
    ...generated
} = broadcastMethods;

// Export all generated methods at the top level
// Note: This is handled by Rollup's export mechanism, so we don't need to manually assign to exports
// Object.entries(generated).forEach(([name, fn]) => {
//     (exports as any)[name] = fn;
// });

// Explicitly export vote, voteAsync, voteWith, comment, transfer, etc. for compatibility
export const vote = generated.vote;
export const voteAsync = generated.voteAsync;
export const voteWith = generated.voteWith;
export const comment = generated.comment;
export const transfer = generated.transfer;
export const transferAsync = generated.transferAsync;

export const sendAsync = promisify((...args: unknown[]) => ((exports as unknown) as { send: (...args: unknown[]) => unknown }).send(...args));

// Export send at the top level
export const send = Broadcast.prototype.send;
// Export customJson and customJsonAsync at the top level
export const customJson = generated.customJson;
export const customJsonAsync = generated.customJsonAsync; 