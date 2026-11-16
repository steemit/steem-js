import { describe, it, expect } from 'vitest';
import { PrivateKey, PublicKey, Address } from '../src/auth';
// Published reference vectors (see the fixture's _comment for provenance).
import testKey from './fixtures/key_formats.json';

describe('Key Formats', () => {
  it('calculates public key from private key', () => {
    const privateKey = PrivateKey.fromHex(testKey.private_key);
    const publicKey = privateKey.toPublicKey();
    expect(publicKey.toPublicKeyString()).toBe(testKey.public_key);
  });

  it('creates BTS short address', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    expect(publicKey.toAddressString()).toBe(testKey.bts_address);
  });

  it('creates blockchain address', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    expect(publicKey.toBlockchainAddress().toString('hex')).toBe(testKey.blockchain_address);
  });

  it('handles BTS public key import/export', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    expect(publicKey.toPublicKeyString()).toBe(testKey.public_key);
  });

  it('handles PTS', () => {
    const privateKey = PrivateKey.fromHex(testKey.private_key);
    const publicKey = privateKey.toPublicKey();
    expect(publicKey.toPtsAddy()).toBe(testKey.pts_address);
  });

  it('converts to WIF', () => {
    const privateKey = PrivateKey.fromHex(testKey.private_key);
    expect(privateKey.toWif()).toBe(testKey.private_key_WIF_format);
  });

  it('converts from WIF', () => {
    const privateKey = PrivateKey.fromWif(testKey.private_key_WIF_format);
    expect(privateKey.toHex()).toBe(testKey.private_key);
  });

  it('calculates public key', () => {
    const privateKey = PrivateKey.fromHex(testKey.private_key);
    const publicKey = privateKey.toPublicKey();
    expect(publicKey.toAddressString()).toBe(testKey.bts_address);
  });

  it('handles BTS/BTC uncompressed', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    const address = Address.fromPublic(publicKey, false, 0);
    expect(address.toString()).toBe(testKey.Uncompressed_BTC);
  });

  it('handles BTS/BTC compressed', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    const address = Address.fromPublic(publicKey, true, 0);
    expect(address.toString()).toBe(testKey.Compressed_BTC);
  });

  it('handles BTS/PTS uncompressed', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    const address = Address.fromPublic(publicKey, false, 56);
    expect(address.toString()).toBe(testKey.Uncompressed_PTS);
  });

  it('handles BTS/PTS compressed', () => {
    const publicKey = PublicKey.fromString(testKey.public_key);
    const address = Address.fromPublic(publicKey, true, 56);
    expect(address.toString()).toBe(testKey.Compressed_PTS);
  });

  it('handles null hex to pubkey', () => {
    const publicKey = PublicKey.fromHex(testKey.null_hex);
    expect(publicKey.toPublicKeyString()).toBe(testKey.null_address);
  });

  it('handles null pubkey to hex', () => {
    const publicKey = PublicKey.fromString(testKey.null_address);
    expect(publicKey.toHex()).toBe(testKey.null_hex);
  });
}); 