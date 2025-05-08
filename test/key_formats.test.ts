import { describe, it, expect } from 'vitest';
import { PrivateKey, PublicKey, Address } from '../src/auth';

const testKey = {
  // delegate0
  // sourced from: ./bitshares/programs/utils/bts_create_key
  public_key: 'STM7jDPoMwyjVH5obFmqzFNp4Ffp7G2nvC7FKFkrMBpo7Sy4uq5Mj',
  private_key: '20991828d456b389d0768ed7fb69bf26b9bb87208dd699ef49f10481c20d3e18',
  private_key_WIF_format: '5J4eFhjREJA7hKG6KcvHofHMXyGQZCDpQE463PAaKo9xXY6UDPq',
  bts_address: 'STM8DvGQqzbgCR5FHiNsFf8kotEXr8VKD3mR',
  pts_address: 'Po3mqkgMzBL4F1VXJArwQxeWf3fWEpxUf3',
  encrypted_private_key: '5e1ae410919c450dce1c476ae3ed3e5fe779ad248081d85b3dcf2888e698744d0a4b60efb7e854453bec3f6883bcbd1d',
  blockchain_address: '4f3a560442a05e4fbb257e8dc5859b736306bace',
  // https://github.com/BitShares/bitshares/blob/2602504998dcd63788e106260895769697f62b07/libraries/wallet/wallet_db.cpp#L103-L108
  Uncompressed_BTC: 'STMLAFmEtM8as1mbmjVcj5dphLdPguXquimn',
  Compressed_BTC: 'STMANNTSEaUviJgWLzJBersPmyFZBY4jJETY',
  Uncompressed_PTS: 'STMEgj7RM6FBwSoccGaESJLC3Mi18785bM3T',
  Compressed_PTS: 'STMD5rYtofD6D4UHJH6mo953P5wpBfMhdMEi',
  // https://github.com/steemit/steem-js/issues/267
  null_hex: '000000000000000000000000000000000000000000000000000000000000000000',
  null_address: 'STM1111111111111111111111111111111114T1Anm'
};

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