# API Type Definitions

## Overview

This document describes the type definitions for the `Api` class's dynamically generated methods.

## RPC routing

Helpers such as `getAccounts()` are defined in `src/api/methods.ts`. Each entry sets the Steem plugin namespace (`condenser_api`, `database_api`, …) used by `Api.send()`. As of v1.0.16, most legacy read methods route through `condenser_api`; only chain/validation methods remain on `database_api`. New-style node APIs (`list_accounts`, `find_accounts`, …) are not generated as camelCase helpers—use `api.call('database_api.find_accounts', [args])` instead.

## Problem

The `Api` class dynamically generates methods at runtime based on the `methods.ts` configuration. TypeScript cannot automatically infer these methods, causing type errors when trying to use them (e.g., `api.getAccounts()`).

## Solution

We've created a comprehensive type definition system:

1. **`src/api/types.ts`**: Defines `ApiMethodSignatures` interface with explicit types for commonly used methods and generic signatures for all other methods.

2. **`src/api/index.ts`**: The `Api` class now:
   - Has an index signature `[key: string]: unknown` to support all dynamic methods
   - Uses `declare` statements for commonly used methods to provide better type checking

## Type Definitions

### Commonly Used Methods

The following methods have explicit type definitions:

- `getAccounts` / `getAccountsAsync` / `getAccountsWith` / `getAccountsWithAsync`
- `getAccountHistory` / `getAccountHistoryAsync` / `getAccountHistoryWith` / `getAccountHistoryWithAsync`
- `getDynamicGlobalProperties` / `getDynamicGlobalPropertiesAsync` / etc.
- `getContent` / `getContentAsync` / etc.
- `getFollowers` / `getFollowersAsync` / etc.
- `getBlock` / `getBlockAsync` / etc.
- `getConfig` / `getConfigAsync` / etc.

### Generic Method Signatures

All other dynamically generated methods use generic signatures that support:

- **Base method**: `methodName(...args, callback?)` - supports both callback and promise
- **With method**: `methodNameWith(options, callback?)` - object-based parameters
- **Async method**: `methodNameAsync(...args)` - promise-only
- **WithAsync method**: `methodNameWithAsync(options)` - object-based promise-only

## Usage

### Before (Type Error)

```typescript
// ❌ TypeScript error: Property 'getAccounts' does not exist on type 'Api'
const accounts = await new Promise<any[]>((resolve, reject) => {
  api.getAccounts([account], (err, result) => {
    if (err) reject(err);
    else resolve(result || []);
  });
});
```

### After (Type Safe)

```typescript
// ✅ TypeScript recognizes getAccounts with proper types
const accounts = await new Promise<any[]>((resolve, reject) => {
  api.getAccounts([account], (err: Error | null, result?: any[]) => {
    if (err) reject(err);
    else resolve(result || []);
  });
});

// ✅ Or use the async version
const accounts = await api.getAccountsAsync([account]);
```

## Adding New Method Types

To add explicit types for a new commonly used method:

1. Add the method signature to `ApiMethodSignatures` interface in `src/api/types.ts`:

```typescript
export interface ApiMethodSignatures {
  // ... existing methods ...
  
  // New method
  getNewMethod(
    param1: string,
    param2: number,
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getNewMethodAsync(param1: string, param2: number): Promise<any>;
  getNewMethodWith(
    options: { param1: string; param2: number },
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getNewMethodWithAsync(options: {
    param1: string;
    param2: number;
  }): Promise<any>;
}
```

2. Optionally add `declare` statements in `Api` class for better type checking:

```typescript
export class Api extends EventEmitter {
  // ... existing code ...
  
  declare getNewMethod: ApiMethodSignatures['getNewMethod'];
  declare getNewMethodAsync: ApiMethodSignatures['getNewMethodAsync'];
  // ... etc
}
```

## Notes

- The index signature `[key: string]: unknown` allows TypeScript to recognize any method name, even if not explicitly defined
- Methods are still dynamically generated at runtime in the constructor
- The type definitions provide compile-time type safety without affecting runtime behavior
- Generic method signatures work for all methods, but explicit types provide better autocomplete and type checking
