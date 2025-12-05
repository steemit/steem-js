# 🎉 Steem.js v1.0.8 Alpha Release Announcement

**Release Date:** December 3, 2025  
**Version:** v1.0.8  
**Status:** 🟡 **Alpha - Ready for Community Testing**

---

## 📢 Overview

We are excited to announce that **Steem.js v1.0.8** is now available as an **alpha release** for community testing! This version represents a significant milestone in our ongoing modernization effort, with major improvements in code quality, browser compatibility, and developer experience.

After extensive refactoring and testing over the past week, we believe this version is stable enough for community feedback and real-world testing scenarios.

---

## 🚀 What's New in v1.0.8

### ✨ Major Features & Improvements

#### 1. **Complete Modernization Stack** (v1.0.5 → v1.0.8)
- ✅ **Removed Legacy Dependencies**: Eliminated `axios`, `bluebird`, `websocket`, `lodash`, and `crypto-browserify`
- ✅ **Modern Cryptography**: Migrated to `@noble/hashes` and `@noble/ciphers` for universal browser/Node.js compatibility
- ✅ **Native APIs**: Replaced `axios` with native `fetch` API, `Bluebird` with native Promises
- ✅ **ESLint 9 Migration**: Updated to latest ESLint with improved code quality rules
- ✅ **Type Safety**: Replaced `any` types with `unknown` for better type safety

#### 2. **Browser Compatibility Enhancements**
- ✅ **Buffer Polyfill Support**: Full Buffer polyfill support for browser ESM builds
- ✅ **UMD Build Improvements**: Fixed Buffer initialization issues in UMD builds
- ✅ **Cross-Platform Support**: Works seamlessly in Node.js, browsers, and modern bundlers

#### 3. **Critical Bug Fixes**
- ✅ **custom_json Serialization**: Fully implemented `custom_json` operation serialization
- ✅ **TypeScript Type Errors**: Fixed Buffer type compatibility issues in `ecdsa.ts`
- ✅ **Test Suite Updates**: Updated all unit tests to handle dependency changes

#### 4. **Developer Experience**
- ✅ **Version Property**: Added `steem.version` property accessible at runtime
- ✅ **API Simplification**: Removed `getAccount()` convenience method (use `getAccounts()` instead)
- ✅ **Comprehensive Test Suite**: Added full API test suite to `test-umd.html` for browser testing
- ✅ **Documentation Updates**: Updated API documentation and refactoring guides

---

## 📦 Installation

```bash
# npm
npm install @steemit/steem-js@1.0.8

# pnpm (recommended)
pnpm install @steemit/steem-js@1.0.8

# yarn
yarn add @steemit/steem-js@1.0.8
```

### Browser CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@steemit/steem-js@1.0.8/dist/index.umd.min.js"></script>
```

---

## 🔧 Breaking Changes

### Removed Methods
- ❌ `steem.api.getAccount()` - Use `steem.api.getAccounts([name])` instead

### API Changes
- All callback-based methods now have Promise-based alternatives (e.g., `getAccountsAsync()`)
- WebSocket transport support has been removed (HTTP only)

---

## 🧪 Testing

We've added comprehensive test coverage:

- ✅ **Unit Tests**: 95.8% coverage with Vitest
- ✅ **Browser Tests**: Full test suite in `test-umd.html`
- ✅ **Type Checking**: Full TypeScript type safety

### Run Tests Locally

```bash
# Install dependencies
pnpm install

# Run unit tests
pnpm test

# Run browser tests
# Open test-umd.html in a browser after building
pnpm build
```

---

## 📊 Version History (v1.0.5 → v1.0.8)

### v1.0.8 (December 3, 2025)
- Add `steem.version` property from package.json
- Add Buffer polyfill support for browser ESM builds
- Add comprehensive API test suite to test-umd.html

### v1.0.7 (December 3, 2025)
- Fix Buffer polyfill initialization in UMD builds
- Improve browser compatibility

### v1.0.6 (December 3, 2025)
- Implement `custom_json` serialization
- Fix TypeScript type errors
- Remove `getAccount()` convenience method

### v1.0.5 (November 30, 2025)
- Major refactoring: Remove legacy dependencies
- Modernize codebase with ESLint 9
- Replace crypto libraries with @noble packages

---

## 🎯 What We Need from the Community

As this is an **alpha release**, we're looking for:

1. **🐛 Bug Reports**: Report any issues you encounter
2. **💡 Feedback**: Share your experience with the new API
3. **🧪 Real-World Testing**: Test in your applications and report compatibility issues
4. **📝 Documentation**: Help us improve documentation with your use cases

### Known Limitations

- ⚠️ WebSocket transport is not supported (HTTP only)
- ⚠️ Some edge cases in browser environments may need additional testing
- ⚠️ Migration from old steem-js may require code updates

---

## 🔗 Resources

- **[📖 Complete API Documentation](./docs/README.md)** - Full method reference
- **[🔧 Refactoring Details](./docs/refactoring-2025.md)** - Technical modernization guide
- **[📦 NPM Package](https://www.npmjs.com/package/@steemit/steem-js)** - Published package
- **[🐛 Issue Tracker](https://github.com/steemit/steem-js/issues)** - Report bugs and request features

---

## 🛠️ Quick Start Example

```typescript
import { steem } from '@steemit/steem-js';

// Configure API endpoint
steem.config.set({
  nodes: ['https://api.steemit.com'],
  address_prefix: 'STM'
});

// Check version
console.log('Steem.js version:', steem.version); // "1.0.8"

// Get account information
const accounts = await steem.api.getAccountsAsync(['username']);
console.log(accounts[0]);

// Broadcast custom_json operation
const postingWif = steem.auth.toWif('username', 'password', 'posting');
await steem.broadcast.customJsonAsync(
  postingWif,
  [], // required_auths
  ['username'], // required_posting_auths
  'follow', // id
  JSON.stringify(['follow', { follower: 'username', following: 'author', what: ['blog'] }])
);
```

---

## 🙏 Acknowledgments

Thank you to everyone who has contributed to this refactoring effort. Your feedback and testing will help us make Steem.js even better!

---

## 📝 Next Steps

1. **Test the alpha release** in your development environments
2. **Report any issues** you encounter
3. **Share your feedback** on the API design and usability
4. **Stay tuned** for beta and stable releases based on community feedback

---

**Happy Testing! 🚀**

*For questions or support, please open an issue on GitHub or reach out to the maintainers.*

