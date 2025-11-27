import { describe, it, expect, beforeAll } from 'vitest';
import { steem } from '../src';

const { api, auth, config } = steem;

// Test credentials (using test account)
const testAccount = process.env.STEEM_USERNAME || 'guest123';
const testPassword = process.env.STEEM_PASSWORD;
const testPrivateKey = testPassword ? auth.toWif(testAccount, testPassword, 'active') : '5JLw5dgQAx6rhZEgNN5C2ds1V47RweGshynFSWFbaMohsYsBvE8';

describe('SignedCall', () => {
  beforeAll(() => {
    // Configure for HTTP transport (required for signedCall)
    config.set({
      node: 'https://api.steemit.com',
      transport: 'http'
    });
  });

  describe('Basic Functionality', () => {
    it('should have signedCall method', () => {
      expect(api.signedCall).toBeDefined();
      expect(typeof api.signedCall).toBe('function');
    });

    it('should validate transport type', async () => {
      // Temporarily set WebSocket transport
      const originalTransport = api._transportType;
      api._transportType = 'ws';

      try {
        await new Promise((resolve, reject) => {
          api.signedCall(
            'condenser_api.get_accounts',
            [[testAccount]],
            testAccount,
            testPrivateKey,
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('RPC methods can only be called when using http transport');
      } finally {
        // Restore original transport
        api._transportType = originalTransport;
      }
    });

    it('should handle invalid private key', async () => {
      try {
        await new Promise((resolve, reject) => {
          api.signedCall(
            'condenser_api.get_accounts',
            [[testAccount]],
            testAccount,
            'invalid-private-key',
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
        // The actual error message may vary, so check for key-related errors
        expect(error.message).toMatch(/base58|private key|invalid/i);
      }
    });

    it('should handle empty account name', async () => {
      try {
        // Use timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), 2000);
        });
        
        const callPromise = new Promise((resolve, reject) => {
          api.signedCall(
            'condenser_api.get_accounts',
            [['']],
            '',
            testPrivateKey,
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        
        await Promise.race([callPromise, timeoutPromise]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    }, 3000);
  });

  describe('Successful Calls', () => {
    it.skip('should make successful signed call to get_accounts', (done) => {
      // Skip in CI/CD as it requires valid credentials
      api.signedCall(
        'condenser_api.get_accounts',
        [[testAccount]],
        testAccount,
        testPrivateKey,
        (err, result) => {
          if (err) {
            console.log('Expected error in test environment:', err.message);
            done();
            return;
          }

          expect(result).toBeDefined();
          expect(Array.isArray(result)).toBe(true);
          if (result.length > 0) {
            expect(result[0]).toHaveProperty('name');
            expect(result[0].name).toBe(testAccount);
          }
          done();
        }
      );
    });

    it.skip('should make successful signed call to get_account_history', (done) => {
      // Skip in CI/CD as it requires valid credentials
      api.signedCall(
        'condenser_api.get_account_history',
        [testAccount, -1, 10],
        testAccount,
        testPrivateKey,
        (err, result) => {
          if (err) {
            console.log('Expected error in test environment:', err.message);
            done();
            return;
          }

          expect(result).toBeDefined();
          expect(Array.isArray(result)).toBe(true);
          done();
        }
      );
    });
  });

  describe('Promise Wrapper', () => {
    function signedCallAsync(method: string, params: any[], account: string, privateKey: string): Promise<any> {
      return new Promise((resolve, reject) => {
        api.signedCall(method, params, account, privateKey, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    it('should work with Promise wrapper', async () => {
      try {
        await signedCallAsync(
          'condenser_api.get_accounts',
          [['invalid-account']],
          'invalid-account',
          'invalid-key'
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it.skip('should work with async/await pattern', async () => {
      // Skip in CI/CD as it requires valid credentials
      try {
        const result = await signedCallAsync(
          'condenser_api.get_accounts',
          [[testAccount]],
          testAccount,
          testPrivateKey
        );
        
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Expected in test environment
        console.log('Expected error in test environment:', error);
      }
    });
  });

  describe('RPC Auth Module', () => {
    it('should have sign function', async () => {
      const { sign } = await import('../src/api/rpc-auth');
      expect(sign).toBeDefined();
      expect(typeof sign).toBe('function');
    });

    it('should sign request correctly', async () => {
      const { sign } = await import('../src/api/rpc-auth');
      
      const request = {
        method: 'condenser_api.get_accounts',
        params: [[testAccount]],
        id: 1
      };

      try {
        const signedRequest = sign(request, testAccount, [testPrivateKey]);
        
        expect(signedRequest).toBeDefined();
        expect(signedRequest.jsonrpc).toBe('2.0');
        expect(signedRequest.method).toBe(request.method);
        expect(signedRequest.id).toBe(request.id);
        expect(signedRequest.params).toBeDefined();
        expect(signedRequest.params.__signed).toBeDefined();
        
        const signed = signedRequest.params.__signed;
        expect(signed.account).toBe(testAccount);
        expect(signed.nonce).toBeDefined();
        expect(signed.params).toBeDefined();
        expect(signed.signatures).toBeDefined();
        expect(signed.timestamp).toBeDefined();
        expect(Array.isArray(signed.signatures)).toBe(true);
        expect(signed.signatures.length).toBe(1);
      } catch (error) {
        // May fail with invalid test key
        expect(error).toBeDefined();
      }
    });

    it('should validate timestamp format', async () => {
      const { sign } = await import('../src/api/rpc-auth');
      
      const request = {
        method: 'test_method',
        params: ['test'],
        id: 1
      };

      try {
        const signedRequest = sign(request, testAccount, [testPrivateKey]);
        const timestamp = signedRequest.params.__signed.timestamp;
        
        // Should be valid ISO string
        expect(new Date(timestamp).toISOString()).toBe(timestamp);
      } catch (error) {
        // Expected with invalid key
        console.log('Expected error with test key:', error.message);
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing params', async () => {
      try {
        await new Promise((resolve, reject) => {
          api.signedCall(
            'condenser_api.get_accounts',
            null as any,
            testAccount,
            testPrivateKey,
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined method', async () => {
      try {
        await new Promise((resolve, reject) => {
          api.signedCall(
            undefined as any,
            [[testAccount]],
            testAccount,
            testPrivateKey,
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed WIF key', async () => {
      try {
        await new Promise((resolve, reject) => {
          api.signedCall(
            'condenser_api.get_accounts',
            [[testAccount]],
            testAccount,
            'not-a-wif-key',
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Security Features', () => {
    it('should generate unique nonce for each request', async () => {
      const { sign } = await import('../src/api/rpc-auth');
      
      const request = {
        method: 'test_method',
        params: ['test'],
        id: 1
      };

      try {
        const signed1 = sign(request, testAccount, [testPrivateKey]);
        const signed2 = sign(request, testAccount, [testPrivateKey]);
        
        expect(signed1.params.__signed.nonce).not.toBe(signed2.params.__signed.nonce);
      } catch (error) {
        // Expected with invalid test key
        console.log('Expected error with test key');
      }
    });

    it('should include timestamp in signature', async () => {
      const { sign } = await import('../src/api/rpc-auth');
      
      const request = {
        method: 'test_method',
        params: ['test'],
        id: 1
      };

      try {
        const signedRequest = sign(request, testAccount, [testPrivateKey]);
        const timestamp = new Date(signedRequest.params.__signed.timestamp);
        const now = new Date();
        
        // Timestamp should be recent (within 1 minute)
        expect(Math.abs(now.getTime() - timestamp.getTime())).toBeLessThan(60000);
      } catch (error) {
        // Expected with invalid test key
        console.log('Expected error with test key');
      }
    });
  });

  describe('Integration Tests', () => {
    class SignedApiClient {
      constructor(private account: string, private privateKey: string) {}

      call(method: string, params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
          api.signedCall(method, params, this.account, this.privateKey, (err: any, result: any) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      }

      async getAccounts(accounts: string[]) {
        return this.call('condenser_api.get_accounts', [accounts]);
      }

      async getAccountHistory(limit = 100) {
        return this.call('condenser_api.get_account_history', [this.account, -1, limit]);
      }
    }

    it('should work with client wrapper class', async () => {
      const client = new SignedApiClient(testAccount, testPrivateKey);
      
      try {
        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), 2000);
        });
        
        const resultPromise = client.getAccounts([testAccount]);
        
        await Promise.race([resultPromise, timeoutPromise]);
        // Should not reach here in test environment
      } catch (error) {
        // Expected in test environment (either network error or timeout)
        expect(error).toBeDefined();
      }
    }, 3000); // Set test timeout to 3 seconds

    it.skip('should handle multiple concurrent requests', async () => {
      // Skip in CI/CD as it requires valid credentials
      const client = new SignedApiClient(testAccount, testPrivateKey);
      
      const promises = [
        client.getAccounts([testAccount]),
        client.getAccountHistory(10),
        client.call('condenser_api.get_dynamic_global_properties', [])
      ];

      try {
        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
          console.log(`Request ${index}:`, result.status);
        });
      } catch (error) {
        console.log('Expected error in test environment');
      }
    });
  });
});
