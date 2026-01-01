# Steem.js

> ⚠️ Under Construction: This SDK is currently under active development.  Do not use it in the production environment.

A modern JavaScript/TypeScript library for interacting with the Steem blockchain. Complete refactoring with TypeScript, modern tooling, and improved security.

[![npm version](https://img.shields.io/npm/v/@steemit/steem-js.svg)](https://www.npmjs.com/package/@steemit/steem-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📚 Documentation

**[👉 Complete API Documentation](./docs/README.md)** - Comprehensive guide with all methods, examples, and usage patterns

**[🔧 Refactoring Details](./docs/refactoring-2025.md)** - Technical details about the 2025 modernization

## 🚀 Quick Start

### Requirements

- **Node.js**: >= 20.19.0 (LTS recommended)
- **Browser**: Modern browsers with Web Crypto API support

### Installation

```bash
# npm
npm install @steemit/steem-js

# pnpm (recommended)
pnpm install @steemit/steem-js

# yarn
yarn add @steemit/steem-js
```

### Basic Usage

```typescript
import { steem } from '@steemit/steem-js';

// Configure API endpoint
steem.config.set({
  nodes: ['https://api.steemit.com'],
  address_prefix: 'STM'
});

// Get account information
const accounts = await steem.api.getAccountsAsync(['username']);
console.log(accounts[0]);

// Vote on a post
const postingWif = steem.auth.toWif('username', 'password', 'posting');
await steem.broadcast.voteAsync(postingWif, 'voter', 'author', 'permlink', 10000);
```

### Browser Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js/dist/index.umd.min.js"></script>
<script>
  steem.config.set({ nodes: ['https://api.steemit.com'] });
  steem.api.getAccountsAsync(['username']).then(console.log);
</script>
```

## ✨ Key Features

- **🔒 Type Safety** - Full TypeScript support with complete type definitions
- **⚡ Modern** - ES modules, async/await, modern cryptography libraries
- **🌐 Universal** - Works in Node.js, browsers, and bundlers
- **🔐 Secure** - Proper cryptographic implementations, no key exposure
- **📖 Well Documented** - Comprehensive API documentation with examples

## 🏗️ Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## 📦 What's New in 2025

This is a complete modernization of the original steem-js library:

- ✅ **TypeScript Migration** - Full type safety and better developer experience
- ✅ **Modern Dependencies** - Replaced outdated crypto libraries (`bigi` → `bn.js`, `ecurve` → `elliptic`)
- ✅ **Modern Crypto** - Using @noble/hashes and @noble/ciphers for universal browser/Node.js compatibility
- ✅ **Build System** - Migrated from Webpack to Rollup for better output
- ✅ **Testing** - Migrated from Mocha to Vitest with 95.8% test coverage
- ✅ **Security** - Fixed insecure random number generation and crypto implementations

## 📋 Project Structure

```
src/
├── api/          # Blockchain API client (HTTP)
├── auth/         # Authentication and key management
├── broadcast/    # Transaction broadcasting
├── crypto/       # Cryptographic utilities
├── formatter/    # Data formatting helpers
├── memo/         # Encrypted memo handling
├── operations/   # Operation type definitions
├── serializer/   # Transaction serialization
└── utils/        # Utility functions
```

## 🔗 Links

- **[📖 API Documentation](./docs/README.md)** - Complete method reference
- **[🔧 Refactoring History](./docs/refactoring-2025.md)** - Technical modernization details
- **[📦 NPM Package](https://www.npmjs.com/package/@steemit/steem-js)** - Published package
- **[🐛 Issues](https://github.com/steemit/steem-js/issues)** - Bug reports and feature requests

## 📄 License

MIT - see [LICENSE](LICENSE) file for details.

---

> 💡 **Need help?** Check the [complete documentation](./docs/README.md) for detailed examples and API reference.