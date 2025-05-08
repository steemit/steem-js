export interface TransportOptions {
  url?: string;
  uri?: string;
  websocket?: string;
  transport?: string | any;
  [key: string]: any;
}

export interface JsonRpcRequest {
  id: number;
  method: string;
  params: any[];
  jsonrpc?: string;
}

export interface JsonRpcResponse {
  id: number;
  result: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface Transport {
  options: TransportOptions;
  start(): Promise<void>;
  stop(): Promise<void>;
  setOptions(options: TransportOptions): void;
  send(api: string, data: any, callback: (error: any, result?: any) => void): void | Promise<void>;
} 