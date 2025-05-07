import fetch from 'cross-fetch';
import newDebug from 'debug';
import retry from 'retry';
import Transport from './base';

const debug = newDebug('steem:http');

class RPCError extends Error {
  constructor(rpcError) {
    super(rpcError.message);
    this.name = 'RPCError';
    this.code = rpcError.code;
    this.data = rpcError.data;
  }
}

/**
 * Makes a JSON-RPC request using `fetch` or a user-provided `fetchMethod`.
 *
 * @param {string} uri - The URI to the JSON-RPC endpoint.
 * @param {string} options.method - The remote JSON-RPC method to call.
 * @param {string} options.id - ID for the request, for matching to a response.
 * @param {*} options.params  - The params for the remote method.
 * @param {function} [options.fetchMethod=fetch] - A function with the same
 * signature as `fetch`, which can be used to make the network request, or for
 * stubbing in tests.
 * @param {number} [options.timeoutMs=30000] - Request timeout in milliseconds.
 */
export function jsonRpc(uri, {method, id, params, fetchMethod=fetch, timeoutMs=30000}) {
  const payload = {id, jsonrpc: '2.0', method, params};
  
  let timeoutId = null;
  
  // Create a promise that will reject after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  // Create the fetch promise
  const fetchPromise = fetchMethod(uri, {
    body: JSON.stringify(payload),
    method: 'post',
    mode: 'cors',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }).then(rpcRes => {
    if (rpcRes.id !== id) {
      throw new Error(`Invalid response id: ${rpcRes.id}`);
    }
    if (rpcRes.error) {
      throw new RPCError(rpcRes.error);
    }
    return rpcRes.result;
  });
  
  // Race the fetch against the timeout
  return Promise.race([fetchPromise, timeoutPromise])
    .finally(() => {
      // Clear the timeout to avoid memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
}

export default class HttpTransport extends Transport {
  send(api, data, callback) {
    if (this.options.useAppbaseApi) {
      api = 'condenser_api';
    }
    debug('Steem::send', api, data);
    const id = data.id || this.id++;
    const params = [api, data.method, data.params];
    const retriable = this.retriable(api, data);
    const fetchMethod = this.options.fetchMethod;
    
    // Use a longer timeout for broadcast operations (60s) and standard operations (30s)
    const timeoutMs = this.isBroadcastOperation(data.method) ? 60000 : 30000;
    
    if (retriable) {
      retriable.attempt((currentAttempt) => {
        jsonRpc(this.options.uri, { method: 'call', id, params, fetchMethod, timeoutMs }).then(
          res => { callback(null, res); },
          err => {
            if (retriable.retry(err)) {
              return;
            }
            callback(retriable.mainError());
          }
        );
      });
    } else {
      jsonRpc(this.options.uri, { method: 'call', id, params, fetchMethod, timeoutMs }).then(
        res => { callback(null, res); },
        err => { callback(err); }
      );
    }
  }

  isBroadcastOperation(method) {
    return this.nonRetriableOperations.some(op => op === method);
  }

  get nonRetriableOperations() {
    return this.options.nonRetriableOperations || [
      'broadcast_transaction',
      'broadcast_transaction_with_callback',
      'broadcast_transaction_synchronous',
      'broadcast_block',
    ];
  }

  // An object which can be used to track retries.
  retriable(api, data) {
    if (this.isBroadcastOperation(data.method)) {
      // Do not retry if the operation is non-retriable.
      return null;
    } else if (Object(this.options.retry) === this.options.retry) {
      // If `this.options.retry` is a map of options, pass those to operation.
      return retry.operation(this.options.retry);
    } else if (this.options.retry) {
      // If `this.options.retry` is `true`, use default options.
      return retry.operation();
    } else {
      // Otherwise, don't retry.
      return null;
    }
  }
}
