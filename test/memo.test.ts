import { describe, it, expect } from 'vitest';
import { encode, decode } from '../src/memo';
import { PrivateKey } from '../src/auth/ecc/src/key_private';

describe('steem.auth: memo', () => {
    const private_key = PrivateKey.fromSeed("")
    const public_key = private_key.toPublicKey()

    it('plain text', () => {
        const plaintext1 = encode(null, null, 'memo');
        expect(plaintext1).toBe('memo');

        const plaintext2 = decode(null, plaintext1);
        expect(plaintext2).toBe('memo');
    });

    it('encryption obj params', () => {
        const cypertext = encode(private_key, public_key, '#memo');
        const plaintext = decode(private_key, cypertext);
        expect(plaintext).toBe('#memo');
    });

    it('encryption string params', () => {
        const cypertext = encode(private_key.toWif(), public_key.toString(), '#memo2');
        const plaintext = decode(private_key.toWif(), cypertext);
        expect(plaintext).toBe('#memo2');
    });

    it('known encryption', () => {
        const text = '#爱';
        const nonce = '1462976530069648';
        const cypertext = encode(private_key, public_key, text, nonce);
        const plaintext = decode(private_key, cypertext);
        expect(plaintext).toBe(text);
    });
}); 