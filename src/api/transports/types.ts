export interface TransportOptions {
  url?: string;
  /**
   * WebSocket URL
   * NOTE: WebSocket functionality is currently not supported.
   * This field is kept for backward compatibility only.
   * Please use HTTP transport (via url field) for API calls.
   */
  websocket?: string;
  transport?: string | unknown;
  /**
   * HTTPS/TLS options (Node.js only; browser fetch does not support custom CA).
   * When set, requests use undici Agent with these options for certificate verification.
   */
  httpsOptions?: {
    rejectUnauthorized?: boolean;
    ca?: string | Buffer | string[];
  };
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