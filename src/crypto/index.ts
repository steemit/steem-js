import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { ripemd160 as nobleRipemd160 } from '@noble/hashes/legacy.js';
import { hmac } from '@noble/hashes/hmac.js';
import { randomBytes } from './random-bytes';
import type { KeyPair } from '../auth';
import { PrivateKey, PublicKey } from '../auth';
import { Signature } from '../auth/ecc/src/signature';

export const sha256 = (data: string | Buffer): Buffer => {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.from(nobleSha256(input));
};

export const ripemd160 = (data: string | Buffer): Buffer => {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.from(nobleRipemd160(input));
};

export const doubleSha256 = (data: string | Buffer): Buffer => {
  return sha256(sha256(data));
};

export const hmacSha256 = (key: string | Buffer, data: string | Buffer): Buffer => {
  const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.from(hmac(nobleSha256, keyBuf, dataBuf));
};

/**
 * Generate a cryptographically secure key pair using ECC secp256k1
 * @returns A key pair with private key in WIF format and public key in Steem format
 */
export const generateKeyPair = (): KeyPair => {
  // Generate 32 random bytes for private key
  const privateKeyBytes = randomBytes(32);
  const privateKey = PrivateKey.fromBuffer(privateKeyBytes);
  const publicKey = privateKey.toPublic();
  
  return {
    privateKey: privateKey.toWif(),
    publicKey: publicKey.toString()
  };
};

/**
 * Sign a message with a private key using ECC secp256k1
 * @param message - The message to sign (string or Buffer)
 * @param privateKey - Private key in WIF format
 * @returns Hexadecimal signature string
 */
export const sign = (message: string | Buffer, privateKey: string): string => {
  const privKey = PrivateKey.fromWif(privateKey);
  const messageBuffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
  const sig = Signature.signBuffer(messageBuffer, privKey);
  return sig.toHex();
};

/**
 * Verify a message signature with a public key
 * @param message - The message that was signed (string or Buffer)
 * @param signature - Hexadecimal signature string
 * @param publicKey - Public key in Steem format (e.g., "STM...")
 * @returns True if signature is valid, false otherwise
 */
export const verify = (message: string | Buffer, signature: string, publicKey: string): boolean => {
  try {
    const pub = PublicKey.fromString(publicKey);
    if (!pub || !pub.Q) {
      return false;
    }
    const sigObj = Signature.fromHex(signature);
    const messageBuffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
    return sigObj.verifyBuffer(messageBuffer, pub);
  } catch {
    return false;
  }
}; 