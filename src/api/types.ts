/**
 * Type definitions for dynamically generated API methods.
 * Runtime routing (condenser_api vs database_api) is defined in methods.ts; see docs/README.md#api-routing.
 */

// Base callback type
export type ApiCallback<T = unknown> = (err: Error | null, result?: T) => void;

// Generic method signature for methods with parameters
type ApiMethodWithParams<TResult = unknown> = (
  ...args: unknown[]
) => Promise<TResult> | void;

// Generic method signature for methods without parameters
type ApiMethodNoParams<TResult = unknown> = (
  callback?: ApiCallback<TResult>
) => Promise<TResult> | void;

// Generic method signature for With methods
type ApiMethodWith<TResult = unknown> = (
  options: Record<string, unknown>,
  callback?: ApiCallback<TResult>
) => Promise<TResult> | void;

// Generic method signature for Async methods
type ApiMethodAsync<TParams extends unknown[] = unknown[], TResult = unknown> = (
  ...args: TParams
) => Promise<TResult>;

// Generic method signature for WithAsync methods
type ApiMethodWithAsync<TResult = unknown> = (
  options: Record<string, unknown>
) => Promise<TResult>;

/**
 * Type definitions for all API methods
 * This interface provides type safety for dynamically generated methods
 */
export interface ApiMethodSignatures {
  // ===== Commonly used methods with explicit types =====
  
  // getAccounts method
  getAccounts(
    accounts: string[],
    callback?: ApiCallback<any[]>
  ): Promise<any[]> | void;
  getAccountsAsync(accounts: string[]): Promise<any[]>;
  getAccountsWith(
    options: { names: string[] },
    callback?: ApiCallback<any[]>
  ): Promise<any[]> | void;
  getAccountsWithAsync(options: { names: string[] }): Promise<any[]>;

  // getAccountHistory method
  getAccountHistory(
    account: string,
    from: number,
    limit: number,
    callback?: ApiCallback<any[]>
  ): Promise<any[]> | void;
  getAccountHistoryAsync(
    account: string,
    from: number,
    limit: number
  ): Promise<any[]>;
  getAccountHistoryWith(
    options: { account: string; from: number; limit: number },
    callback?: ApiCallback<any[]>
  ): Promise<any[]> | void;
  getAccountHistoryWithAsync(options: {
    account: string;
    from: number;
    limit: number;
  }): Promise<any[]>;

  // getDynamicGlobalProperties method
  getDynamicGlobalProperties(callback?: ApiCallback<any>): Promise<any> | void;
  getDynamicGlobalPropertiesAsync(): Promise<any>;
  getDynamicGlobalPropertiesWith(
    options: Record<string, unknown>,
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getDynamicGlobalPropertiesWithAsync(
    options: Record<string, unknown>
  ): Promise<any>;

  // getContent method
  getContent(
    author: string,
    permlink: string,
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getContentAsync(author: string, permlink: string): Promise<any>;
  getContentWith(
    options: { author: string; permlink: string },
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getContentWithAsync(options: {
    author: string;
    permlink: string;
  }): Promise<any>;

  // getFollowers method
  getFollowers(
    following: string,
    startFollower: string,
    followType: string,
    limit: number,
    callback?: ApiCallback<any[]>
  ): Promise<any[]> | void;
  getFollowersAsync(
    following: string,
    startFollower: string,
    followType: string,
    limit: number
  ): Promise<any[]>;
  getFollowersWith(
    options: {
      following: string;
      startFollower: string;
      followType: string;
      limit: number;
    },
    callback?: ApiCallback<any[]>
  ): Promise<any[]> | void;
  getFollowersWithAsync(options: {
    following: string;
    startFollower: string;
    followType: string;
    limit: number;
  }): Promise<any[]>;

  // getBlock method
  getBlock(
    blockNum: number,
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getBlockAsync(blockNum: number): Promise<any>;
  getBlockWith(
    options: { blockNum: number },
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getBlockWithAsync(options: { blockNum: number }): Promise<any>;

  // getConfig method
  getConfig(callback?: ApiCallback<any>): Promise<any> | void;
  getConfigAsync(): Promise<any>;
  getConfigWith(
    options: Record<string, unknown>,
    callback?: ApiCallback<any>
  ): Promise<any> | void;
  getConfigWithAsync(options: Record<string, unknown>): Promise<any>;

  // ===== Generic signatures for all other dynamically generated methods =====
  // These allow TypeScript to recognize any method name, even if not explicitly defined above
  
  // For methods with parameters: methodName(...args, callback?)
  [methodName: string]: 
    | ApiMethodWithParams
    | ApiMethodNoParams
    | ApiMethodWith
    | ApiMethodAsync<unknown[]>
    | ApiMethodWithAsync
    | unknown;
}
