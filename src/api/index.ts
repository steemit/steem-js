import { EventEmitter } from 'events';
import Bluebird from 'bluebird';
import { getConfig } from '../config';
import { camelCase } from '../utils';
import { sign as signRequest } from './rpc-auth';
import methods from './methods';
import { jsonRpc } from './transports/http';
import { transports } from './transports/index';

interface ApiOptions {
  url?: string;
  uri?: string;
  /**
   * WebSocket URL
   * NOTE: WebSocket functionality is currently not supported.
   * This field is kept for backward compatibility only.
   * Please use HTTP transport (via url or uri field) for API calls.
   */
  websocket?: string;
  transport?: string | any;
  logger?: any;
  useTestNet?: boolean;
  useAppbaseApi?: boolean;
}

interface Logger {
  log: (...args: any[]) => void;
  [key: string]: (...args: any[]) => void;
}

export class Api extends EventEmitter {
  private seqNo: number = 0;
  private _transportType: string = 'ws';
  private transport: any;
  private options: ApiOptions;
  private __logger: Logger | false = false;

  // Patch for all API methods to support both callback and promise styles
  // This is a helper to wrap methods
  private static _wrapWithPromise(fn: (...args: any[]) => void) {
    return function(this: any, ...args: any[]) {
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'function') {
        return fn.apply(this, args);
      }
      return new Bluebird((resolve: any, reject: any) => {
        fn.apply(this, [...args, (err: any, result: any) => {
          if (err) return reject(err);
          resolve(result);
        }]);
      });
    };
  }

  constructor(options: ApiOptions = {}) {
    super();
    this._setTransport(options);
    this._setLogger(options);
    this.options = options;

    methods.forEach(method => {
      const methodName = method.method_name || camelCase(method.method);
      const methodParams = method.params || [];

      // Ensure we define the "With" method first
      (this as any)[`${methodName}With`] = (options: any, callback: any) => {
        let params;
        if (!method.is_object) {
          params = methodParams.map((param: string) => options[param]);
        } else {
          params = options;
        }
        return this.send(method.api, {
          method: method.method,
          params: params
        }, (err: any, result: any) => {
          // Patch for getConfig: ensure strict backward compatibility
          if (methodName === 'getConfig' && result && typeof result === 'object') {
            if (!('STEEMIT_ADDRESS_PREFIX' in result)) {
              const config = getConfig().all();
              result.STEEMIT_ADDRESS_PREFIX = config.address_prefix || 'STM';
            }
            if (!('STEEMIT_CHAIN_ID' in result)) {
              const config = getConfig().all();
              result.STEEMIT_CHAIN_ID = config.chain_id || '0000000000000000000000000000000000000000000000000000000000000000';
            }
          }
          callback(err, result);
        });
      };

      // Then define the base method that uses the "With" method
      (this as any)[methodName] = Api._wrapWithPromise(function(this: any, ...args: any[]) {
        const options = methodParams.reduce((memo: any, param: string, i: number) => {
          memo[param] = args[i];
          return memo;
        }, {});
        const callback = args[methodParams.length];
        return (this as any)[`${methodName}With`](options, callback);
      });

      (this as any)[`${methodName}WithAsync`] = Bluebird.promisify((this as any)[`${methodName}With`]);
      (this as any)[`${methodName}Async`] = Bluebird.promisify((this as any)[methodName]);
    });
  }

  private _setTransport(options: ApiOptions) {
    // Match the original steem-js logic for transport selection
    if (options.url && options.url.match(/^((http|https)?:\/\/)/)) {
      options.uri = options.url;
      options.transport = 'http';
      this._transportType = options.transport;
      this.options = options;
      this.transport = new transports.http(options);
    } else if (options.url && options.url.match(/^((ws|wss)?:\/\/)/)) {
      // NOTE: WebSocket functionality is currently not supported.
      // This code path is kept for backward compatibility only.
      // Please use HTTP transport (https://api.steemit.com) for API calls.
      options.websocket = options.url;
      options.transport = 'ws';
      this._transportType = options.transport;
      this.options = options;
      this.transport = new transports.ws(options);
    } else if (options.transport) {
      if (this.transport && this._transportType !== options.transport) {
        this.transport.stop();
      }
      this._transportType = options.transport;
      if (typeof options.transport === 'string') {
        if (!(transports as Record<string, any>)[options.transport]) {
          throw new TypeError(
            'Invalid `transport`, valid values are `http`, `ws` or a class',
          );
        }
        this.transport = new (transports as Record<string, any>)[options.transport](options);
      } else {
        this.transport = new options.transport(options);
      }
    } else {
      // Default to HTTP for https://api.steemit.com
      const defaultNode = getConfig().get('node') || 'https://api.steemit.com';
      if (defaultNode.match(/^((http|https)?:\/\/)/)) {
        options.uri = defaultNode;
        options.transport = 'http';
        this._transportType = options.transport;
        this.options = options;
        this.transport = new transports.http(options);
      } else if (defaultNode.match(/^((ws|wss)?:\/\/)/)) {
        // NOTE: WebSocket functionality is currently not supported.
        // This code path is kept for backward compatibility only.
        // Please use HTTP transport (https://api.steemit.com) for API calls.
        options.websocket = defaultNode;
        options.transport = 'ws';
        this._transportType = options.transport;
        this.options = options;
        this.transport = new transports.ws(options);
      } else {
        // NOTE: WebSocket functionality is currently not supported.
        // This fallback path is kept for backward compatibility only.
        // Please use HTTP transport (https://api.steemit.com) for API calls.
        this.transport = new transports.ws(options);
      }
    }
  }

  private _setLogger(options: ApiOptions) {
    if (Object.prototype.hasOwnProperty.call(options, 'logger')) {
      switch (typeof options.logger) {
        case 'function':
          this.__logger = {
            log: options.logger
          };
          break;
        case 'object':
          if (typeof options.logger.log !== 'function') {
            throw new Error('setOptions({logger:{}}) must have a property .log of type function')
          }
          this.__logger = options.logger;
          break;
        case 'undefined':
          if (this.__logger) break;
          this.__logger = false;
          break;
        default:
          this.__logger = false;
      }
    }
  }

  log(logLevel: string, ...args: any[]) {
    if (this.__logger) {
      if ((args.length > 0) && typeof (this.__logger as any)[logLevel] === 'function') {
        (this.__logger as any)[logLevel].apply(this.__logger, args);
      } else {
        this.__logger.log.apply(this.__logger, [logLevel, ...args]);
      }
    }
  }

  start() {
    return this.transport.start();
  }

  stop() {
    return this.transport.stop();
  }

  send(api: string, data: any, callback: any) {
    let cb = callback;
    if (this.__logger) {
      const id = Math.random();
      this.log('xmit:' + id + ':', data);
      cb = (e: any, d: any) => {
        if (e) {
          this.log('error', 'rsp:' + id + ':\n\n', e, d);
        } else {
          this.log('rsp:' + id + ':', d);
        }
        if (callback) {
          callback(e, d);
        }
      };
    }
    return this.transport.send(api, data, cb);
  }

  call(method: string, params: any[], callback: any) {
    if (this._transportType !== 'http') {
      callback(new Error('RPC methods can only be called when using http transport'));
      return;
    }
    const id = ++this.seqNo;
    jsonRpc(this.options.uri!, { method, params, id })
      .then(res => { callback(null, res); }, err => { callback(err); });
  }

  signedCall(method: string, params: any[], account: string, key: string, callback: any) {
    if (this._transportType !== 'http') {
      callback(new Error('RPC methods can only be called when using http transport'));
      return;
    }
    const id = ++this.seqNo;
    let request;
    try {
      request = signRequest({ method, params, id }, account, [key]);
    } catch (error) {
      callback(error);
      return;
    }
    jsonRpc(this.options.uri!, request as any)
      .then(res => { callback(null, res); }, err => { callback(err); });
  }

  /**
   * Verify a signed RPC request
   * @param signedRequest The signed request to verify
   * @param callback Callback function
   */
  verifySignedRequest(signedRequest: any, callback: any) {
    import('./rpc-auth').then(({ validate }) => {
      // Create verification function that checks signatures against account's public keys
      const verifyFunction = async (message: Buffer, signatures: string[], account: string) => {
        try {
          // Get account's public keys
          const accounts = await new Promise<any[]>((resolve, reject) => {
            this.call('condenser_api.get_accounts', [[account]], (err: any, result: any) => {
              if (err) reject(err);
              else resolve(result);
            });
          });

          if (!accounts || accounts.length === 0) {
            throw new Error(`Account ${account} not found`);
          }

          const accountData = accounts[0];
          const publicKeys = [
            accountData.owner.key_auths[0]?.[0],
            accountData.active.key_auths[0]?.[0],
            accountData.posting.key_auths[0]?.[0],
            accountData.memo_key
          ].filter(Boolean);

          // Import verification functions
          const { verifySignature } = await import('../auth');
          const { Signature } = await import('../auth/ecc');

          // Verify at least one signature matches one of the account's keys
          let verified = false;
          for (const signature of signatures) {
            for (const publicKey of publicKeys) {
              try {
                const sig = Signature.fromHex(signature);
                const { PublicKey } = await import('../auth/ecc');
                const pubKey = PublicKey.fromString(publicKey);
                if (sig.verifyBuffer(message, pubKey)) {
                  verified = true;
                  break;
                }
              } catch {
                // Continue to next key/signature combination
              }
            }
            if (verified) break;
          }

          if (!verified) {
            throw new Error('No valid signature found for account');
          }
        } catch (error) {
          throw error;
        }
      };

      // Validate the signed request
      validate(signedRequest, verifyFunction)
        .then(params => callback(null, { valid: true, params }))
        .catch(error => callback(error));
    }).catch(callback);
  }

  setOptions(options: ApiOptions) {
    Object.assign(this.options, options);
    this._setLogger(options);
    this._setTransport(options);
    this.transport.setOptions(options);
    if (Object.prototype.hasOwnProperty.call(options, 'useTestNet')) {
      getConfig().set('address_prefix', options.useTestNet ? 'TST' : 'STM');
    }
  }

  /**
   * Set WebSocket URL
   * 
   * NOTE: WebSocket functionality is currently not supported.
   * This method is kept for backward compatibility only.
   * Please use HTTP transport (via setOptions({ url: 'https://api.steemit.com' })) for API calls.
   */
  setWebSocket(url: string) {
    this.setOptions({
      websocket: url
    });
  }

  setUri(url: string) {
    this.setOptions({
      uri: url
    });
  }

  streamBlockNumber(mode = 'head', callback: any, ts = 200) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }
    let current = 0;
    let running = true;

    const update = () => {
      if (!running) return;

      (this as any).getDynamicGlobalPropertiesAsync().then(
        (result: any) => {
          const blockId = mode === 'irreversible' ?
            result.last_irreversible_block_num :
            result.head_block_number;

          if (blockId !== current) {
            if (current) {
              for (let i = current; i < blockId; i++) {
                if (i !== current) {
                  callback(null, i);
                }
                current = i;
              }
            } else {
              current = blockId;
              callback(null, blockId);
            }
          }

          setTimeout(update, ts);
        },
        (err: any) => {
          callback(err);
        },
      );
    };

    update();

    return () => {
      running = false;
    };
  }

  streamBlock(mode = 'head', callback: any) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = 0;
    let last = 0;

    const release = this.streamBlockNumber(mode, (err: any, id: any) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      current = id;
      if (current !== last) {
        last = current;
        (this as any).getBlock(current, callback);
      }
    });

    return release;
  }

  streamTransactions(mode = 'head', callback: any) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = 0;
    let last = 0;

    const release = this.streamBlockNumber(mode, (err: any, id: any) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      current = id;
      if (current !== last) {
        last = current;
        (this as any).getBlock(current, (err: any, block: any) => {
          if (err) {
            callback(err);
            return;
          }
          if (block && block.transactions) {
            block.transactions.forEach((tx: any) => {
              callback(null, tx);
            });
          }
        });
      }
    });

    return release;
  }

  streamOperations(mode = 'head', callback: any) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = 0;
    let last = 0;

    const release = this.streamBlockNumber(mode, (err: any, id: any) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      current = id;
      if (current !== last) {
        last = current;
        (this as any).getBlock(current, (err: any, block: any) => {
          if (err) {
            callback(err);
            return;
          }
          if (block && block.transactions) {
            block.transactions.forEach((tx: any) => {
              if (tx.operations) {
                tx.operations.forEach((op: any) => {
                  callback(null, op);
                });
              }
            });
          }
        });
      }
    });

    return release;
  }

  broadcastTransactionSynchronousWith(options: any, callback: any) {
    const trx = options.transaction;
    if (!trx) {
      callback(new Error('transaction is required'));
      return;
    }

    (this as any).broadcastTransactionSynchronous(trx, callback);
  }

  /**
   * Broadcast a transaction to the blockchain.
   * @param trx The transaction object
   * @param callback Callback function
   */
  broadcastTransaction(trx: any, callback: any) {
    // Use the transport to send the transaction
    // This assumes the transport implements broadcastTransactionSynchronous
    if (typeof (this as any).broadcastTransactionSynchronous === 'function') {
      (this as any).broadcastTransactionSynchronous(trx, callback);
    } else if (this.transport && typeof this.transport.broadcastTransactionSynchronous === 'function') {
      this.transport.broadcastTransactionSynchronous(trx, callback);
    } else {
      callback(new Error('broadcastTransaction is not implemented'));
    }
  }

  /**
   * Sign a transaction with the provided private key(s).
   * @param trx The transaction object
   * @param keys Array of WIF private keys
   * @returns Signed transaction object
   */
  signTransaction(trx: any, keys: string[]): any {
    // Use the signTransaction logic from auth if available
    // Fallback: just return the transaction for now
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { signTransaction } = require('../auth');
      return signTransaction(trx, keys);
    } catch (e) {
      throw new Error('signTransaction is not implemented');
    }
  }

  /**
   * Get a single account by name (backward compatibility).
   * @param name The account name
   * @param callback Optional callback
   * @returns Account object or Promise
   */
  getAccount(name: string, callback?: (err: any, result?: any) => void): Bluebird<any> | void {
    if (callback) {
      (this as any).getAccounts([name], (err: any, res: any) => {
        if (err) return callback(err);
        callback(null, res && res[0]);
      });
      return;
    }
    return (this as any).getAccounts([name]).then((res: any) => res && res[0]);
  }

  /**
   * Get followers for an account (backward compatibility).
   * @param account The account name
   * @param startFollower The follower to start from
   * @param type The type of follow
   * @param limit The number of followers to return
   * @param callback Optional callback
   * @returns Array of followers or Promise
   */
  getFollowers(account: string, startFollower: string, type: string, limit: number, callback?: (err: any, result?: any) => void): Bluebird<any[]> | void {
    if (callback) {
      (this as any).get_followers(account, startFollower, type, limit, (err: any, res: any) => {
        if (err) return callback(err);
        callback(null, Array.isArray(res) ? res : []);
      });
      return;
    }
    return (this as any).get_followers(account, startFollower, type, limit)
      .then((res: any) => Array.isArray(res) ? res : [])
      .catch(() => []);
  }

  /**
   * Broadcast a transaction with a confirmation callback.
   * @param confirmationCallback Callback function for transaction confirmation
   * @param trx Transaction object to broadcast
   * @param callback Callback function
   */
  broadcastTransactionWithCallback(confirmationCallback: any, trx: any, callback: any) {
    if (this._transportType !== 'http') {
      callback(new Error('broadcastTransactionWithCallback can only be called when using http transport'));
      return;
    }
    this.send('network_broadcast_api', {
      method: 'broadcast_transaction_with_callback',
      params: [confirmationCallback, trx]
    }, callback);
  }

  /**
   * Broadcast a block to the network.
   * @param block Block object to broadcast
   * @param callback Callback function
   */
  broadcastBlock(block: any, callback: any) {
    if (this._transportType !== 'http') {
      callback(new Error('broadcastBlock can only be called when using http transport'));
      return;
    }
    this.send('network_broadcast_api', {
      method: 'broadcast_block',
      params: [block]
    }, callback);
  }

  /**
   * Set the maximum block age for transaction acceptance.
   * @param maxBlockAge Maximum block age in seconds
   * @param callback Callback function
   */
  setMaxBlockAge(maxBlockAge: number, callback: any) {
    if (this._transportType !== 'http') {
      callback(new Error('setMaxBlockAge can only be called when using http transport'));
      return;
    }
    this.send('network_broadcast_api', {
      method: 'set_max_block_age',
      params: [maxBlockAge]
    }, callback);
  }

  /**
   * Verify transaction authority.
   * @param trx Transaction object to verify
   * @param callback Optional callback function
   * @returns Promise with verification result if no callback provided
   */
  verifyAuthority(trx: any, callback?: (err: any, result?: boolean) => void): Bluebird<boolean> | void {
    if (this._transportType !== 'http') {
      const err = new Error('verifyAuthority can only be called when using http transport');
      if (callback) {
        callback(err);
        return;
      }
      return Bluebird.reject(err);
    }
    if (callback) {
      this.send('database_api', {
        method: 'verify_authority',
        params: [trx]
      }, (err: any, result: any) => {
        callback(err, result || false);
      });
      return;
    }
    return new Bluebird((resolve: any, reject: any) => {
      this.send('database_api', {
        method: 'verify_authority',
        params: [trx]
      }, (err: any, result: any) => {
        if (err) return reject(err);
        resolve(result || false);
      });
    });
  }

  /**
   * Verify account authority.
   * @param nameOrId Account name or ID
   * @param signers Array of signer public keys
   * @param callback Optional callback function
   * @returns Promise with verification result if no callback provided
   */
  verifyAccountAuthority(nameOrId: string, signers: string[], callback?: (err: any, result?: boolean) => void): Bluebird<boolean> | void {
    if (this._transportType !== 'http') {
      const err = new Error('verifyAccountAuthority can only be called when using http transport');
      if (callback) {
        callback(err);
        return;
      }
      return Bluebird.reject(err);
    }
    if (callback) {
      this.send('database_api', {
        method: 'verify_account_authority',
        params: [nameOrId, signers]
      }, (err: any, result: any) => {
        callback(err, result || false);
      });
      return;
    }
    return new Bluebird((resolve: any, reject: any) => {
      this.send('database_api', {
        method: 'verify_account_authority',
        params: [nameOrId, signers]
      }, (err: any, result: any) => {
        if (err) return reject(err);
        resolve(result || false);
      });
    });
  }
}

