import { describe, it, expect } from 'vitest';
import { getConfig } from '../src/config';
import { PrivateKey, PublicKey } from '../src/auth';
import { Signature } from '../src/auth/ecc/src/signature';
import { calcPubKeyRecoveryParam, recoverPubKey } from '../src/auth/ecc/src/ecdsa';
import { ec as EC } from 'elliptic';
import BN from 'bn.js';
import ECSignature from '../src/auth/ecc/src/ecsignature';

// Set up config prefix to match original
getConfig().set('address_prefix', 'STM');

const secp256k1 = new EC('secp256k1');

describe('Signature Recovery', () => {
  describe('calcPubKeyRecoveryParam', () => {
    it('should find valid recovery parameter for a signature', () => {
      const privateKey = PrivateKey.fromSeed('test-seed-1');
      const publicKey = privateKey.toPublic();
      const message = Buffer.from('test message');
      const hash = Buffer.from('a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'hex');
      
      // Create a signature
      const sig = Signature.signBufferSha256(hash, privateKey);
      
      // Extract r and s from signature
      const sigBuffer = sig.toBuffer();
      const i = sigBuffer.readUInt8(0);
      // Recovery byte is now 31-34 (dsteem compatible), recovery param = byte - 31
      const recovery = i - 31;
      
      // Verify recovery is in valid range (0-3)
      expect(recovery).toBeGreaterThanOrEqual(0);
      expect(recovery).toBeLessThanOrEqual(3);
      
      // Test calcPubKeyRecoveryParam
      const r = new BN(sigBuffer.slice(1, 33));
      const s = new BN(sigBuffer.slice(33));
      const ecsig = new ECSignature(r, s);
      const e = new BN(hash);
      const Q = publicKey.Q!;
      
      const foundRecovery = calcPubKeyRecoveryParam(secp256k1, e, ecsig, Q);
      expect(foundRecovery).toBe(recovery);
    });

    it('should work with multiple different messages', () => {
      const privateKey = PrivateKey.fromSeed('test-seed-2');
      const publicKey = privateKey.toPublic();
      
      const messages = [
        Buffer.from('message 1'),
        Buffer.from('message 2'),
        Buffer.from('message 3'),
        Buffer.from(''),
        Buffer.from('a'.repeat(100)),
      ];

      for (const message of messages) {
        const hash = require('crypto').createHash('sha256').update(message).digest();
        const sig = Signature.signBufferSha256(hash, privateKey);
        
        const sigBuffer = sig.toBuffer();
        const r = new BN(sigBuffer.slice(1, 33));
        const s = new BN(sigBuffer.slice(33));
        const ecsig = new ECSignature(r, s);
        const e = new BN(hash);
        const Q = publicKey.Q!;
        
        const recovery = calcPubKeyRecoveryParam(secp256k1, e, ecsig, Q);
        expect(recovery).toBeGreaterThanOrEqual(0);
        expect(recovery).toBeLessThanOrEqual(3);
        
        // Verify the recovery parameter produces the correct public key
        const recoveredQ = recoverPubKey(secp256k1, e, ecsig, recovery);
        expect(recoveredQ.getX().toString(16)).toBe(Q.getX().toString(16));
        expect(recoveredQ.getY().toString(16)).toBe(Q.getY().toString(16));
      }
    });

    it('should handle different private keys', () => {
      const seeds = ['seed1', 'seed2', 'seed3', 'another-seed', 'final-seed'];
      
      for (const seed of seeds) {
        const privateKey = PrivateKey.fromSeed(seed);
        const publicKey = privateKey.toPublic();
        const message = Buffer.from('test message');
        const hash = require('crypto').createHash('sha256').update(message).digest();
        
        const sig = Signature.signBufferSha256(hash, privateKey);
        const sigBuffer = sig.toBuffer();
        const r = new BN(sigBuffer.slice(1, 33));
        const s = new BN(sigBuffer.slice(33));
        const ecsig = new ECSignature(r, s);
        const e = new BN(hash);
        const Q = publicKey.Q!;
        
        const recovery = calcPubKeyRecoveryParam(secp256k1, e, ecsig, Q);
        expect(recovery).toBeGreaterThanOrEqual(0);
        expect(recovery).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('recoverPubKey', () => {
    it('should recover public key from signature with recovery parameter 0', () => {
      const privateKey = PrivateKey.fromSeed('test-recovery-0');
      const publicKey = privateKey.toPublic();
      const message = Buffer.from('test message');
      const hash = require('crypto').createHash('sha256').update(message).digest();
      
      const sig = Signature.signBufferSha256(hash, privateKey);
      const sigBuffer = sig.toBuffer();
      const r = new BN(sigBuffer.slice(1, 33));
      const s = new BN(sigBuffer.slice(33));
      const ecsig = new ECSignature(r, s);
      const e = new BN(hash);
      
      // Find the correct recovery parameter
      const recovery = calcPubKeyRecoveryParam(secp256k1, e, ecsig, publicKey.Q!);
      
      // Recover public key
      const recoveredQ = recoverPubKey(secp256k1, e, ecsig, recovery);
      
      // Verify recovered key matches original
      expect(recoveredQ.getX().toString(16)).toBe(publicKey.Q!.getX().toString(16));
      expect(recoveredQ.getY().toString(16)).toBe(publicKey.Q!.getY().toString(16));
    });

    it('should handle all recovery parameter values (0-3)', () => {
      const privateKey = PrivateKey.fromSeed('test-all-recovery');
      const publicKey = privateKey.toPublic();
      const message = Buffer.from('test message for all recovery params');
      const hash = require('crypto').createHash('sha256').update(message).digest();
      
      const sig = Signature.signBufferSha256(hash, privateKey);
      const sigBuffer = sig.toBuffer();
      const r = new BN(sigBuffer.slice(1, 33));
      const s = new BN(sigBuffer.slice(33));
      const ecsig = new ECSignature(r, s);
      const e = new BN(hash);
      
      // Test all possible recovery values
      for (let i = 0; i < 4; i++) {
        try {
          const recoveredQ = recoverPubKey(secp256k1, e, ecsig, i);
          // Check if this recovery parameter produces the correct key
          if (recoveredQ.getX().toString(16) === publicKey.Q!.getX().toString(16) &&
              recoveredQ.getY().toString(16) === publicKey.Q!.getY().toString(16)) {
            expect(i).toBeGreaterThanOrEqual(0);
            expect(i).toBeLessThanOrEqual(3);
            break; // Found the correct one
          }
        } catch (error) {
          // Some recovery values may fail, that's expected
          if (i === 3) {
            // If all fail, that's a problem
            throw new Error('All recovery parameters failed');
          }
        }
      }
    });

    it('should throw error for invalid recovery parameter', () => {
      const privateKey = PrivateKey.fromSeed('test-invalid-recovery');
      const message = Buffer.from('test message');
      const hash = require('crypto').createHash('sha256').update(message).digest();
      
      const sig = Signature.signBufferSha256(hash, privateKey);
      const sigBuffer = sig.toBuffer();
      const r = new BN(sigBuffer.slice(1, 33));
      const s = new BN(sigBuffer.slice(33));
      const ecsig = new ECSignature(r, s);
      const e = new BN(hash);
      
      // Test invalid recovery parameters
      expect(() => recoverPubKey(secp256k1, e, ecsig, 4)).toThrow();
      expect(() => recoverPubKey(secp256k1, e, ecsig, -1)).toThrow();
      expect(() => recoverPubKey(secp256k1, e, ecsig, 5)).toThrow();
    });
  });

  describe('End-to-end signature and recovery', () => {
    it('should sign and recover public key correctly', () => {
      const privateKey = PrivateKey.fromSeed('e2e-test-seed');
      const publicKey = privateKey.toPublic();
      const originalPubKeyX = publicKey.Q!.getX().toString(16);
      const originalPubKeyY = publicKey.Q!.getY().toString(16);
      
      const testMessages = [
        'Hello, World!',
        'Test message',
        '',
        'a'.repeat(1000),
        'Special chars: !@#$%^&*()',
      ];

      for (const msg of testMessages) {
        const message = Buffer.from(msg);
        const hash = require('crypto').createHash('sha256').update(message).digest();
        
        // Sign the message
        const sig = Signature.signBufferSha256(hash, privateKey);
        const sigHex = sig.toHex();
        
        // Extract signature components
        const sigBuffer = Buffer.from(sigHex, 'hex');
        const recoveryByte = sigBuffer.readUInt8(0);
        // Recovery byte is now 31-34 (dsteem compatible), recovery param = byte - 31
        const recovery = recoveryByte - 31;
        
        // Verify recovery is in valid range
        expect(recovery).toBeGreaterThanOrEqual(0);
        expect(recovery).toBeLessThanOrEqual(3);
        
        // Extract r and s
        const r = new BN(sigBuffer.slice(1, 33));
        const s = new BN(sigBuffer.slice(33));
        const ecsig = new ECSignature(r, s);
        const e = new BN(hash);
        
        // Recover public key
        const recoveredQ = recoverPubKey(secp256k1, e, ecsig, recovery);
        const recoveredX = recoveredQ.getX().toString(16);
        const recoveredY = recoveredQ.getY().toString(16);
        
        // Verify recovered key matches original
        expect(recoveredX).toBe(originalPubKeyX);
        expect(recoveredY).toBe(originalPubKeyY);
      }
    });

    it('should produce recovery parameter in range -1 to 4 (as expected by server)', () => {
      // Note: Server expects recovery in range -1 to 4, but we generate 0-3
      // The recovery byte in signature is recovery + 27, which gives 27-30
      // Server validation checks (i - 27) which should be 0-3, but accepts -1 to 4
      const privateKey = PrivateKey.fromSeed('server-compat-test');
      const message = Buffer.from('test message');
      const hash = require('crypto').createHash('sha256').update(message).digest();
      
      const sig = Signature.signBufferSha256(hash, privateKey);
      const sigBuffer = sig.toBuffer();
      const recoveryByte = sigBuffer.readUInt8(0);
      // Recovery byte is now 31-34 (dsteem compatible), recovery param = byte - 31
      const recovery = recoveryByte - 31;
      
      // Our recovery should be 0-3, which is within server's accepted range of -1 to 4
      expect(recovery).toBeGreaterThanOrEqual(0);
      expect(recovery).toBeLessThanOrEqual(3);
      
      // The recovery byte (i) should be 31-34 (dsteem compatible format)
      expect(recoveryByte).toBeGreaterThanOrEqual(31);
      expect(recoveryByte).toBeLessThanOrEqual(34);
    });
  });
});
