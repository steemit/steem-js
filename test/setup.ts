// This file sets up the test environment
import { beforeAll } from 'vitest';
import { setConfig } from '../src/config';

// Ensure NODE_ENV is set to 'test'
process.env.NODE_ENV = 'test';

// Set default config for tests
beforeAll(() => {
  setConfig({
    address_prefix: 'STM',
    chain_id: '0000000000000000000000000000000000000000000000000000000000000000',
    node: 'https://api.steemit.com',
    nodes: ['https://api.steemit.com'],
    websocket: 'wss://api.steemit.com'
  });
}); 