// Export singleton instance for compatibility
const api = new Api({ uri: getConfig().get('uri'), websocket: getConfig().get('websocket') });

export function setOptions(options: ApiOptions) {
  api.setOptions(options);
}

export function call(method: string, params: any[], callback: any) {
  return api.call(method, params, callback);
}

export function signTransaction(trx: any, keys: string[]) {
  return api.signTransaction(trx, keys);
}

export function verifyAuthority(..._args: any[]) {
  // Implementation would go here
  return false;
}

export default api;

// Export async variants and listeners for compatibility with tests
export const getDynamicGlobalPropertiesAsync = (api as any).getDynamicGlobalPropertiesAsync;
export const getBlockAsync = (api as any).getBlockAsync;
export const getFollowersAsync = (api as any).getFollowersAsync;
export const getContentAsync = (api as any).getContentAsync;
export const listeners = (...args: any[]) => (api as any).listeners(...args);
export const streamBlockNumber = (...args: any[]) => (api as any).streamBlockNumber(...args);
export const streamBlock = (...args: any[]) => (api as any).streamBlock(...args);
export const streamTransactions = (...args: any[]) => (api as any).streamTransactions(...args);
export const streamOperations = (...args: any[]) => (api as any).streamOperations(...args);

// Export signature verification utilities
export { sign as signRequest, validate as validateRequest } from './rpc-auth';
export * as signatureVerification from './signature-verification'; 