import { EventEmitter } from 'events';
// @ts-ignore
import WebSocket from 'ws';
import { getConfig } from '../../config';
import { Transport, TransportOptions, JsonRpcRequest, JsonRpcResponse } from './types';

export class WebSocketTransport extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: any;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 1000;

  constructor(options: any) {
    super();
    this.options = {
      ...options,
      websocket: options.websocket || 'wss://api.steemit.com',
    };
  }

  start() {
    if (this.ws) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const url = this.options.websocket || getConfig().get('websocket') || 'wss://api.steemit.com';
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        this.emit('open');
        resolve();
      });

      this.ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.emit('message', message);
        } catch (error) {
          this.emit('error', new Error('Invalid message format'));
        }
      });

      this.ws.on('error', (error: Error) => {
        this.emit('error', error);
        this._handleReconnect();
      });

      this.ws.on('close', () => {
        this.emit('close');
        this._handleReconnect();
      });
    });
  }

  stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    return Promise.resolve();
  }

  send(api: string, data: any, callback: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      callback(new Error('WebSocket is not connected'));
      return;
    }

    const message = {
      id: Math.floor(Math.random() * 1000000),
      jsonrpc: '2.0',
      method: api,
      params: data
    };

    const timeout = setTimeout(() => {
      callback(new Error('Request timeout'));
    }, 30000);

    const messageHandler = (response: any) => {
      if (response.id === message.id) {
        clearTimeout(timeout);
        this.removeListener('message', messageHandler);
        callback(null, response.result);
      }
    };

    this.on('message', messageHandler);

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      clearTimeout(timeout);
      this.removeListener('message', messageHandler);
      callback(error);
    }
  }

  private _handleReconnect() {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start().catch(() => {
        // Ignore start errors, they will trigger reconnect again
      });
    }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1));
  }
}

export class WsTransport implements Transport {
  options: TransportOptions;
  private ws: WebSocket | null;
  private _requests: Map<number, (error: any, result?: any) => void>;
  private seqNo: number;

  constructor(options: TransportOptions) {
    this.options = {
      ...options,
      websocket: options.websocket || 'wss://api.steemit.com',
    };
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

  setOptions(options: TransportOptions): void {
    this.options = { ...this.options, ...options };
    if (options.websocket && this.ws) {
      this.stop().then(() => this.start());
    }
  }

  send(api: string, data: any, callback: (error: any, result?: any) => void): Promise<void> | void {
    if (!this.ws) {
      return this.start().then(() => this.send(api, data, callback));
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