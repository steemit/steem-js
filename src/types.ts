export interface SteemConfig {
  addressPrefix: string;
  chainId: string;
  node: string;
  nodes: string[];
  uri?: string;
  websocket?: string;
}

export interface Account {
  name: string;
  // Add other account properties as needed
}

export interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

export interface Operation {
  type: string;
  value: any;
}

export interface Transaction {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  operations: Operation[];
  extensions: any[];
  signatures?: string[];
} 