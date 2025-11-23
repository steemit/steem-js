import { describe, it, expect } from 'vitest';
import { getConfig } from '../src/config';
import { PrivateKey, PublicKey } from '../src/auth';
import { Signature } from '../src/auth/ecc/src/signature';
import { sha256 } from '../src/auth/ecc/src/hash';

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