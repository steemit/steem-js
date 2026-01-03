import { EventEmitter } from 'events';
import { getConfig } from '../config';
import { camelCase } from '../utils';
import { promisify } from '../utils/promisify';
import { sign as signRequest } from './rpc-auth';
import methods from './methods';
import { jsonRpc } from './transports/http';
import { transports } from './transports/index';
import type { Transport } from './transports/types';
import type { TransportOptions, JsonRpcRequest } from './transports/types';
import type { SignedRequest } from './signature-verification';
import { Auth } from '../auth';
import type { ApiMethodSignatures } from './types';

interface ApiOptions {
  url?: string;
  transport?: string | (new (options: TransportOptions) => Transport); // Transport type string or Transport class constructor
  logger?: Logger; // Logger instance
  useTestNet?: boolean;
  useAppbaseApi?: boolean;
  fetchMethod?: typeof fetch; // Optional fetch implementation for HTTP requests
  [key: string]: unknown; // Index signature for compatibility with TransportOptions
}

interface Logger {
  log: (...args: unknown[]) => void;
  [key: string]: (...args: unknown[]) => void;
}

export class Api extends EventEmitter {
  private seqNo: number = 0;
  private _transportType: string = 'http';
  private transport: Transport | null = null;
  private options: ApiOptions;
  private __logger: Logger | false = false;
  
  // Index signature to support all dynamically generated methods
  // This allows TypeScript to recognize dynamically added methods
  // The actual method signatures are provided via ApiMethodSignatures interface
  [key: string]: unknown;
  
  // Explicitly declare commonly used methods for better type checking
  // These are dynamically added in the constructor, but declared here for TypeScript
  declare getAccounts: ApiMethodSignatures['getAccounts'];
  declare getAccountsAsync: ApiMethodSignatures['getAccountsAsync'];
  declare getAccountsWith: ApiMethodSignatures['getAccountsWith'];
  declare getAccountsWithAsync: ApiMethodSignatures['getAccountsWithAsync'];

