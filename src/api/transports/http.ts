import axios from 'axios';
// @ts-ignore: No types for 'retry'
import retry from 'retry';
import { TransportOptions, JsonRpcRequest, JsonRpcResponse } from './types';
import { BaseTransport } from './base';

export const jsonRpc = async (uri: string, request: Partial<JsonRpcRequest>): Promise<any> => {
  try {
    const response = await axios.post<JsonRpcResponse>(uri, {
      jsonrpc: '2.0',
      ...request
    });
    return response.data.result;
  } catch (error) {
    throw error;
  }
};

export class HttpTransport extends BaseTransport {
  constructor(options: TransportOptions) {
    super(options);
  }

  get nonRetriableOperations(): string[] {
    return [
      'broadcast_transaction',
      'broadcast_transaction_with_callback',
      'broadcast_transaction_synchronous',
      'broadcast_block',
    ];
  }

  isBroadcastOperation(method: string): boolean {
    return this.nonRetriableOperations.includes(method);
  }

  send(api: string, data: any, callback?: (err: any, result?: any, attempt?: number) => void) {
    if (typeof callback !== 'function') {
      callback = () => {};
    }
    const uri = this.options.uri as string;
    if (!uri) {
      throw new Error('HTTP transport requires a valid URI');
    }
    const fetchMethod = this.options.fetchMethod || fetch;
    const id = data.id;
    const params = [api, data.method, data.params];
    const isBroadcast = this.isBroadcastOperation(data.method);
    const retryOptions = this.options.retry;
    const timeoutMs = isBroadcast ? 60000 : 30000;
    if (!isBroadcast && retryOptions) {
      const operation = typeof retryOptions === 'object' ? retry.operation(retryOptions) : retry.operation();
      operation.attempt((currentAttempt: number) => {
        fetchMethod(uri, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params,
            id
          }),
          headers: { 'Content-Type': 'application/json' },
          timeout: timeoutMs,
        })
          .then((res: any) => res.json())
          .then(
            (result: any) => callback!(null, result.result, currentAttempt),
            (error: any) => {
              if (operation.retry(error)) {
                return;
              }
              callback!(operation.mainError(), undefined, currentAttempt);
            }
          );
      });
    } else {
      fetchMethod(uri, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params,
          id
        }),
        headers: { 'Content-Type': 'application/json' },
        timeout: timeoutMs,
      })
        .then((res: any) => res.json())
        .then(
          (result: any) => callback!(null, result.result, 1),
          (error: any) => callback!(error, undefined, 1)
        );
    }
  }
} 