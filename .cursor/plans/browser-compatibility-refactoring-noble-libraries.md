# Browser Compatibility Refactoring Plan - Direct Replacement with Noble Libraries

## Overview

参考以太坊 SDK（ethers.js）的最佳实践，**直接使用 @noble/hashes 和 @noble/ciphers 替换所有 crypto-browserify 调用**。这些库是纯 JavaScript 实现，在 Node.js 和浏览器中都能工作，无需环境检测或中间层。

## Key Principle

**@noble/hashes 和 @noble/ciphers 是 Universal JavaScript 库**：

- ✅ 在 Node.js 中直接工作
- ✅ 在浏览器中直接工作
- ✅ 无需环境检测
- ✅ 无需不同的实现路径
- ✅ 同一套代码适用于所有环境

## Current Issues

1. **crypto-browserify 带来的问题**：

   - 依赖 `stream-browserify`（间接依赖）
   - `stream-browserify` 使用 `process.browser`，导致浏览器兼容性问题
   - 包体积大（1.7MB+）
   - 依赖链复杂

2. **与以太坊 SDK 的对比**：

   - ethers.js：使用 @noble/hashes（universal，无环境区分）
   - steem-js：使用 crypto-browserify（需要 polyfill，有兼容性问题）

## Refactoring Strategy

### Phase 1: Direct Replacement with @noble Libraries

#### 1.1 Hash Functions - Direct Replacement

**Current Pattern**:

```typescript
import { createHash } from './browser-crypto';
const hash = createHash('sha256').update(data).digest();
```

**New Pattern** (Universal, works in Node.js and browser):

```typescript
import { sha256 } from '@noble/hashes/sha256';
const hash = Buffer.from(sha256(data));
```

**Files to Update**:

- `src/crypto/index.ts`: Replace `createHash('sha256')` → `sha256()` from `@noble/hashes/sha256`
- `src/crypto/index.ts`: Replace `createHash('ripemd160')` → `ripemd160()` from `@noble/hashes/ripemd160`
- `src/auth/ecc/src/hash.ts`: Replace all `createHash()` calls
- `src/api/rpc-auth.ts`: Replace `createHash('sha256')` calls
- `src/serializer/index.ts`: Replace `createHash('sha256')` calls
- `src/auth/ecc.ts`: Replace `createHash('sha256')` calls

#### 1.2 HMAC - Direct Replacement

**Current Pattern**:

```typescript
import { createHmac } from './browser-crypto';
const hmac = createHmac('sha256', key).update(data).digest();
```

**New Pattern**:

```typescript
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
const hmacResult = Buffer.from(hmac(sha256, key, data));
```

**Files to Update**:

- `src/crypto/index.ts`: Replace `createHmac('sha256', key)` → `hmac(sha256, key, data)`
- `src/auth/ecc/src/hash.ts`: Replace `createHmac()` calls

#### 1.3 AES Encryption - Direct Replacement

**Current Pattern**:

```typescript
import { createCipheriv, createDecipheriv } from '../../../crypto/browser-crypto';
const cipher = createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
```

**New Pattern** (using @noble/ciphers):

```typescript
import { cbc } from '@noble/ciphers/aes';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
// AES-256-CBC encryption
const encrypted = cbc(key, iv).encrypt(data);
```

**Files to Update**:

- `src/auth/ecc/src/aes.ts`: Replace `createCipheriv`/`createDecipheriv` with `@noble/ciphers`

**Note**: Need to verify compatibility with existing encrypted memo format

#### 1.4 Random Bytes

**Current**: Web Crypto API (already universal) ✅

**Options**:

- Keep Web Crypto API (works in both environments)
- Or use `@noble/hashes/utils` randomBytes (also universal)

**Recommendation**: Keep Web Crypto API for better performance

### Phase 2: Remove Unnecessary Dependencies

#### 2.1 Remove crypto-browserify and stream-browserify

After direct replacement, these are no longer needed:

- Remove `crypto-browserify` from devDependencies
- Remove `stream-browserify` from devDependencies
- Remove `browser-crypto.ts` file (no longer needed)

#### 2.2 Process Polyfill

Still needed for other dependencies, but simplified:

- Use `@rollup/plugin-inject` to inject process properly
- Or keep minimal banner polyfill

### Phase 3: Update Build Configuration

#### 3.1 Remove Crypto/Stream Aliases

**Remove from rollup.config.js aliases**:

- `crypto` → `crypto-browserify` (no longer needed)
- `stream` → `stream-browserify` (no longer needed)

**Keep**:

- `buffer` → `buffer` (still needed)
- `events` → `events` (still needed)
- `assert` → `assert` (still needed)
- `util` → `util` (or remove if promisify replaced)
- `process` → `process/browser` (still needed for some dependencies)

#### 3.2 Package Dependencies

**Remove**:

- `crypto-browserify` (replaced by @noble/hashes)
- `stream-browserify` (no longer needed)

**Add**:

- `@noble/hashes` - Universal hash library (works in Node.js and browser)
- `@noble/ciphers` - Universal cipher library (works in Node.js and browser)

## Implementation Steps

### Step 1: Research and Verify