  // Patch for all API methods to support both callback and promise styles
  // This is a helper to wrap methods
  private static _wrapWithPromise(fn: (...args: unknown[]) => void) {
    return function(this: unknown, ...args: unknown[]) {
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'function') {
        return fn.apply(this, args);
      }
      return new Promise<boolean>((resolve, reject) => {
        fn.apply(this, [...args, (err: Error | null, result: unknown) => {
          if (err) return reject(err);
          resolve(Boolean(result));
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
      (this as Record<string, unknown>)[`${methodName}With`] = (options: unknown, callback: unknown) => {
        const optionsObj = options as Record<string, unknown>;
        const callbackFn = callback as ((err: Error | null, result?: unknown) => void) | undefined;
        let params: unknown;
        if (!method.is_object) {
          params = methodParams.map((param: string) => optionsObj[param]);
        } else {
          params = options;
        }
        return this.send(method.api, {
          method: method.method,
          params: params
        }, (err: Error | null, result?: unknown) => {
          // Patch for getConfig: ensure strict backward compatibility
          if (methodName === 'getConfig' && result && typeof result === 'object') {
            const resultObj = result as Record<string, unknown>;
            if (!('STEEMIT_ADDRESS_PREFIX' in resultObj)) {
              const config = getConfig().all();
              resultObj.STEEMIT_ADDRESS_PREFIX = (config.address_prefix as string) || 'STM';
            }
            if (!('STEEMIT_CHAIN_ID' in resultObj)) {
              const config = getConfig().all();
              resultObj.STEEMIT_CHAIN_ID = (config.chain_id as string) || '0000000000000000000000000000000000000000000000000000000000000000';
            }
          }
          if (callbackFn) {
            callbackFn(err, result);
          }
        });
      };

      // Then define the base method that uses the "With" method
      (this as Record<string, unknown>)[methodName] = Api._wrapWithPromise(function(this: unknown, ...args: unknown[]) {
        const options = methodParams.reduce((memo: Record<string, unknown>, param: string, i: number) => {
          memo[param] = args[i];
          return memo;
        }, {});
        const callback = args[methodParams.length] as ((err: Error | null, result?: unknown) => void) | undefined;
        return ((this as Record<string, unknown>)[`${methodName}With`] as (options: Record<string, unknown>, callback?: (err: Error | null, result?: unknown) => void) => unknown)(options, callback);
      });

      (this as Record<string, unknown>)[`${methodName}WithAsync`] = promisify((this as Record<string, unknown>)[`${methodName}With`] as (...args: unknown[]) => unknown);
      (this as Record<string, unknown>)[`${methodName}Async`] = promisify((this as Record<string, unknown>)[methodName] as (...args: unknown[]) => unknown);
    });
  }

  private _setTransport(options: ApiOptions) {
    // Use HTTP transport only
    if (options.url && options.url.match(/^((http|https)?:\/\/)/)) {
      options.transport = 'http';
      this._transportType = options.transport;
      this.options = options;
      this.transport = new transports.http(options);
    } else if (options.transport) {
      const transportType = typeof options.transport === 'string' ? options.transport : 'custom';
      if (this.transport && this._transportType !== transportType) {
        if (typeof this.transport.stop === 'function') {
        this.transport.stop();
        }
      }
      this._transportType = transportType;
      if (typeof options.transport === 'string') {
        if (!(transports as Record<string, unknown>)[options.transport]) {
          throw new TypeError(
            'Invalid `transport`, valid values are `http` or a class',
          );
        }
        const TransportClass = (transports as Record<string, new (options: TransportOptions) => Transport>)[options.transport];
        this.transport = new TransportClass(options);
      } else {
        this.transport = new options.transport(options);
      }
    } else {
      // Default to HTTP using first node from config.nodes
      const nodes = (getConfig().get('nodes') as string[]) || ['https://api.steemit.com'];
      const defaultNode = nodes[0] || 'https://api.steemit.com';
      options.url = defaultNode;
        options.transport = 'http';
        this._transportType = options.transport;
        this.options = options;
        this.transport = new transports.http(options);
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

  log(logLevel: string, ...args: unknown[]) {
    if (this.__logger) {
      const logger = this.__logger as Record<string, (...args: unknown[]) => void>;
      if ((args.length > 0) && typeof logger[logLevel] === 'function') {
        logger[logLevel].apply(this.__logger, args);
      } else {
        this.__logger.log.apply(this.__logger, [logLevel, ...args]);
      }
    }
  }

  start() {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    return this.transport.start();
  }

  stop() {
    if (!this.transport) {
      return Promise.resolve();
    }
    return this.transport.stop();
  }

  send(api: string, data: unknown, callback: unknown) {
    let cb = callback as (err: Error | null, result?: unknown) => void;
    if (this.__logger) {
      const id = Math.random();
      this.log('xmit:' + id + ':', data);
      cb = (e: Error | null, d?: unknown) => {
        if (e) {
          this.log('error', 'rsp:' + id + ':\n\n', e, d);
        } else {
          this.log('rsp:' + id + ':', d);
        }
        if (callback && typeof callback === 'function') {
          (callback as (err: Error | null, result?: unknown) => void)(e, d);
        }
      };
    }
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    return this.transport.send(api, data, cb);
  }

  call(method: string, params: unknown[], callback: (err: Error | null, result?: unknown) => void) {
    if (this._transportType !== 'http') {
      callback(new Error('RPC methods can only be called when using http transport'));
      return;
    }
    const id = ++this.seqNo;
    const fetchMethod = this.options.fetchMethod || fetch;
    jsonRpc(this.options.url!, { method, params, id }, fetchMethod)
      .then(res => { callback(null, res); }, err => { callback(err); });
  }

  /**
   * Promise-based version of call
   * Makes a JSON-RPC call to the Steem blockchain
   * @param method Method name (e.g., 'condenser_api.get_accounts')
   * @param params Parameters array for the method
   * @returns Promise that resolves with the result or rejects with an error
   */
  callAsync(method: string, params: unknown[]): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.call(method, params, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  signedCall(method: string, params: unknown[], account: string, key: string, callback: (err: Error | null, result?: unknown) => void) {
    if (this._transportType !== 'http') {
      callback(new Error('RPC methods can only be called when using http transport'));
      return;
    }
    const id = ++this.seqNo;
    let request;
    try {
      request = signRequest({ method, params, id }, account, [key]);
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    const fetchMethod = this.options.fetchMethod || fetch;
    jsonRpc(this.options.url!, request as unknown as Partial<JsonRpcRequest>, fetchMethod)
      .then(res => { callback(null, res); }, err => { callback(err); });
  }

  /**
   * Promise-based version of signedCall
   * Makes an authenticated JSON-RPC call with cryptographic signature
   * @param method Method name (e.g., 'conveyor.is_email_registered')
   * @param params Parameters array for the method
   * @param account Account name to sign the request with
   * @param key Private key (WIF) to sign the request
   * @returns Promise that resolves with the result or rejects with an error
   */
  signedCallAsync(method: string, params: unknown[], account: string, key: string): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.signedCall(method, params, account, key, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Verify a signed RPC request
   * @param signedRequest The signed request to verify
   * @param callback Callback function
   */
  verifySignedRequest(signedRequest: unknown, callback: (err: Error | null, result?: unknown) => void) {
    import('./rpc-auth').then(({ validate }) => {
      // Create verification function that checks signatures against account's public keys
      const verifyFunction = async (message: Buffer, signatures: string[], account: string) => {
          // Get account's public keys
        const accounts = await new Promise<unknown[]>((resolve, reject) => {
          this.call('condenser_api.get_accounts', [[account]], (err: Error | null, result?: unknown) => {
              if (err) reject(err);
            else resolve(Array.isArray(result) ? result : []);
            });
          });

          if (!accounts || accounts.length === 0) {
            throw new Error(`Account ${account} not found`);
          }

        const accountData = accounts[0] as Record<string, unknown>;
        const owner = (accountData.owner as Record<string, unknown>)?.key_auths as unknown[][];
        const active = (accountData.active as Record<string, unknown>)?.key_auths as unknown[][];
        const posting = (accountData.posting as Record<string, unknown>)?.key_auths as unknown[][];
          const publicKeys = [
          owner?.[0]?.[0],
          active?.[0]?.[0],
          posting?.[0]?.[0],
            accountData.memo_key
          ].filter(Boolean);

          // Import verification functions
          const { Signature, PublicKey } = await import('../auth');

          // Verify at least one signature matches one of the account's keys
          let verified = false;
          for (const signature of signatures) {
            for (const publicKey of publicKeys) {
              try {
                const sig = Signature.fromHex(signature);
              const pubKey = PublicKey.fromString(String(publicKey));
                if (pubKey && sig.verifyBuffer(message, pubKey)) {
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
      };

      // Validate the signed request
      validate(signedRequest as SignedRequest, verifyFunction)
        .then(params => callback(null, { valid: true, params }))
        .catch(error => callback(error instanceof Error ? error : new Error(String(error))));
    }).catch(callback);
  }

  /**
   * Promise-based version of verifySignedRequest
   * Verifies a signed RPC request
   * @param signedRequest The signed request to verify
   * @returns Promise that resolves with verification result or rejects with an error
   */
  verifySignedRequestAsync(signedRequest: unknown): Promise<{ valid: boolean; params: unknown }> {
    return new Promise<{ valid: boolean; params: unknown }>((resolve: (value: { valid: boolean; params: unknown }) => void, reject: (reason?: unknown) => void) => {
      this.verifySignedRequest(signedRequest, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result as { valid: boolean; params: unknown });
        }
      });
    });
  }

  setOptions(options: ApiOptions) {
    Object.assign(this.options, options);
    this._setLogger(options);
    this._setTransport(options);
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    this.transport.setOptions(options);
    if (Object.prototype.hasOwnProperty.call(options, 'useTestNet')) {
      getConfig().set('address_prefix', options.useTestNet ? 'TST' : 'STM');
    }
  }


  setUrl(url: string) {
    this.setOptions({
      url: url
    });
  }

  streamBlockNumber(mode: string | ((err: Error | null, blockNumber?: unknown) => void) = 'head', callback?: (err: Error | null, blockNumber?: unknown) => void, ts = 200) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }
    if (!callback) {
      throw new Error('callback is required');
    }
    let current = 0;
    let running = true;

    const update = () => {
      if (!running) return;

      ((this as Record<string, unknown>).getDynamicGlobalPropertiesAsync as () => Promise<unknown>)().then(
        (result: unknown) => {
          const props = result as Record<string, unknown>;
          const blockId = mode === 'irreversible' ?
            (props.last_irreversible_block_num as number) :
            (props.head_block_number as number);

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
        (err: Error | null) => {
          callback(err);
        },
      );
    };

    update();

    return () => {
      running = false;
    };
  }

  streamBlock(mode = 'head', callback: (err: Error | null, block?: unknown) => void) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = 0;
    let last = 0;

    const release = this.streamBlockNumber(mode, (err: Error | null, id?: unknown) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      current = id as number;
      if (current !== last) {
        last = current;
        ((this as Record<string, unknown>).getBlock as (blockNumber: number, callback: (err: Error | null, block?: unknown) => void) => void)(current, callback);
      }
    });

    return release;
  }

  streamTransactions(mode: string | ((err: Error | null, tx?: unknown) => void) = 'head', callback?: (err: Error | null, tx?: unknown) => void) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = 0;
    let last = 0;

    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }
    if (!callback) {
      throw new Error('callback is required');
    }
    const release = this.streamBlockNumber(mode, (err: Error | null, id?: unknown) => {
      if (err) {
        release();
        callback!(err);
        return;
      }

      current = id as number;
      if (current !== last) {
        last = current;
        ((this as Record<string, unknown>).getBlock as (blockNumber: number, callback: (err: Error | null, block?: unknown) => void) => void)(current, (err: Error | null, block?: unknown) => {
          if (err) {
            callback!(err);
            return;
          }
          if (block && typeof block === 'object' && 'transactions' in block) {
            const blockObj = block as { transactions?: unknown[] };
            if (Array.isArray(blockObj.transactions)) {
              blockObj.transactions.forEach((tx: unknown) => {
                callback!(null, tx);
            });
            }
          }
        });
      }
    });

    return release;
  }

  streamOperations(mode: string | ((err: Error | null, op?: unknown) => void) = 'head', callback?: (err: Error | null, op?: unknown) => void) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = 0;
    let last = 0;

    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }
    if (!callback) {
      throw new Error('callback is required');
    }
    const release = this.streamBlockNumber(mode, (err: Error | null, id?: unknown) => {
      if (err) {
        release();
        callback!(err);
        return;
      }

      current = id as number;
      if (current !== last) {
        last = current;
        ((this as Record<string, unknown>).getBlock as (blockNumber: number, callback: (err: Error | null, block?: unknown) => void) => void)(current, (err: Error | null, block?: unknown) => {
          if (err) {
            callback!(err);
            return;
          }
          if (block && typeof block === 'object' && 'transactions' in block) {
            const blockObj = block as { transactions?: Array<{ operations?: unknown[] }> };
            if (Array.isArray(blockObj.transactions)) {
              blockObj.transactions.forEach((tx: { operations?: unknown[] }) => {
                if (Array.isArray(tx.operations)) {
                  tx.operations.forEach((op: unknown) => {
                    callback!(null, op);
                });
              }
            });
            }
          }
        });
      }
    });

    return release;
  }

  broadcastTransactionSynchronousWith(options: { transaction: unknown }, callback: (err: Error | null, result?: unknown) => void) {
    const trx = options.transaction;
    if (!trx) {
      callback(new Error('transaction is required'));
      return;
    }

    ((this as Record<string, unknown>).broadcastTransactionSynchronous as (trx: unknown, callback: (err: Error | null, result?: unknown) => void) => void)(trx, callback);
  }

  /**
   * Promise-based version of broadcastTransactionSynchronousWith
   * Broadcasts a transaction synchronously
   * @param options Options object containing the transaction
   * @returns Promise that resolves with the result or rejects with an error
   */
  broadcastTransactionSynchronousWithAsync(options: { transaction: unknown }): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.broadcastTransactionSynchronousWith(options, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Broadcast a transaction to the blockchain.
   * @param trx The transaction object
   * @param callback Callback function
   */
  broadcastTransaction(trx: unknown, callback: (err: Error | null, result?: unknown) => void) {
    // Use the transport to send the transaction
    // This assumes the transport implements broadcastTransactionSynchronous
    const broadcastMethod = (this as Record<string, unknown>).broadcastTransactionSynchronous;
    if (typeof broadcastMethod === 'function') {
      (broadcastMethod as (trx: unknown, callback: (err: Error | null, result?: unknown) => void) => void)(trx, callback);
    } else if (this.transport && typeof ((this.transport as unknown) as Record<string, unknown>).broadcastTransactionSynchronous === 'function') {
      (((this.transport as unknown) as Record<string, unknown>).broadcastTransactionSynchronous as (trx: unknown, callback: (err: Error | null, result?: unknown) => void) => void)(trx, callback);
    } else {
      callback(new Error('broadcastTransaction is not implemented'));
    }
  }

  /**
   * Promise-based version of broadcastTransaction
   * Broadcasts a transaction to the blockchain
   * @param trx The transaction object
   * @returns Promise that resolves with the result or rejects with an error
   */
  broadcastTransactionAsync(trx: unknown): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.broadcastTransaction(trx, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Sign a transaction with the provided private key(s).
   * @param trx The transaction object
   * @param keys Array of WIF private keys
   * @returns Signed transaction object
   */
  signTransaction(trx: unknown, keys: string[]): unknown {
    // Use the signTransaction logic from auth
    return Auth.signTransaction(trx, keys);
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
  getFollowers(account: string, startFollower: string, type: string, limit: number, callback?: (err: Error | null, result?: unknown[]) => void): Promise<unknown[]> | void {
    if (callback) {
      ((this as Record<string, unknown>).get_followers as (account: string, startFollower: string, type: string, limit: number, callback: (err: Error | null, res?: unknown) => void) => void)(account, startFollower, type, limit, (err: Error | null, res?: unknown) => {
        if (err) return callback(err);
        callback(null, Array.isArray(res) ? res : []);
      });
      return;
    }
    return ((this as Record<string, unknown>).get_followers as (account: string, startFollower: string, type: string, limit: number) => Promise<unknown>)(account, startFollower, type, limit)
      .then((res: unknown) => Array.isArray(res) ? res : [])
      .catch(() => []);
  }

  /**
   * Broadcast a transaction with a confirmation callback.
   * @param confirmationCallback Callback function for transaction confirmation
   * @param trx Transaction object to broadcast
   * @param callback Callback function
   */
  broadcastTransactionWithCallback(confirmationCallback: (result: unknown) => void, trx: unknown, callback: (err: Error | null, result?: unknown) => void) {
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
   * Promise-based version of broadcastTransactionWithCallback
   * Note: The confirmationCallback will still be called when the transaction is confirmed
   * @param confirmationCallback Callback function for transaction confirmation
   * @param trx Transaction object to broadcast
   * @returns Promise that resolves with the result or rejects with an error
   */
  broadcastTransactionWithCallbackAsync(confirmationCallback: (result: unknown) => void, trx: unknown): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.broadcastTransactionWithCallback(confirmationCallback, trx, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Broadcast a block to the network.
   * @param block Block object to broadcast
   * @param callback Callback function
   */
  broadcastBlock(block: unknown, callback: (err: Error | null, result?: unknown) => void) {
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
   * Promise-based version of broadcastBlock
   * Broadcasts a block to the network
   * @param block Block object to broadcast
   * @returns Promise that resolves with the result or rejects with an error
   */
  broadcastBlockAsync(block: unknown): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.broadcastBlock(block, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Set the maximum block age for transaction acceptance.
   * @param maxBlockAge Maximum block age in seconds
   * @param callback Callback function
   */
  setMaxBlockAge(maxBlockAge: number, callback: (err: Error | null, result?: unknown) => void) {
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
   * Promise-based version of setMaxBlockAge
   * Sets the maximum block age for transaction acceptance
   * @param maxBlockAge Maximum block age in seconds
   * @returns Promise that resolves with the result or rejects with an error
   */
  setMaxBlockAgeAsync(maxBlockAge: number): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      this.setMaxBlockAge(maxBlockAge, (err: Error | null, result?: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Verify transaction authority.
   * @param trx Transaction object to verify
   * @param callback Optional callback function
   * @returns Promise with verification result if no callback provided
   */
  verifyAuthority(trx: unknown, callback?: (err: Error | null, result?: boolean) => void): Promise<boolean> | void {
    if (this._transportType !== 'http') {
      const err = new Error('verifyAuthority can only be called when using http transport');
      if (callback) {
        callback(err);
        return;
      }
      return Promise.reject(err);
    }
    if (callback) {
      this.send('database_api', {
        method: 'verify_authority',
        params: [trx]
      }, (err: Error | null, result?: unknown) => {
        callback(err, Boolean(result));
      });
      return;
    }
    return new Promise<boolean>((resolve, reject) => {
      this.send('database_api', {
        method: 'verify_authority',
        params: [trx]
      }, (err: Error | null, result?: unknown) => {
        if (err) return reject(err);
        resolve(Boolean(result));
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
  verifyAccountAuthority(nameOrId: string, signers: string[], callback?: (err: Error | null, result?: boolean) => void): Promise<boolean> | void {
    if (this._transportType !== 'http') {
      const err = new Error('verifyAccountAuthority can only be called when using http transport');
      if (callback) {
        callback(err);
        return;
      }
      return Promise.reject(err);
    }
    if (callback) {
      this.send('database_api', {
        method: 'verify_account_authority',
        params: [nameOrId, signers]
      }, (err: Error | null, result?: unknown) => {
        callback(err, Boolean(result));
      });
      return;
    }
    return new Promise<boolean>((resolve, reject) => {
      this.send('database_api', {
        method: 'verify_account_authority',
        params: [nameOrId, signers]
      }, (err: Error | null, result?: unknown) => {
        if (err) return reject(err);
        resolve(Boolean(result));
      });
    });
  }
}

// Export singleton instance for compatibility
// Use first node from config.nodes array
const nodes = (getConfig().get('nodes') as string[]) || ['https://api.steemit.com'];
const api = new Api({ url: nodes[0] || 'https://api.steemit.com' });

export function setOptions(options: ApiOptions) {
  api.setOptions(options);
}

export function call(method: string, params: unknown[], callback: (err: Error | null, result?: unknown) => void) {
  return api.call(method, params, callback);
}

export function signTransaction(trx: unknown, keys: string[]) {
  return api.signTransaction(trx, keys);
}

export function verifyAuthority(..._args: unknown[]) {
  // Implementation would go here
  return false;
}

export default api;

// Export async variants and listeners for compatibility with tests
export const getDynamicGlobalPropertiesAsync = ((api as unknown) as Record<string, unknown>).getDynamicGlobalPropertiesAsync as () => Promise<unknown>;
export const getBlockAsync = ((api as unknown) as Record<string, unknown>).getBlockAsync as (...args: unknown[]) => Promise<unknown>;
export const getFollowersAsync = ((api as unknown) as Record<string, unknown>).getFollowersAsync as (...args: unknown[]) => Promise<unknown>;
export const getContentAsync = ((api as unknown) as Record<string, unknown>).getContentAsync as (...args: unknown[]) => Promise<unknown>;
export const listeners = (...args: unknown[]) => (((api as unknown) as Record<string, unknown>).listeners as (...args: unknown[]) => unknown)(...args);
export const streamBlockNumber = (...args: unknown[]) => (((api as unknown) as Record<string, unknown>).streamBlockNumber as (...args: unknown[]) => unknown)(...args);
export const streamBlock = (...args: unknown[]) => (((api as unknown) as Record<string, unknown>).streamBlock as (...args: unknown[]) => unknown)(...args);
export const streamTransactions = (...args: unknown[]) => (((api as unknown) as Record<string, unknown>).streamTransactions as (...args: unknown[]) => unknown)(...args);
export const streamOperations = (...args: unknown[]) => (((api as unknown) as Record<string, unknown>).streamOperations as (...args: unknown[]) => unknown)(...args);

// Export signature verification utilities
export { sign as signRequest, validate as validateRequest } from './rpc-auth';
export * as signatureVerification from './signature-verification'; 