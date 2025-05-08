import { createHash } from 'crypto';

export const hash = {
  sha256: (data: Buffer | string): Buffer => {
    return createHash('sha256').update(data).digest();
  }
}; 