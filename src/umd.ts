import { setOptions as setApiOptions, Api } from './api';
import api from './api'; // Import singleton instance from api module
import { setOptions as setConfigOptions, getConfig } from './config';
import * as auth from './auth';
import * as broadcast from './broadcast';
import * as formatter from './formatter';
import * as memo from './memo';
import * as operations from './operations';
import * as utils from './utils';
import * as crypto from './crypto';
// Import buffer module for UMD builds to expose Buffer globally
import { Buffer as BufferPolyfill } from 'buffer';

// Use the singleton API instance exported from api module
// This ensures steem.api and setOptions() operate on the same instance

// Create the main steem object with all modules - this will be the default export for UMD
const steem = {
  api,
  Api, // Export Api class for creating multiple instances
  auth,
  broadcast,
  formatter,
  memo,
  operations,
  utils,
  ...crypto,
  version: '__VERSION__',
  config: {
    set: (options: Record<string, unknown>) => {
      // If nodes is provided, extract the first node as url for API
      const apiOptions: Record<string, unknown> = { ...options };
      if (options.nodes && Array.isArray(options.nodes) && options.nodes.length > 0) {
        apiOptions.url = options.nodes[0];
      }
      setApiOptions(apiOptions);
      setConfigOptions(options);
    },
    get: (key: string) => getConfig().get(key),
    getBoolean: (key: string) => getConfig().getBoolean(key),
    getNumber: (key: string) => getConfig().getNumber(key),
    getString: (key: string) => getConfig().getString(key),
    all: () => getConfig().all()
  }
};

// For the broadcast module to have access to the api
if (typeof broadcast.setApi === 'function') {
  broadcast.setApi(api);
}

// Make Buffer available globally for UMD builds
// This ensures Buffer is available before the script finishes loading
// Browser doesn't have native Buffer, so we use the buffer polyfill package
if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
  try {
    // BufferPolyfill is imported from 'buffer' package (polyfill for browser)
    // Expose it globally so code can use Buffer directly
    if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
      (globalThis as { Buffer?: typeof BufferPolyfill }).Buffer = BufferPolyfill;
    }
    if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
      (window as { Buffer?: typeof BufferPolyfill }).Buffer = BufferPolyfill;
    }
  } catch {
    // Buffer should be available from the inject plugin transformation
  }
}

// Export as default for UMD builds to avoid nesting
export default steem;
