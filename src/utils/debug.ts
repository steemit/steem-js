/**
 * Debug utility for controlled debug output
 * Can be enabled via:
 * 1. Config: steem.config.set({ debug: true })
 * 2. Environment variable: DEBUG=steem-js or DEBUG=steem-js:*
 * 3. Specific debug flags: DEBUG=steem-js:transaction,steem-js:signature
 */

import { getConfig } from '../config';

// Safely get process.env for browser compatibility
function getProcessEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

// Check if debug is enabled via environment variable
const DEBUG_ENV = getProcessEnv('DEBUG') || '';
const DEBUG_ENABLED = DEBUG_ENV.includes('steem-js');

// Parse debug flags from environment
const DEBUG_FLAGS = DEBUG_ENV ? DEBUG_ENV.split(',').map(f => f.trim()) : [];

function isDebugEnabled(flag?: string): boolean {
  // Check config first
  const configDebug = getConfig().get('debug');
  if (configDebug === true) {
    return true;
  }
  if (configDebug === false) {
    return false;
  }

  // Check environment variable
  if (!DEBUG_ENABLED) {
    return false;
  }

  // If no flag specified, check for general steem-js debug
  if (!flag) {
    return DEBUG_ENV.includes('steem-js') && !DEBUG_ENV.includes('steem-js:');
  }

  // Check for specific flag
  const flagPattern = `steem-js:${flag}`;
  return DEBUG_FLAGS.some(f => f === flagPattern || f === 'steem-js:*');
}

export const debug = {
  /**
   * Log debug information
   * @param flag - Optional debug flag (e.g., 'transaction', 'signature')
   * @param args - Arguments to log
   */
  log(flag?: string, ...args: unknown[]): void {
    if (isDebugEnabled(flag)) {
      const prefix = flag ? `[steem-js:${flag}]` : '[steem-js]';
      console.log(prefix, ...args);
    }
  },

  /**
   * Log transaction debug info
   */
  transaction(...args: unknown[]): void {
    this.log('transaction', ...args);
  },

  /**
   * Log signature debug info
   */
  signature(...args: unknown[]): void {
    this.log('signature', ...args);
  },

  /**
   * Log warning (always shown, but can be controlled)
   */
  warn(...args: unknown[]): void {
    if (isDebugEnabled() || getConfig().get('debug_warnings') !== false) {
      console.warn('[steem-js]', ...args);
    }
  },

  /**
   * Log error (always shown)
   */
  error(...args: unknown[]): void {
    console.error('[steem-js]', ...args);
  },

  /**
   * Check if debug is enabled for a specific flag
   */
  isEnabled(flag?: string): boolean {
    return isDebugEnabled(flag);
  }
};

export default debug;