1. Verify `@noble/hashes` supports all required algorithms:

   - sha256 ✅
   - sha512 ✅
   - sha1 ✅
   - ripemd160 ✅
   - hmac ✅

2. Verify `@noble/ciphers` supports AES-256-CBC:

   - Check API compatibility
   - Verify output format matches existing encrypted data

### Step 2: Install Dependencies

```bash
pnpm add @noble/hashes @noble/ciphers
```

### Step 3: Direct Replacement - Hash Functions

**File: `src/crypto/index.ts`**

```typescript
// Old:
import { createHash, createHmac, randomBytes } from './browser-crypto';
export const sha256 = (data: string | Buffer): Buffer => {
  return createHash('sha256').update(data).digest();
};

// New:
import { sha256 as nobleSha256 } from '@noble/hashes/sha256';
import { randomBytes } from './random-bytes'; // Keep Web Crypto API
export const sha256 = (data: string | Buffer): Buffer => {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.from(nobleSha256(input));
};
```

**File: `src/auth/ecc/src/hash.ts`**

```typescript
// Old:
import createHash from 'create-hash';
export function sha256(data: string | Buffer, encoding?: BufferEncoding): Buffer {
  return createHash('sha256').update(data).digest(encoding);
}

// New:
import { sha256 as nobleSha256 } from '@noble/hashes/sha256';
export function sha256(data: string | Buffer, encoding?: BufferEncoding): Buffer {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const hash = nobleSha256(input);
  if (encoding) {
    return Buffer.from(hash.toString(encoding === 'hex' ? 'hex' : 'base64'), encoding);
  }
  return Buffer.from(hash);
}
```

### Step 4: Direct Replacement - HMAC

**File: `src/crypto/index.ts`**

```typescript
// Old:
export const hmacSha256 = (key: string | Buffer, data: string | Buffer): Buffer => {
  return createHmac('sha256', key).update(data).digest();
};

// New:
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
export const hmacSha256 = (key: string | Buffer, data: string | Buffer): Buffer => {
  const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key);
  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.from(hmac(sha256, keyBuf, dataBuf));
};
```

### Step 5: Direct Replacement - AES

**File: `src/auth/ecc/src/aes.ts`**

```typescript
// Old:
import { createCipheriv, createDecipheriv } from '../../../crypto/browser-crypto';
const cipher = createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(messageBuffer), cipher.final()]);

// New:
import { cbc } from '@noble/ciphers/aes';
const encrypted = Buffer.from(cbc(key, iv).encrypt(messageBuffer));
```

### Step 6: Update All Import Statements

Remove all imports from `browser-crypto.ts`:

- `src/crypto/index.ts`
- `src/auth/ecc/src/aes.ts`
- `src/api/rpc-auth.ts`
- `src/serializer/index.ts`
- `src/auth/ecc.ts`

Replace with direct imports from `@noble/hashes` and `@noble/ciphers`.

### Step 7: Remove browser-crypto.ts

After all replacements are complete, delete `src/crypto/browser-crypto.ts`.

### Step 8: Update Rollup Configuration

1. Remove crypto and stream aliases
2. Add inject plugin for process (if still needed)
3. Update banner (simplify process polyfill)

### Step 9: Update package.json

Remove:

- `crypto-browserify`
- `stream-browserify`

Add:

- `@noble/hashes`
- `@noble/ciphers`

### Step 10: Testing

- Test in Node.js environment
- Test in browser environment (test-steem-js-frontend)
- Verify all crypto operations work correctly
- Verify bundle size reduction
- Verify no process/stream errors

## Node.js Compatibility

**Key Point**: @noble libraries work natively in Node.js!

- No special handling needed
- Same code works in both environments
- No environment detection required
- No conditional imports

**Example**:

```typescript
// This works in both Node.js and browser:
import { sha256 } from '@noble/hashes/sha256';
const hash = sha256(data); // ✅ Works everywhere
```

## Additional Task: Remove WebSocket Support

Since WebSocket functionality is not supported and not needed, remove all WebSocket-related code, configurations, and dependencies:

**Files to Delete**:

- `src/api/transports/ws.ts` - WebSocket transport implementation

**Files to Modify**:

- `src/api/transports/index.ts` - Remove WsTransport export
- `src/api/index.ts` - Remove WebSocket-related code:
  - Remove `websocket` option from `ApiOptions` interface
  - Remove `setWebSocket()` method
  - Remove WebSocket transport initialization logic
  - Remove WebSocket URL detection logic
  - Update singleton Api instance initialization (remove websocket parameter)
- `src/config.ts` - Remove WebSocket configuration:
  - Remove `websocket?: string;` from `SteemConfig` interface
  - Remove `websocket: 'wss://api.steemit.com'` from `DEFAULT_CONFIG`

**Dependencies to Remove**:

- `ws` from dependencies (package.json)
- `@types/ws` from devDependencies (package.json)

**Documentation to Update**:

- `README.md` - Update project structure comment (remove WebSocket mention)
- `docs/README.md` - Remove any WebSocket-related documentation
- `docs/refactoring-2025.md` - Document WebSocket removal if mentioned

