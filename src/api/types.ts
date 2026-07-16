/**
 * Type definitions for dynamically generated API methods.
 * Runtime routing (condenser_api vs database_api) is defined in methods.ts; see docs/README.md#api-routing.
 */

import type {
  ExtendedAccount,
  DynamicGlobalProperties,
  Discussion,
  SignedBlock,
  FollowApiObject,
  AccountHistoryEntry,
} from '../types/protocol';

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
 * This interface provides type safety for dynamically generated methods.
 * Return types mirror the C++ node's condenser_api FC_REFLECT structs; see
 * src/types/protocol.ts for the protocol definitions.
 */
export interface ApiMethodSignatures {
  // ===== Commonly used methods with explicit types =====
  
  // getAccounts method
  getAccounts(
    accounts: string[],
    callback?: ApiCallback<ExtendedAccount[]>
  ): Promise<ExtendedAccount[]> | void;
  getAccountsAsync(accounts: string[]): Promise<ExtendedAccount[]>;
  getAccountsWith(
    options: { names: string[] },
    callback?: ApiCallback<ExtendedAccount[]>
  ): Promise<ExtendedAccount[]> | void;
  getAccountsWithAsync(options: { names: string[] }): Promise<ExtendedAccount[]>;

  // getAccountHistory method
  getAccountHistory(
    account: string,
    from: number,
    limit: number,
    callback?: ApiCallback<AccountHistoryEntry[]>
  ): Promise<AccountHistoryEntry[]> | void;
  getAccountHistoryAsync(
    account: string,
    from: number,
    limit: number
  ): Promise<AccountHistoryEntry[]>;
  getAccountHistoryWith(
    options: { account: string; from: number; limit: number },
    callback?: ApiCallback<AccountHistoryEntry[]>
  ): Promise<AccountHistoryEntry[]> | void;
  getAccountHistoryWithAsync(options: {
    account: string;
    from: number;
    limit: number;
  }): Promise<AccountHistoryEntry[]>;

  // getDynamicGlobalProperties method
  getDynamicGlobalProperties(callback?: ApiCallback<DynamicGlobalProperties>): Promise<DynamicGlobalProperties> | void;
  getDynamicGlobalPropertiesAsync(): Promise<DynamicGlobalProperties>;
  getDynamicGlobalPropertiesWith(
    options: Record<string, unknown>,
    callback?: ApiCallback<DynamicGlobalProperties>
  ): Promise<DynamicGlobalProperties> | void;
  getDynamicGlobalPropertiesWithAsync(
    options: Record<string, unknown>
  ): Promise<DynamicGlobalProperties>;

  // getContent method
  getContent(
    author: string,
    permlink: string,
    callback?: ApiCallback<Discussion>
  ): Promise<Discussion> | void;
  getContentAsync(author: string, permlink: string): Promise<Discussion>;
  getContentWith(
    options: { author: string; permlink: string },
    callback?: ApiCallback<Discussion>
  ): Promise<Discussion> | void;
  getContentWithAsync(options: {
    author: string;
    permlink: string;
  }): Promise<Discussion>;

  // getFollowers method
  getFollowers(
    following: string,
    startFollower: string,
    followType: string,
    limit: number,
    callback?: ApiCallback<FollowApiObject[]>
  ): Promise<FollowApiObject[]> | void;
  getFollowersAsync(
    following: string,
    startFollower: string,
    followType: string,
    limit: number
  ): Promise<FollowApiObject[]>;
  getFollowersWith(
    options: {
      following: string;
      startFollower: string;
      followType: string;
      limit: number;
    },
    callback?: ApiCallback<FollowApiObject[]>
  ): Promise<FollowApiObject[]> | void;
  getFollowersWithAsync(options: {
    following: string;
    startFollower: string;
    followType: string;
    limit: number;
  }): Promise<FollowApiObject[]>;

  // getBlock method
  getBlock(
    blockNum: number,
    callback?: ApiCallback<SignedBlock>
  ): Promise<SignedBlock> | void;
  getBlockAsync(blockNum: number): Promise<SignedBlock>;
  getBlockWith(
    options: { blockNum: number },
    callback?: ApiCallback<SignedBlock>
  ): Promise<SignedBlock> | void;
  getBlockWithAsync(options: { blockNum: number }): Promise<SignedBlock>;

  // getConfig method — database_api.get_config returns fc::variant_object (dynamic key/value map)
  getConfig(callback?: ApiCallback<Record<string, unknown>>): Promise<Record<string, unknown>> | void;
  getConfigAsync(): Promise<Record<string, unknown>>;
  getConfigWith(
    options: Record<string, unknown>,
    callback?: ApiCallback<Record<string, unknown>>
  ): Promise<Record<string, unknown>> | void;
  getConfigWithAsync(options: Record<string, unknown>): Promise<Record<string, unknown>>;

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
