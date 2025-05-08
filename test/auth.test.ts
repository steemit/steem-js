import { describe, it, expect } from 'vitest';
import {
  verify,
  generateKeys,
  getPrivateKeys,
  isWif,
  toWif,
  wifIsValid,
  wifToPublic,
  isPubkey,
  signTransaction
} from '../src/auth';

describe('Auth', () => {
  const username = 'testuser';
  const password = 'testpass';
  const roles = ['owner', 'active', 'posting', 'memo'];

  describe('generateKeys', () => {
    it('should generate keys from username and password', () => {
      const keys = generateKeys(username, password, roles);
      expect(keys).toBeDefined();
      expect(keys).toHaveProperty('owner');
      expect(keys).toHaveProperty('active');
      expect(keys).toHaveProperty('posting');
      expect(keys).toHaveProperty('memo');
      Object.values(keys).forEach(key => {
        expect(key).toMatch(/^STM[A-Za-z0-9]{50}$/);
      });
    });
  });

  describe('getPrivateKeys', () => {
    it('should get private keys for roles', () => {
      const keys = getPrivateKeys(username, password, roles);
      expect(keys).toBeDefined();
      expect(typeof keys).toBe('object');
      roles.forEach(role => {
        expect(keys).toHaveProperty(role);
        expect(keys[role]).toMatch(/^5[A-Za-z0-9]{50}$/);
        expect(keys).toHaveProperty(role + 'Pubkey');
        expect(keys[role + 'Pubkey']).toMatch(/^STM[A-Za-z0-9]{50}$/);
      });
    });
  });

  describe('toWif', () => {
    it('should generate valid WIF key', () => {
      const wif = toWif(username, password, 'owner');
      expect(wif).toBeDefined();
      expect(wif).toMatch(/^5[A-Za-z0-9]{50}$/);
      expect(isWif(wif)).toBe(true);
    });
  });

  describe('wifToPublic', () => {
    it('should convert WIF to public key', () => {
      const wif = toWif(username, password, 'owner');
      const pubKey = wifToPublic(wif);
      expect(pubKey).toBeDefined();
      expect(pubKey).toMatch(/^STM[A-Za-z0-9]{50}$/);
      expect(isPubkey(pubKey)).toBe(true);
    });
  });

  describe('isWif', () => {
    it('should validate WIF format', () => {
      const wif = toWif(username, password, 'owner');
      expect(isWif(wif)).toBe(true);
      expect(isWif('invalid')).toBe(false);
    });
  });

  describe('isPubkey', () => {
    it('should validate public key format', () => {
      const wif = toWif(username, password, 'owner');
      const pubKey = wifToPublic(wif);
      expect(isPubkey(pubKey)).toBe(true);
      expect(isPubkey('invalid')).toBe(false);
    });
  });

  describe('wifIsValid', () => {
    it('should validate WIF and public key pair', () => {
      const wif = toWif(username, password, 'owner');
      const pubKey = wifToPublic(wif);
      expect(wifIsValid(wif, pubKey)).toBe(true);
      expect(wifIsValid(wif, 'invalid')).toBe(false);
    });
  });
}); 