**Benefits**:

- Smaller bundle size
- Simpler codebase
- No WebSocket polyfill needed
- Clearer API (HTTP only)
- Cleaner configuration interface

## Files to Modify

### Crypto Refactoring:

1. `src/crypto/index.ts` - Direct replacement with @noble/hashes
2. `src/auth/ecc/src/hash.ts` - Replace create-hash with @noble/hashes
3. `src/auth/ecc/src/aes.ts` - Replace createCipheriv/Decipheriv with @noble/ciphers
4. `src/api/rpc-auth.ts` - Replace createHash with @noble/hashes
5. `src/serializer/index.ts` - Replace createHash with @noble/hashes
6. `src/auth/ecc.ts` - Replace createHash with @noble/hashes

### WebSocket Removal:

7. `src/api/transports/index.ts` - Remove WsTransport export
8. `src/api/index.ts` - Remove WebSocket-related code:
   - Remove `websocket` option from `ApiOptions` interface
   - Remove `setWebSocket()` method
   - Remove WebSocket transport initialization logic
   - Remove WebSocket URL detection logic
   - Update singleton Api instance initialization (remove websocket parameter)
9. `src/config.ts` - Remove WebSocket configuration:
   - Remove `websocket?: string;` from `SteemConfig` interface
   - Remove `websocket: 'wss://api.steemit.com'` from `DEFAULT_CONFIG`

### Build Configuration:

10. `rollup.config.js` - Remove crypto/stream aliases, update process injection
11. `package.json` - Update dependencies:
    - Remove: `ws`, `@types/ws`, `crypto-browserify`, `stream-browserify`
    - Add: `@noble/hashes`, `@noble/ciphers`

### File Deletions:

12. Delete `src/crypto/browser-crypto.ts` (no longer needed)
13. Delete `src/api/transports/ws.ts` (no longer needed)

### Documentation Updates:

14. `README.md` - Update project structure comment (remove WebSocket mention)
15. `docs/README.md` - Remove any WebSocket-related documentation
16. `docs/refactoring-2025.md` - Document WebSocket removal if mentioned

## Additional Task 2: Remove Bluebird Dependency

Following Ethereum SDK (ethers.js) best practices, replace Bluebird with native Promise to reduce dependencies and improve compatibility.

### Current Bluebird Usage

1. **Promise Creation**: `new Bluebird((resolve, reject) => { ... })`
2. **Promisify**: `Bluebird.promisify(fn)` - Converting callbacks to promises
3. **Promise Rejection**: `Bluebird.reject(err)`
4. **Return Types**: `Bluebird<any>` in method signatures

### Replacement Strategy

- `new Bluebird()` → `new Promise()` (native Promise)
- `Bluebird.promisify()` → Custom `promisify` function (already implemented in `src/broadcast/index.ts`)
- `Bluebird.reject()` → `Promise.reject()` (native Promise)
- Return types: `Bluebird<any>` → `Promise<any>`

### Files to Modify

1. **`src/api/index.ts`**:
   - Replace `import * as Bluebird from 'bluebird'` → Remove import
   - Replace `new Bluebird()` → `new Promise()` in `_wrapWithPromise` method
   - Replace `Bluebird.promisify()` → Custom `promisify` function
   - Replace `Bluebird.reject()` → `Promise.reject()`
   - Update return types: `Bluebird<any>` → `Promise<any>`

2. **Create reusable promisify utility**:
   - Extract `promisify` from `src/broadcast/index.ts` to `src/utils/promisify.ts`
   - Use in both `src/api/index.ts` and `src/broadcast/index.ts`

3. **`package.json`**:
   - Remove `bluebird` from dependencies

### Benefits

- **Smaller Bundle**: Remove bluebird (~100KB+)
- **Better Compatibility**: Native Promise works everywhere
- **Modern Standard**: Aligns with ethers.js and modern SDKs
- **Simpler Code**: No external Promise library needed
- **Better Performance**: Native Promise is optimized by JavaScript engines

### Implementation Steps

1. Create `src/utils/promisify.ts` with reusable promisify function
2. Update `src/api/index.ts`:
   - Remove Bluebird import
   - Replace all `new Bluebird()` with `new Promise()`
   - Replace `Bluebird.promisify()` with custom promisify
   - Replace `Bluebird.reject()` with `Promise.reject()`
   - Update return types
3. Update `src/broadcast/index.ts` to use shared promisify utility
4. Remove `bluebird` from `package.json`
5. Test all API methods work correctly with native Promise

## Expected Benefits

1. **Universal Code**: Same code works in Node.js and browser
2. **Smaller Bundle**: Remove crypto-browserify (~500KB+) and stream-browserify
3. **Better Performance**: @noble libraries are optimized
4. **No Process Issues**: No more process.browser errors
5. **Simpler Codebase**: No environment detection, no intermediate layers
6. **Modern Dependencies**: Align with ethers.js standards

## Risk Mitigation

1. **AES Compatibility**: Test with existing encrypted memo data
2. **Hash Output Format**: Verify Buffer compatibility
3. **Gradual Migration**: Can keep old code temporarily for comparison

