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

export function jsonRpc(uri, {method, id, params, fetchMethod}) {
  const payload = {id, jsonrpc: '2.0', method, params};
  return (fetchMethod || fetch)(uri, {
    body: JSON.stringify(payload),
    method: 'post',
    mode: 'cors',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${ res.status }: ${ res.statusText }`);
    }
    return res.json();
  }).then(rpcRes => {
    if (rpcRes.id !== id) {
      throw new Error(`Invalid response id: ${ rpcRes.id }`);
    }
    if (rpcRes.error) {
      throw new RPCError(rpcRes.error);
    }
    return rpcRes.result
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
    retriable.attempt((currentAttempt) => {
      jsonRpc(this.options.uri, { method: 'call', id, params, fetchMethod }).then(
        res => { callback(null, res); },
        err => {
          if (retriable.retry(err)) return;
          callback(retriable.mainError());
        }
      );
    });
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
    if (this.nonRetriableOperations.some((o) => o === data.method)) {
      // Do not retry if the operation is non-retriable.
      return retry.operation({ retries: 0 });
    } else if (this.options.retry) {
      // If `this.options.retry` is a map of options, use it. If
      // `this.options.retry` is `true`, use default options.
      return (Object(this.options.retry) === this.options.retry) ?
        retry.operation(this.options.retry) :
        retry.operation();
    } else {
      // Otherwise, don't retry.
      return retry.operation({ retries: 0 });
    }
  }
}
