/**
 * @file JSONRPC 2.0 request authentication with steem authorities.
 * Based on the original @steemit/rpc-auth package
 */

import { createHash, randomBytes } from 'crypto';
import { PrivateKey } from '../auth/ecc';

/**
 * Signing constant used to reserve opcode space and prevent cross-protocol attacks.
 * Output of `sha256('steem_jsonrpc_auth')`.
 */
export const K = Buffer.from('3b3b081e46ea808d5a96b08c4bc5003f5e15767090f344faab531ec57565136b', 'hex');

/**
 * Create request hash to be signed.
 *
 * @param timestamp  ISO8601 formatted date e.g. `2017-11-14T19:40:29.077Z`.
 * @param account    Steem account name that is the signer.
 * @param method     RPC request method.
 * @param params     Base64 encoded JSON string containing request params.
 * @param nonce      8 bytes of random data.
 *
 * @returns bytes to be signed or validated.
 */
function hashMessage(timestamp, account, method, params, nonce) {
  const first = createHash('sha256');
  first.update(timestamp);
  first.update(account);
  first.update(method);
  first.update(params);

  const second = createHash('sha256');
  second.update(K);
  second.update(first.digest());
  second.update(nonce);

  return second.digest();
}

/**
 * Sign a JSON RPC Request.
 */
export function sign(request, account, keys) {
  if (!request.params) {
    throw new Error('Unable to sign a request without params');
  }

  const params = Buffer.from(JSON.stringify(request.params), 'utf8').toString('base64');
  const nonceBytes = randomBytes(8);
  const nonce = nonceBytes.toString('hex');
  const timestamp = new Date().toISOString();

  const message = hashMessage(
    timestamp, account, request.method, params, nonceBytes
  );

  const signatures = [];
  for (let key of keys) {
    if (typeof key === 'string') {
      key = PrivateKey.fromString(key);
    }
    const signature = key.sign(message).toHex();
    signatures.push(signature);
  }

  return {
    jsonrpc: '2.0',
    method: request.method,
    id: request.id,
    params: {
      __signed: {
        account,
        nonce,
        params,
        signatures,
        timestamp,
      }
    }
  };
}

/**
 * Validate a signed JSON RPC request.
 * Throws a ValidationError if the request fails validation.
 *
 * @returns Resolved request params.
 */
export async function validate(request, verify) {
  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    throw new Error('Invalid JSON RPC Request');
  }

  if (request.params == undefined || request.params.__signed == undefined) {
    throw new Error('Signed payload missing');
  }

  if (Object.keys(request.params).length !== 1) {
    throw new Error('Invalid request params');
  }

  const signed = request.params.__signed;

  if (signed.account == undefined) {
    throw new Error('Missing account');
  }

  let params;
  try {
    const jsonString = Buffer.from(signed.params, 'base64').toString('utf8');
    params = JSON.parse(jsonString);
  } catch (cause) {
    throw new Error(`Invalid encoded params: ${cause.message}`);
  }

  if (signed.nonce == undefined || typeof signed.nonce !== 'string') {
    throw new Error('Invalid nonce');
  }
  const nonce = Buffer.from(signed.nonce, 'hex');
  if (nonce.length !== 8) {
    throw new Error('Invalid nonce');
  }

  const timestamp = Date.parse(signed.timestamp);
  if (Number.isNaN(timestamp)) {
    throw new Error('Invalid timestamp');
  }

  if (Date.now() - timestamp > 60 * 1000) {
    throw new Error('Signature expired');
  }

  const message = hashMessage(
    signed.timestamp, signed.account, request.method, signed.params, nonce
  );

  try {
    await verify(message, signed.signatures, signed.account);
  } catch (cause) {
    throw new Error(`Verification failed: ${cause.message}`);
  }

  return params;
}

export default {
  sign,
  validate,
  K
}; 