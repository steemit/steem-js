import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

export const hash = {
  sha256: (data: Buffer | string): Buffer => {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return Buffer.from(nobleSha256(input));
  }
}; 