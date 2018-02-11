import assert from 'assert'
import {Memo} from '../src/auth/memo';
import {PrivateKey} from '../src/auth/ecc';

const memo = new Memo();

const private_key = PrivateKey.fromSeed("");
const public_key = private_key.toPublicKey();

describe('steem.auth: memo', ()=> {
    it('plain text', () => {
        const plaintext1 = memo.encode(null/*private_key*/, null/*public_key*/, 'memo');
        assert.equal(plaintext1, 'memo');

        const plaintext2 = memo.decode(null/*private_key*/, plaintext1);
        assert.equal(plaintext2, 'memo')
    });
    it('encryption obj params', () => {
        const cypertext = memo.encode(private_key, public_key, '#memo');
        const plaintext = memo.decode(private_key, cypertext);
        assert.equal(plaintext, '#memo')
    });
    it('encryption string params', () => {
        const cypertext = memo.encode(private_key.toWif(), public_key.toPublicKeyString(), '#memo2');
        const plaintext = memo.decode(private_key.toWif(), cypertext);
        assert.equal(plaintext, '#memo2')
    });
    it('known encryption', () => {
        const base58 = '#HU6pdQ4Hh8cFrDVooekRPVZu4BdrhAe9RxrWrei2CwfAApAPdM4PT5mSV9cV3tTuWKotYQF6suyM4JHFBZz4pcwyezPzuZ2na7uwhRcLqFoqCam1VU3eCLjVNqcgUNbH3';
        const nonce = '1462976530069648';
        const text = '#爱';

        const cypertext = memo.encode(private_key, public_key, text, nonce);
        assert.equal(cypertext, base58);
        const plaintext = memo.decode(private_key, cypertext);
        assert.equal(plaintext, text)
    })
});
