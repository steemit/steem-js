# RPC Auth Test Migration

## Overview

This document describes the migration of tests from the `@steemit/rpc-auth` package to `steem-js` v1.0.11.

## Migration Details

### Source
- **Original Package**: `@steemit/rpc-auth` v1.1.1
- **Source Location**: `/home/ety001/workspace/rpc-auth`
- **Original Test File**: `test/index.ts`
- **Test Framework**: Mocha

### Destination
- **Target Package**: `@steemit/steem-js` v1.0.11
- **Target Location**: `/home/ety001/workspace/steem-js`
- **New Test File**: `test/rpc-auth.test.ts`
- **Test Framework**: Vitest

## Changes Made

### 1. Test Framework Migration

**From Mocha:**
```typescript
import 'mocha'
import * as assert from 'assert'

describe('rpc auth', function() {
  it('signs and validates', async function() {
    assert.equal(...)
  })
})
```

**To Vitest:**
```typescript
import { describe, it, expect } from 'vitest'

describe('RPC Auth', () => {
  it('should sign and validate a request', async () => {
    expect(...).toBe(...)
  })
})
```

### 2. Dependency Updates

**Removed:**
- `dsteem` (old steem-js library)
- `node-fetch` (for testnet account creation)
- Mocha-specific utilities

**Replaced with:**
- `steem-js` own API (`steem.auth`, `steem.api`)
- Native `crypto.randomBytes`
- Vitest assertions

### 3. Test Account Handling

**Original:**
- Created testnet accounts dynamically
- Used `dsteem.Client.testnet()`
- Required network access

**New:**
- Uses environment variables or test keys
- No dynamic account creation
- Can run without network (most tests)

### 4. Verification Function

**Original:**
```typescript
const dsteemVerify: VerifyMessage = async (message, signatures, account) => {
  const opts = { hash: message, signatures, required_posting: [account] }
  const rv = await client.database.call('verify_signatures', [opts])
  if (rv.valid !== true) throw new Error('Signature invalid')
}
```

**New:**
```typescript
const createVerifyFunction = () => {
  return async (message: Buffer, signatures: string[], account: string) => {
    const accounts = await api.getAccountsAsync([account])
    const postingKeys = accounts[0].posting?.key_auths?.map(k => k[0]) || []
    // Verify using steem-js Signature and PublicKey classes
  }
}
```

## Test Coverage

### Migrated Tests

✅ **sign and validate** - Basic signing and validation workflow
✅ **invalid requests** - Comprehensive error handling tests:
  - Invalid JSON RPC request
  - Missing signed payload
  - Invalid request params
  - Missing account
  - Invalid encoded params
  - Invalid nonce (multiple cases)
  - Invalid timestamp
  - Expired signature
  - Verification failure

✅ **signing errors** - Error handling when signing:
  - Missing params
  - Empty keys array

✅ **signature format** - Signature structure validation:
  - Valid signature format
  - Unique nonces
  - Valid timestamps

✅ **multiple signatures** - Support for multiple keys

### Skipped Tests

⏭️ **invalid signatures (integration test)** - Requires:
  - Real testnet account
  - Network access
  - Can be enabled with `STEEM_USERNAME` and `STEEM_PASSWORD` env vars

## Test Results

```
✓ test/rpc-auth.test.ts (19 tests | 1 skipped)
  ✓ RPC Auth > sign and validate > should sign and validate a request
  ✓ RPC Auth > invalid requests > should handle invalid JSON RPC request
  ✓ RPC Auth > invalid requests > should handle missing signed payload
  ✓ RPC Auth > invalid requests > should handle invalid request params
  ✓ RPC Auth > invalid requests > should handle missing account
  ✓ RPC Auth > invalid requests > should handle invalid encoded params
  ✓ RPC Auth > invalid requests > should handle invalid nonce (not a string)
  ✓ RPC Auth > invalid requests > should handle invalid nonce (wrong length)
  ✓ RPC Auth > invalid requests > should handle invalid nonce (wrong format)
  ✓ RPC Auth > invalid requests > should handle invalid timestamp
  ✓ RPC Auth > invalid requests > should handle expired signature
  ✓ RPC Auth > invalid requests > should handle verification failure
  ✓ RPC Auth > signing errors > should handle invalid requests when signing
  ✓ RPC Auth > signing errors > should handle empty keys array
  ✓ RPC Auth > signature format > should generate valid signature format
  ✓ RPC Auth > signature format > should generate unique nonces for each request
  ✓ RPC Auth > signature format > should generate valid timestamps
  ✓ RPC Auth > multiple signatures > should support multiple keys
  ↓ RPC Auth > invalid signatures > should handle invalid signatures (integration test)
```

## Key Differences

### Error Message Format

**Original rpc-auth:**
```
ValidationError: Verification failed (Nope)
```

**steem-js v1.0.11:**
```
Error: Verification failed: Nope
```

The error format changed from `(message)` to `: message`, which is reflected in the tests.

### API Changes

1. **PrivateKey handling**: 
   - Original: `PrivateKey.from(key)` or `PrivateKey.fromString(key)`
   - New: `PrivateKey.fromWif(key)`

2. **Signature creation**:
   - Original: `key.sign(message.buffer)` then `hexify()`
   - New: `Signature.signBufferSha256(message, privateKey)` then `.toHex()`

3. **No ValidationError class**: 
   - Original: Custom `ValidationError` class
   - New: Standard `Error` with formatted messages

## Running the Tests

```bash
# Run all rpc-auth tests
pnpm test -- rpc-auth.test.ts

# Run with coverage
pnpm test:coverage -- rpc-auth.test.ts

# Run specific test
pnpm test -- rpc-auth.test.ts -t "should sign and validate"
```

## Integration Test Setup

To run the skipped integration test, set environment variables:

```bash
export STEEM_USERNAME="your-testnet-account"
export STEEM_PASSWORD="your-password"
pnpm test -- rpc-auth.test.ts
```

## Notes

- All core functionality tests have been successfully migrated
- The test suite maintains the same coverage as the original
- Integration tests are skipped by default but can be enabled
- Tests are compatible with vitest and modern TypeScript
- No external dependencies required for most tests
