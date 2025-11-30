export interface TransportOptions {
  url?: string;
  uri?: string;
  /**
   * WebSocket URL
   * NOTE: WebSocket functionality is currently not supported.
   * This field is kept for backward compatibility only.
   * Please use HTTP transport (via url or uri field) for API calls.
   */
  websocket?: string;
  transport?: string | unknown;
  [key: string]: unknown;
}

export interface JsonRpcRequest {
  id: number;
  method: string;
  params: unknown[];
  jsonrpc?: string;
}

export interface JsonRpcResponse {
  id: number;
  result: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface Transport {
  options: TransportOptions;
  start(): Promise<void>;
  stop(): Promise<void>;
  setOptions(options: TransportOptions): void;
  send(api: string, data: unknown, callback: (error: Error | null, result?: unknown) => void): void | Promise<void>;
} 