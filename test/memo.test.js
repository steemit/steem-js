import assert from 'assert'
import {encode, decode} from '../src/auth/memo';
import {PrivateKey} from '../src/auth/ecc';


const private_key = PrivateKey.fromSeed("")
const public_key = private_key.toPublicKey()

describe('memo', ()=> {
    it('encryption', () => {
        const cypertext = encode(private_key, public_key, '#memo')
        const plaintext = decode(private_key, cypertext)
        assert.equal(plaintext, 'memo')
    })
    it('known encryption', () => {
        const base58 = '#HU6pdQ4Hh8cFrDVooekRPVZu4BdrhAe9RxrWrei2CwfAApAPdM4PT5mSV9cV3tTuWKotYQF6suyM4JHFBZz4pcwyezPzuZ2na7uwhRcLqFoqCam1VU3eCLjVNqcgUNbH3'
        const nonce = '1462976530069648'
        const text = '#爱'

        const cypertext = encode(private_key, public_key, text, nonce)
        assert.equal(cypertext, base58)
        const plaintext = decode(private_key, cypertext)
        assert.equal(plaintext, text.substring(1))
    })
})
