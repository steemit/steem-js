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
  // This code path should not be reached in Node.js 18+ (which has Web Crypto API)
  // and is kept as a safety fallback for edge cases.
  // In browser builds, Rollup will tree-shake this code away because
  // the condition above will always be true in browsers.
  //
  // Note: This SDK requires Node.js >= 18.0.0 (see package.json engines field).
  // Node.js 18+ has Web Crypto API, so this fallback is rarely needed.
  // In ESM mode, require is undefined, but since Node.js 18+ has Web Crypto API,
  // this code path won't be reached in ESM mode with the minimum required version.
  try {
    // Use dynamic require as a safety fallback (for Node.js < 18 edge cases)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = typeof require !== 'undefined' ? require('crypto') : null;
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return nodeCrypto.randomBytes(size);
    }
  } catch {
    // Ignore require errors in browser environments or ESM mode
  }
  
  // If neither Web Crypto API nor Node.js crypto is available, throw error
  throw new Error('Random bytes generation is not available. This library requires either Web Crypto API (browser/Node.js 18+) or Node.js crypto module.');
}

