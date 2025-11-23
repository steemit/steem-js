import { describe, it, expect } from 'vitest';
import { getConfig } from '../src/config';
import { PrivateKey, PublicKey } from '../src/auth';
import { Signature } from '../src/auth/ecc/src/signature';
import { sha256 } from '../src/auth/ecc/src/hash';
import { generateKeyPair, sign, verify } from '../src/crypto';

// Set up config prefix to match original
getConfig().set('address_prefix', 'STM');

describe('steem.auth: Crypto', () => {
  it('sign', () => {
    const private_key = PrivateKey.fromSeed('1');
    for (let i = 0; i < 10; i++) {
      const sig = Signature.signBuffer(Buffer.alloc(i), private_key);
      expect(sig).toBeDefined();
      expect(typeof sig.toHex()).toBe('string');
    }
  });
});

describe('crypto module', () => {
  describe('generateKeyPair', () => {
    it('should generate a valid key pair', () => {
      const keyPair = generateKeyPair();
      expect(keyPair).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toMatch(/^5[A-Za-z0-9]{50}$/); // WIF format
      expect(keyPair.publicKey).toMatch(/^STM[A-Za-z0-9]{50}$/); // Steem public key format
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });

    it('should generate valid key pairs that can be used for signing', () => {
      const keyPair = generateKeyPair();
      const message = 'test message';
      const signature = sign(message, keyPair.privateKey);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });
  });

  describe('sign', () => {
    it('should sign a message with a private key', () => {
      const privateKey = PrivateKey.fromSeed('test-seed').toWif();
      const message = 'Hello, Steem!';
      const signature = sign(message, privateKey);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0); // Hex signature (typically 128-130 chars)
    });

    it('should sign a Buffer message', () => {
      const privateKey = PrivateKey.fromSeed('test-seed').toWif();
      const message = Buffer.from('Hello, Steem!');
      const signature = sign(message, privateKey);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should produce different signatures for different messages', () => {
      const privateKey = PrivateKey.fromSeed('test-seed').toWif();
      const sig1 = sign('message 1', privateKey);
      const sig2 = sign('message 2', privateKey);
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verify', () => {
    it('should verify a valid signature', () => {
      const keyPair = generateKeyPair();
      const message = 'test message';
      const signature = sign(message, keyPair.privateKey);
      const isValid = verify(message, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const keyPair = generateKeyPair();
      const message = 'test message';
      const invalidSignature = '0'.repeat(128); // Invalid signature
      const isValid = verify(message, invalidSignature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should reject signature for different message', () => {
      const keyPair = generateKeyPair();
      const message1 = 'message 1';
      const message2 = 'message 2';
      const signature = sign(message1, keyPair.privateKey);
      const isValid = verify(message2, signature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      const message = 'test message';
      const signature = sign(message, keyPair1.privateKey);
      const isValid = verify(message, signature, keyPair2.publicKey);
      expect(isValid).toBe(false);
    });

    it('should verify Buffer messages', () => {
      const keyPair = generateKeyPair();
      const message = Buffer.from('test message');
      const signature = sign(message, keyPair.privateKey);
      const isValid = verify(message, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });

    it('should handle invalid public key gracefully', () => {
      const keyPair = generateKeyPair();
      const message = 'test message';
      const signature = sign(message, keyPair.privateKey);
      const isValid = verify(message, signature, 'invalid-public-key');
      expect(isValid).toBe(false);
    });
  });
});

describe('steem.auth: derives', () => {
  const prefix = getConfig().get('address_prefix');
  const one_time_private = PrivateKey.fromHex('8fdfdde486f696fd7c6313325e14d3ff0c34b6e2c390d1944cbfe150f4457168');
  const to_public = PublicKey.fromStringOrThrow(prefix + '7vbxtK1WaZqXsiCHPcjVFBewVj8HFRd5Z5XZDpN6Pvb2dZcMqK');
  const secret = one_time_private.get_shared_secret(to_public);
  const child = sha256(secret);

  it('child from public', () => {
    expect(to_public.child(child).toString()).toBe('STM6XA72XARQCain961PCJnXiKYdEMrndNGago2PV5bcUiVyzJ6iL');
  });

  it('child from private', () => {
    expect(PrivateKey.fromSeed('alice-brain-key').child(child).toPublicKey().toString()).toBe('STM6XA72XARQCain961PCJnXiKYdEMrndNGago2PV5bcUiVyzJ6iL');
  });

  it('shared secret child matches witness_node', () => {
    expect(child.toString('hex')).toBe('1f296fa48172d9af63ef3fb6da8e369e6cc33c1fb7c164207a3549b39e8ef698');
  });

  it('nonce matches witness_node', () => {
    const nonce = sha256(one_time_private.toBuffer());
    expect(nonce.toString('hex')).toBe('462f6c19ece033b5a3dba09f1e1d7935a5302e4d1eac0a84489cdc8339233fbf');
  });
}); 