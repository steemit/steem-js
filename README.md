# Steem.js

Steem.js is a JavaScript/TypeScript library for interacting with the Steem blockchain.

## Status

This is a complete refactoring of the original steem-js library, migrating from JavaScript to TypeScript with modern tooling and improved code quality. Published as `@steemit/steem-js`.

## 📚 Complete API Documentation

**[👉 View Complete API Documentation and Usage Guide](./docs/README.md)**

The comprehensive API documentation includes:
- Detailed installation and configuration instructions
- Complete reference for all API methods
- Practical usage examples and code snippets
- TypeScript type support documentation
- Error handling and security considerations

### Refactoring Progress

- ✅ **TypeScript Migration**: Complete migration from JavaScript to TypeScript
- ✅ **Build System**: Migrated from Webpack to Rollup
- ✅ **Testing**: Migrated from Mocha to Vitest
- ✅ **Modern Dependencies (2025)**: Replaced outdated cryptographic libraries
  - `bigi` → `bn.js` (modern big integer library)
  - `ecurve` → `elliptic` (modern elliptic curve cryptography)
  - Removed all shim layers for direct modern library usage
- ✅ **Core Modules**: All core functionality implemented
  - API module with HTTP and WebSocket transports
  - Authentication and encryption (ECC secp256k1)
  - Broadcast operations
  - Memo encryption/decryption
  - Transaction serialization (95.8% test coverage)
- ✅ **Security**: Fixed insecure random number generation, implemented proper cryptographic functions
- ✅ **Tests**: 174 tests passing, 12 skipped (network-dependent integration tests)

> 📖 **Detailed Refactoring Documentation**: See [docs/refactoring-2025.md](./docs/refactoring-2025.md) for complete modernization refactoring process, technical choices, and architectural improvements.

## Installation

```bash
pnpm install
# or
npm install
```

## Installation

### npm / pnpm / yarn

```bash
npm install @steemit/steem-js
# or
pnpm install @steemit/steem-js
# or
yarn add @steemit/steem-js
```

### Browser (CDN)

```html
<!-- Include @steemit/steem-js (all dependencies are bundled) -->
<!-- For production: use minified version (692KB) -->
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.min.js"></script>

<!-- For development: use regular version (1.7MB) with better debugging -->
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.js"></script>
```

**Note**: The UMD build includes all necessary polyfills (events, buffer, util, stream, assert, crypto-browserify). No additional dependencies are required. The minified version is recommended for production use.

## Quick Start

> 💡 **Need detailed documentation?** [View the complete API documentation](./docs/README.md) for detailed descriptions, parameters, and examples of all methods.

## Usage

### Node.js / TypeScript / ES Modules

```typescript
import { steem } from '@steemit/steem-js';

// Configure the API endpoint
steem.config.set({
  node: 'https://api.steemit.com',
  address_prefix: 'STM',
  chain_id: '0000000000000000000000000000000000000000000000000000000000000000'
});

// Get account information
const account = await steem.api.getAccountAsync('ned');
console.log(account);

// Generate keys
const keys = steem.auth.generateKeys('username', 'password', ['owner', 'active', 'posting', 'memo']);
console.log(keys);

// Sign and verify messages
import { generateKeyPair, sign, verify } from '@steemit/steem-js/crypto';
const keyPair = generateKeyPair();
const message = 'Hello, Steem!';
const signature = sign(message, keyPair.privateKey);
const isValid = verify(message, signature, keyPair.publicKey);
console.log('Signature valid:', isValid);
```

### Node.js / CommonJS

```javascript
const { steem } = require('@steemit/steem-js');

steem.config.set({
  node: 'https://api.steemit.com',
  address_prefix: 'STM'
});

const account = await steem.api.getAccountAsync('ned');
console.log(account);
```

### Browser (Script Tag)

The UMD build includes all necessary dependencies and polyfills, so you can use it directly without any additional setup.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Steem.js Example</title>
  <!-- Include @steemit/steem-js (minified for production) -->
  <script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.min.js"></script>
</head>
<body>
  <script>
    // Use the global 'steem' object
    steem.config.set({
      node: 'https://api.steemit.com',
      address_prefix: 'STM'
    });

    // Get account information
    steem.api.getAccountAsync('ned')
      .then(account => {
        console.log('Account:', account);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  </script>
</body>
</html>
```

**Note**: The UMD build comes in two versions:
- **Minified** (`index.umd.min.js` - 692KB): Recommended for production
- **Regular** (`index.umd.js` - 1.7MB): Better for development and debugging

Both include all polyfills, making them ready to use in browsers without additional dependencies. For production use with bundlers (Webpack, Vite, Rollup), use the ES Module or CommonJS builds instead.

### Broadcast Operations

```typescript
import { steem } from '@steemit/steem-js';

// Vote on a post
const postingWif = steem.auth.toWif('username', 'password', 'posting');
await steem.broadcast.voteAsync(
  postingWif,
  'voter',
  'author',
  'permlink',
  10000 // weight
);

// Transfer STEEM
await steem.broadcast.transferAsync(
  activeWif,
  'from',
  'to',
  '1.000 STEEM',
  'memo'
);
```

## Development

### Build

```bash
pnpm build
```

### Test

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Type Check

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
src/
  api/          # API client with HTTP and WebSocket transports
  auth/         # Authentication and key management
  broadcast/    # Transaction broadcasting
  crypto/       # Cryptographic utilities
  formatter/    # Data formatting
  memo/         # Encrypted memo handling
  operations/   # Operation type definitions
  serializer/   # Transaction serialization
  utils/        # Utility functions
```

## Key Features

- **Type Safety**: Full TypeScript support with type definitions
- **Modern ES Modules**: Uses ES modules with CommonJS fallback
- **Secure Cryptography**: Proper implementation using Node.js crypto module
- **Multiple Transports**: Supports both HTTP and WebSocket connections
- **Promise and Callback Support**: Compatible with both async/await and callback patterns
- **📖 Complete Documentation**: [Comprehensive API documentation](./docs/README.md) with examples

## Breaking Changes from Original

This is a complete refactor with the following changes:

1. **TypeScript**: All code is now TypeScript
2. **ES Modules**: Uses ES modules by default (CommonJS available)
3. **Build System**: Uses Rollup instead of Webpack
4. **Testing**: Uses Vitest instead of Mocha
5. **API**: Some method signatures may have changed for better type safety

## Security Notes

- Private keys are never logged or exposed
- Uses cryptographically secure random number generation
- All cryptographic operations use proper implementations

## License

MIT

