/**
 * RPC Auth Tests
 * Migrated from @steemit/rpc-auth package
 * 
 * These tests verify the rpc-auth functionality that was integrated into steem-js v1.0.11
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { steem } from '../src';
import { sign, validate } from '../src/api/rpc-auth';
import { randomBytes } from 'crypto';

const { api, auth, config } = steem;

// Test credentials
const testAccount = process.env.STEEM_USERNAME || 'guest123';
const testPassword = process.env.STEEM_PASSWORD;
const testPrivateKey = testPassword 
  ? auth.toWif(testAccount, testPassword, 'posting') 
  : '5JLw5dgQAx6rhZEgNN5C2ds1V47RweGshynFSWFbaMohsYsBvE8';

// Dummy verify function that always succeeds (for testing structure)
const dummyVerify = async (message: Buffer, signatures: string[], account: string) => {
  // Do nothing - always pass
};

// Real verify function using steem-js API
const createVerifyFunction = () => {
  return async (message: Buffer, signatures: string[], account: string) => {
    try {
      // Get account's public keys
      const accounts = await new Promise<any[]>((resolve, reject) => {
        api.getAccounts([account], (err: Error | null, result?: any[]) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      });
      if (!accounts || accounts.length === 0) {
        throw new Error('Account not found');
      }

      const accountData = accounts[0];
      const postingKeys = accountData.posting?.key_auths?.map((k: any) => k[0]) || [];

      // Verify at least one signature matches one of the account's keys
      const { Signature, PublicKey } = auth;
      let verified = false;

      for (const sigHex of signatures) {
        for (const pubKeyStr of postingKeys) {
          try {
            const sig = Signature.fromHex(sigHex);
            const pubKey = PublicKey.fromStringOrThrow(pubKeyStr);
            if (sig.verifyBuffer(message, pubKey)) {
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
        throw new Error('Signature invalid');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
};

function randomString(length: number): string {
  return randomBytes(length * 2)
    .toString('base64')
    .replace(/[^0-9a-z]+/gi, '')
    .slice(0, length)
    .toLowerCase();
}

// Use the types from rpc-auth module
interface RpcRequest {
  method: string;
  params: unknown[];
  id: number;
}

interface SignedRequest {
  jsonrpc: '2.0';
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

describe('RPC Auth', () => {
  beforeAll(() => {
    // Configure for HTTP transport (required for signedCall)
    config.set({
      nodes: ['https://api.steemit.com'],
      transport: 'http'
    });
  });

  describe('sign and validate', () => {
    it('should sign and validate a request', async () => {
      const req: RpcRequest = {
        id: 123,
        method: 'foo.bar',
        params: [{ bongo: 'bingo' }]
      };

      const signed = sign(req, testAccount, [testPrivateKey]);

      expect(signed.params.__signed).toBeDefined();
      expect(signed.jsonrpc).toBe('2.0');
      expect(signed.method).toBe(req.method);
      expect(signed.id).toBe(req.id);

      const verifiedParams = await validate(signed, dummyVerify);
      expect(verifiedParams).toEqual(req.params);
    });
  });

  describe('invalid requests', () => {
    it('should handle invalid JSON RPC request', async () => {
      const req: any = {};

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid JSON RPC Request');
    });

    it('should handle missing signed payload', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar'
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Signed payload missing');
    });

    it('should handle invalid request params', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: { __signed: {}, other: 'foo' }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid request params');
    });

    it('should handle missing account', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: { __signed: {} }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Missing account');
    });

    it('should handle invalid encoded params', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo'
          }
        }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid encoded params');
    });

    it('should handle invalid nonce (not a string)', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo',
            params: Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64')
          }
        }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid nonce');
    });

    it('should handle invalid nonce (wrong length)', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo',
            params: Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64'),
            nonce: 'banana' // Not 16 hex chars (8 bytes)
          }
        }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid nonce');
    });

    it('should handle invalid nonce (wrong format)', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo',
            params: Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64'),
            nonce: 'nothexchars' // Not valid hex
          }
        }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid nonce');
    });

    it('should handle invalid timestamp', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo',
            params: Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64'),
            nonce: randomBytes(8).toString('hex')
          }
        }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Invalid timestamp');
    });

    it('should handle expired signature', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo',
            params: Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64'),
            nonce: randomBytes(8).toString('hex'),
            timestamp: '2001-01-01T00:00:00Z' // Expired
          }
        }
      };

      await expect(validate(req as SignedRequest, dummyVerify)).rejects.toThrow('Signature expired');
    });

    it('should handle verification failure', async () => {
      const req: any = {
        jsonrpc: '2.0',
        method: 'foo.bar',
        params: {
          __signed: {
            account: 'foo',
            params: Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64'),
            nonce: randomBytes(8).toString('hex'),
            timestamp: new Date().toISOString(),
            signatures: []
          }
        }
      };

      const failingVerify = async () => {
        throw new Error('Nope');
      };

      await expect(validate(req as SignedRequest, failingVerify)).rejects.toThrow('Verification failed: Nope');
    });
  });

  describe('invalid signatures', () => {
    it.skip('should handle invalid signatures (integration test)', async () => {
      // This test requires a real testnet account and network access
      // Skipped by default, can be enabled with real credentials
      
      const verifyFunction = createVerifyFunction();
      const req: RpcRequest = {
        id: 123,
        method: 'foo.bar',
        params: [{ hello: 'there' }]
      };

      const signed = sign(req, testAccount, [testPrivateKey]);

      // Valid signature should pass
      await expect(validate(signed, verifyFunction)).resolves.toBeDefined();

      // Invalid method
      const invalid1: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        method: 'foo.bar2'
      };
      await expect(validate(invalid1, verifyFunction)).rejects.toThrow('Verification failed');

      // Invalid account
      const invalid2: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        params: {
          __signed: {
            ...signed.params.__signed,
            account: 'baz'
          }
        }
      };
      await expect(validate(invalid2, verifyFunction)).rejects.toThrow('Verification failed');

      // Invalid nonce
      const invalid3: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        params: {
          __signed: {
            ...signed.params.__signed,
            nonce: randomBytes(8).toString('hex')
          }
        }
      };
      await expect(validate(invalid3, verifyFunction)).rejects.toThrow('Verification failed');

      // Invalid params
      const invalid4: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        params: {
          __signed: {
            ...signed.params.__signed,
            params: 'eyJpbGlrZSI6InR1cnRsZXMifQ==' // Different params
          }
        }
      };
      await expect(validate(invalid4, verifyFunction)).rejects.toThrow('Verification failed');

      // Invalid timestamp (future)
      const invalid5: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        params: {
          __signed: {
            ...signed.params.__signed,
            timestamp: '3020-01-01T00:00:00Z'
          }
        }
      };
      await expect(validate(invalid5, verifyFunction)).rejects.toThrow('Verification failed');

      // Invalid signatures (wrong key)
      const wrongKey = auth.PrivateKey.fromSeed('foobar');
      const wrongMessage = randomBytes(32);
      const wrongSig = auth.Signature.signBufferSha256(wrongMessage, wrongKey);
      const invalid6: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        params: {
          __signed: {
            ...signed.params.__signed,
            signatures: [wrongSig.toHex()]
          }
        }
      };
      await expect(validate(invalid6, verifyFunction)).rejects.toThrow('Verification failed');

      // Invalid signatures (same key, wrong message)
      const testKeyObj = auth.PrivateKey.fromWif(testPrivateKey);
      const wrongSig2 = auth.Signature.signBufferSha256(randomBytes(32), testKeyObj);
      const invalid7: SignedRequest = {
        ...signed,
        jsonrpc: '2.0' as const,
        params: {
          __signed: {
            ...signed.params.__signed,
            signatures: [wrongSig2.toHex()]
          }
        }
      };
      await expect(validate(invalid7, verifyFunction)).rejects.toThrow('Verification failed');
    });
  });

  describe('signing errors', () => {
    it('should handle invalid requests when signing', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'foo',
        params: [] // Empty params - sign function requires non-empty params
      };

      // Actually, sign requires params to exist, so let's test with undefined
      const reqWithoutParams: any = {
        id: 123,
        method: 'foo'
        // Missing params
      };

      expect(() => {
        sign(reqWithoutParams, testAccount, [testPrivateKey]);
      }).toThrow('Unable to sign a request without params');
    });

    it('should handle empty keys array', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'foo',
        params: [{ test: 'data' }]
      };

      // Should not throw, but create empty signatures array
      const signed = sign(req, testAccount, []);
      expect(signed.params.__signed.signatures).toEqual([]);
    });
  });

  describe('signature format', () => {
    it('should generate valid signature format', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'test.method',
        params: [{ test: 'data' }]
      };

      const signed = sign(req, testAccount, [testPrivateKey]);

      // Check signature format
      expect(signed.params.__signed.signatures.length).toBeGreaterThan(0);
      const signature = signed.params.__signed.signatures[0];
      
      // Signature should be hex string
      expect(typeof signature).toBe('string');
      expect(/^[0-9a-f]+$/i.test(signature)).toBe(true);
      
      // Signature should be at least 128 chars (64 bytes = 130 chars with recovery param)
      expect(signature.length).toBeGreaterThanOrEqual(128);
    });

    it('should generate signatures with valid recovery parameter', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'test.method',
        params: [{ test: 'data' }]
      };

      const signed = sign(req, testAccount, [testPrivateKey]);
      const signature = signed.params.__signed.signatures[0];
      
      // Parse signature to check recovery parameter
      const sigBuffer = Buffer.from(signature, 'hex');
      const recoveryByte = sigBuffer.readUInt8(0);
      // Recovery byte is now 31-34 (dsteem compatible), recovery param = byte - 31
      const recovery = recoveryByte - 31;
      
      // Recovery parameter should be in valid range (0-3)
      // This is critical for server-side validation which expects recovery between -1 and 4
      expect(recovery).toBeGreaterThanOrEqual(0);
      expect(recovery).toBeLessThanOrEqual(3);
      
      // Recovery byte (i) should be 31-34 (dsteem compatible format)
      expect(recoveryByte).toBeGreaterThanOrEqual(31);
      expect(recoveryByte).toBeLessThanOrEqual(34);
    });

    it('should generate unique nonces for each request', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'test.method',
        params: [{ test: 'data' }]
      };

      const signed1 = sign(req, testAccount, [testPrivateKey]);
      const signed2 = sign(req, testAccount, [testPrivateKey]);

      expect(signed1.params.__signed.nonce).not.toBe(signed2.params.__signed.nonce);
    });

    it('should generate valid timestamps', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'test.method',
        params: [{ test: 'data' }]
      };

      const signed = sign(req, testAccount, [testPrivateKey]);
      const timestamp = new Date(signed.params.__signed.timestamp);
      const now = new Date();

      // Timestamp should be valid and recent (within 1 second)
      expect(timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(now.getTime() - timestamp.getTime()).toBeLessThan(1000);
    });
  });

  describe('multiple signatures', () => {
    it('should support multiple keys', () => {
      const req: RpcRequest = {
        id: 123,
        method: 'test.method',
        params: [{ test: 'data' }]
      };

      // Generate a second test key
      const key2 = auth.PrivateKey.fromSeed('test-seed-2');
      const key2Wif = key2.toWif();

      const signed = sign(req, testAccount, [testPrivateKey, key2Wif]);

      expect(signed.params.__signed.signatures.length).toBe(2);
      expect(signed.params.__signed.signatures[0]).toBeDefined();
      expect(signed.params.__signed.signatures[1]).toBeDefined();
      expect(signed.params.__signed.signatures[0]).not.toBe(signed.params.__signed.signatures[1]);
    });
  });
});
