/**
 * Universal random bytes implementation
 * Uses Web Crypto API in browser, Node.js crypto in Node.js
 */

/**
 * Get random bytes using the best available method for the environment
 * In browser: uses Web Crypto API (crypto.getRandomValues)
 * In Node.js: uses Node.js crypto.randomBytes
 * @param size Number of bytes to generate
 * @returns Buffer with random bytes
 */
export function randomBytes(size: number): Buffer {
  // Always try Web Crypto API first (works in both browser and Node.js 18+)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);
    return Buffer.from(array);
  }
  
  // Fallback to Node.js crypto only if Web Crypto API is not available
  // This code path is only executed in older Node.js versions (< 18)
  // In browser builds, Rollup will tree-shake this code away because
  // the condition above will always be true in browsers
  try {
    // Use dynamic require to prevent Rollup from bundling crypto in browser builds
    // The try-catch ensures this doesn't break in browser environments
    // @ts-ignore - Dynamic require for Node.js only
    const nodeCrypto = typeof require !== 'undefined' ? require('crypto') : null;
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return nodeCrypto.randomBytes(size);
    }
  } catch {
    // Ignore require errors in browser environments
  }
  
  // If neither Web Crypto API nor Node.js crypto is available, throw error
  throw new Error('Random bytes generation is not available. This library requires either Web Crypto API (browser/Node.js 18+) or Node.js crypto module.');
}

