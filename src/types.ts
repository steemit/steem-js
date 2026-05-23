export interface SteemConfig {
  addressPrefix: string;
  chainId: string;
  nodes: string[];
  /**
   * WebSocket URL
   * NOTE: WebSocket functionality is currently not supported.
   * This field is kept for backward compatibility only.
   * Please use HTTP transport (via nodes array) for API calls.
   */
  websocket?: string;
}

export interface Account {
  name: string;
  // Add other account properties as needed
}

/**
 * steem::protocol::authority (condenser JSON).
 * account_auths / key_auths are fc::flat_map → array of [key, weight] pairs, not object maps.
 */
export interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

export interface Operation {
  type: string;
  value: unknown;
}

export interface Transaction {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  operations: Operation[];
  extensions: unknown[];
  signatures?: string[];
} 