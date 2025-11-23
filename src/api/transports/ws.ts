// @ts-ignore
import WebSocket from 'ws';
import { TransportOptions, JsonRpcRequest, JsonRpcResponse } from './types';
import { BaseTransport } from './base';

export class WsTransport extends BaseTransport {
  private ws: WebSocket | null;
  private _requests: Map<number, (error: any, result?: any) => void>;
  private seqNo: number;

  constructor(options: TransportOptions) {
    super({
      ...options,
      websocket: options.websocket || 'wss://api.steemit.com',
    });
    this.ws = null;
    this._requests = new Map();
    this.seqNo = 0;
  }

  start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.ws) {
        resolve();
        return;
      }

      const url = this.options.websocket || 'wss://api.steemit.com';
      this.ws = new WebSocket(url);
      
      this.ws.on('open', () => {
        resolve();
      });

      this.ws.on('error', (error) => {
        reject(error);
      });

      this.ws.on('message', (data) => {
        const response = JSON.parse(data.toString()) as JsonRpcResponse;
        const callback = this._requests.get(response.id);
        if (callback) {
          this._requests.delete(response.id);
          callback(null, response.result);
        }
      });
    });
  }

  stop(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    return Promise.resolve();
  }

  send(api: string, data: any, callback: (error: any, result?: any) => void): void {
    if (!this.ws) {
      this.start().then(() => this.send(api, data, callback));
      return;
    }

    const id = data.id || ++this.seqNo;
    const message: JsonRpcRequest = {
      id,
      method: 'call',
      jsonrpc: '2.0',
      params: [api, data.method, data.params]
    };

    this._requests.set(id, callback);
    this.ws.send(JSON.stringify(message));
  }
} 