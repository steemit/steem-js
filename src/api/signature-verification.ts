/**
 * Signature Verification Utilities for Steem.js
 * 
 * This module provides comprehensive signature verification functionality
 * for signed RPC requests and general message signatures.
 */

import { validate } from './rpc-auth';
import { Signature, PublicKey, verifySignature } from '../auth';

export interface SignedRequest {
  jsonrpc: string;
  method: string;
  id: number;
  params: {
    __signed: {
      account: string;
      nonce: string;
      params: string;
      signatures: string[];
      timestamp: string;
    };
  };
}

export interface VerificationResult {
  valid: boolean;
  account?: string;
  params?: any;
  error?: string;
  timestamp?: string;
  signatures?: string[];
}

export interface AccountKeys {
  owner: string[];
  active: string[];
  posting: string[];
  memo: string;
}

/**
 * Verify a signed RPC request against account's public keys
 */
export async function verifySignedRequest(
  signedRequest: SignedRequest,
  getAccountKeys: (account: string) => Promise<AccountKeys>
): Promise<VerificationResult> {
  try {
    // Create verification function
    const verifyFunction = async (message: Buffer, signatures: string[], account: string) => {
      const accountKeys = await getAccountKeys(account);
      
      // Collect all public keys from the account
      const allKeys = [
        ...accountKeys.owner,
        ...accountKeys.active,
        ...accountKeys.posting,
        accountKeys.memo
      ].filter(Boolean);

      // Verify at least one signature matches one of the account's keys
      let verified = false;
      for (const signature of signatures) {
        for (const publicKey of allKeys) {
          try {
            const sig = Signature.fromHex(signature);
            const pubKey = PublicKey.fromString(publicKey);
            if (pubKey && sig.verifyBuffer(message, pubKey)) {
              verified = true;
              break;
            }
          } catch {
            // Continue to next key/signature combination
          }
        }
        if (verified) break;
      }

      if (!verified) {
        throw new Error('No valid signature found for account');
      }
    };

    // Validate the signed request
    const params = await validate(signedRequest, verifyFunction);
    
    return {
      valid: true,
      account: signedRequest.params.__signed.account,
      params,
      timestamp: signedRequest.params.__signed.timestamp,
      signatures: signedRequest.params.__signed.signatures
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Verify a simple message signature
 */
export function verifyMessageSignature(
  message: string | Buffer,
  signature: string,
  publicKey: string
): boolean {
  try {
    return verifySignature(
      Buffer.isBuffer(message) ? message.toString() : message,
      signature,
      publicKey
    );
  } catch {
    return false;
  }
}

/**
 * Verify multiple signatures against multiple public keys
 */
export function verifyMultipleSignatures(
  message: string | Buffer,
  signatures: string[],
  publicKeys: string[]
): { verified: boolean; validSignatures: number; details: Array<{ signature: string; publicKey: string; valid: boolean }> } {
  const details: Array<{ signature: string; publicKey: string; valid: boolean }> = [];
  let validSignatures = 0;

  for (const signature of signatures) {
    for (const publicKey of publicKeys) {
      const valid = verifyMessageSignature(message, signature, publicKey);
      details.push({ signature, publicKey, valid });
      if (valid) {
        validSignatures++;
      }
    }
  }

  return {
    verified: validSignatures > 0,
    validSignatures,
    details
  };
}

/**
 * Extract account keys from Steem account data
 */
export function extractAccountKeys(accountData: any): AccountKeys {
  const extractKeys = (authority: any): string[] => {
    if (!authority || !authority.key_auths) return [];
    return authority.key_auths.map((auth: any) => auth[0]).filter(Boolean);
  };

  return {
    owner: extractKeys(accountData.owner),
    active: extractKeys(accountData.active),
    posting: extractKeys(accountData.posting),
    memo: accountData.memo_key || ''
  };
}

/**
 * Create a verification function for use with API calls
 */
export function createApiVerificationFunction(api: any) {
  return async (account: string): Promise<AccountKeys> => {
    return new Promise((resolve, reject) => {
      api.call('condenser_api.get_accounts', [[account]], (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!result || result.length === 0) {
          reject(new Error(`Account ${account} not found`));
          return;
        }

        try {
          const accountKeys = extractAccountKeys(result[0]);
          resolve(accountKeys);
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}

/**
 * Batch verify multiple signed requests
 */
export async function batchVerifySignedRequests(
  signedRequests: SignedRequest[],
  getAccountKeys: (account: string) => Promise<AccountKeys>
): Promise<VerificationResult[]> {
  const results = await Promise.allSettled(
    signedRequests.map(request => verifySignedRequest(request, getAccountKeys))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        valid: false,
        error: `Verification failed: ${result.reason?.message || 'Unknown error'}`
      };
    }
  });
}

/**
 * Check if a signature is expired
 */
export function isSignatureExpired(timestamp: string, maxAgeMs: number = 60000): boolean {
  try {
    const signatureTime = Date.parse(timestamp);
    if (Number.isNaN(signatureTime)) {
      return true; // Invalid timestamp is considered expired
    }
    
    return Date.now() - signatureTime > maxAgeMs;
  } catch {
    return true;
  }
}

/**
 * Validate signature format
 */
export function isValidSignatureFormat(signature: string): boolean {
  try {
    // Check if it's a valid hex string of appropriate length
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      return false;
    }
    
    // Try to parse as signature
    Signature.fromHex(signature);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate public key format
 */
export function isValidPublicKeyFormat(publicKey: string): boolean {
  try {
    PublicKey.fromString(publicKey);
    return true;
  } catch {
    return false;
  }
}

// Default export with all verification functions
export default {
  verifySignedRequest,
  verifyMessageSignature,
  verifyMultipleSignatures,
  extractAccountKeys,
  createApiVerificationFunction,
  batchVerifySignedRequests,
  isSignatureExpired,
  isValidSignatureFormat,
  isValidPublicKeyFormat
};
