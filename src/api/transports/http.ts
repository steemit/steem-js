// @ts-expect-error: No types for 'retry'
import retry from 'retry';
import { TransportOptions, JsonRpcRequest, JsonRpcResponse } from './types';
import { BaseTransport } from './base';

/** Detect Node.js for optional undici Agent (custom TLS). */
const isNode =
  typeof process !== 'undefined' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node === 'string';

/**
 * Build RequestInit for fetch. In Node when options.httpsOptions is set, inject undici Agent as dispatcher.
 */
async function buildFetchOptions(
  body: string,
  options: TransportOptions
): Promise<RequestInit> {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body
  };
  if (isNode && options.httpsOptions) {
    // Node 18+ built-in fetch uses undici; custom TLS via node:undici Agent (built-in, no package)
    // @ts-expect-error - node:undici is Node built-in, not in @types/node
    const { Agent } = await import('node:undici');
    const opts = options.httpsOptions;
    const agent = new Agent({
      connect: {
        rejectUnauthorized: opts.rejectUnauthorized,
        ca: opts.ca
      }
    });
    (init as Record<string, unknown>).dispatcher = agent;
  }
  return init;
}

/**
 * Extended Error type for JSON-RPC errors
 */
class JsonRpcError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'JsonRpcError';
    this.code = code;
    this.data = data;
  }
}

/**
 * Makes a JSON-RPC request using native fetch API
 * Universal implementation that works in both Node.js (20.19+) and browser
 *
 * @param url - The URL to the JSON-RPC endpoint
 * @param request - The JSON-RPC request object
 * @param fetchMethod - Optional fetch implementation (defaults to global fetch)
 * @param timeoutMs - Request timeout in milliseconds (default: 30000)
 * @param httpsOptions - Optional TLS options (Node.js only): rejectUnauthorized, ca
 * @returns Promise resolving to the JSON-RPC result
 */
export const jsonRpc = async (
  url: string,
  request: Partial<JsonRpcRequest>,
  fetchMethod: typeof fetch = fetch,
  timeoutMs: number = 30000,
  httpsOptions?: { rejectUnauthorized?: boolean; ca?: string | Buffer | string[] }
): Promise<unknown> => {
  const payload = {
      jsonrpc: '2.0',
      ...request
  };

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const fetchOptions = await buildFetchOptions(JSON.stringify(payload), { httpsOptions });
  const fetchPromise = fetchMethod(url, fetchOptions)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const jsonResponse: JsonRpcResponse = await res.json();
      
      // Check for JSON-RPC errors
      if (jsonResponse.error) {
        throw new JsonRpcError(
          jsonResponse.error.message || 'JSON-RPC error',
          jsonResponse.error.code,
          jsonResponse.error.data
        );
      }
      
      return jsonResponse.result;
    });

  // Race the fetch against the timeout
  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    // Clear the timeout to avoid memory leaks
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
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

  send(api: string, data: { id?: number; method: string; params: unknown[] }, callback?: (err: Error | null, result?: unknown, attempt?: number) => void) {
    if (typeof callback !== 'function') {
      callback = () => {};
    }
    const url = this.options.url as string;
    if (!url) {
      throw new Error('HTTP transport requires a valid URL');
    }
    const fetchMethod = this.options.fetchMethod || fetch;
    const id = data.id;
    const params = [api, data.method, data.params];
    const isBroadcast = this.isBroadcastOperation(data.method);
    const retryOptions = this.options.retry;
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params,
      id
    });

    const doRequest = (fetchOpts: RequestInit) =>
      (fetchMethod as typeof fetch)(url, fetchOpts)
        .then(async (res: Response) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        });

    const runWithOptions = (fetchOpts: RequestInit) => {
      if (!isBroadcast && retryOptions) {
        const operation = typeof retryOptions === 'object' ? retry.operation(retryOptions) : retry.operation();
        operation.attempt((currentAttempt: number) => {
          doRequest(fetchOpts)
            .then(
              (result: JsonRpcResponse) => {
                if (result.error) {
                  const error = new JsonRpcError(
                    result.error.message || 'JSON-RPC error',
                    result.error.code,
                    result.error.data
                  );
                  callback!(error, undefined, currentAttempt);
                } else {
                  callback!(null, result.result, currentAttempt);
                }
              },
              (error: unknown) => {
                if (operation.retry(error)) {
                  return;
                }
                callback!(operation.mainError(), undefined, currentAttempt);
              }
            );
        });
      } else {
        doRequest(fetchOpts)
          .then(
            (result: JsonRpcResponse) => {
              if (result.error) {
                const error = new JsonRpcError(
                  result.error.message || 'JSON-RPC error',
                  result.error.code,
                  result.error.data
                );
                callback!(error, undefined, 1);
              } else {
                callback!(null, result.result, 1);
              }
            },
            (error: unknown) => callback!(error instanceof Error ? error : new Error(String(error)), undefined, 1)
          );
      }
    };

    buildFetchOptions(body, this.options)
      .then(runWithOptions)
      .catch((err: unknown) => callback!(err instanceof Error ? err : new Error(String(err)), undefined, 1));
  }
} 