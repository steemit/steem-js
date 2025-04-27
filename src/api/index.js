import EventEmitter from 'events';
import Promise from 'bluebird';
import config from '../config';
import methods from './methods';
import transports from './transports';
import {
    camelCase
} from '../utils';
import {
    hash
} from '../auth/ecc';
import {
    ops
} from '../auth/serializer';
import {
    jsonRpc
} from './transports/http';
import {
    sign as signRequest
} from './rpc-auth';

class Steem extends EventEmitter {
    constructor(options = {}) {
        super(options);
        this._setTransport(options);
        this._setLogger(options);
        this.options = options;
        this.seqNo = 0; // used for rpc calls
        methods.forEach(method => {
            const methodName = method.method_name || camelCase(method.method);
            const methodParams = method.params || [];

            this[`${methodName}With`] = (options, callback) => {
                let params;
                if (!method.is_object) {
                    params = methodParams.map(param => options[param]);
                } else {
                    params = options;
                }
                return this.send(method.api, {
                    method: method.method,
                    params: params
                }, callback);
            };

            this[methodName] = (...args) => {
                const options = methodParams.reduce((memo, param, i) => {
                    memo[param] = args[i]; // eslint-disable-line no-param-reassign
                    return memo;
                }, {});
                const callback = args[methodParams.length];
                return this[`${methodName}With`](options, callback);
            };

            this[`${methodName}WithAsync`] = Promise.promisify(this[`${methodName}With`]);
            this[`${methodName}Async`] = Promise.promisify(this[methodName]);
        });
        this.callAsync = Promise.promisify(this.call);
        this.signedCallAsync = Promise.promisify(this.signedCall);
    }

    _setTransport(options) {
        if (options.url && options.url.match('^((http|https)?:\/\/)')) {
            options.uri = options.url;
            options.transport = 'http';
            this._transportType = options.transport;
            this.options = options;
            this.transport = new transports.http(options);
        } else if (options.url && options.url.match('^((ws|wss)?:\/\/)')) {
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
                if (!transports[options.transport]) {
                    throw new TypeError(
                        'Invalid `transport`, valid values are `http`, `ws` or a class',
                    );
                }
                this.transport = new transports[options.transport](options);
            } else {
                this.transport = new options.transport(options);
            }
        } else {
            this.transport = new transports.ws(options);
        }
    }

    _setLogger(options) {
        if (options.hasOwnProperty('logger')) {
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
                default:
                    this.__logger = false;
            }
        }
    }

    log(logLevel) {
        if (this.__logger) {
            if ((arguments.length > 1) && typeof this.__logger[logLevel] === 'function') {
                let args = Array.prototype.slice.call(arguments, 1);
                this.__logger[logLevel].apply(this.__logger, args);
            } else {
                this.__logger.log.apply(this.__logger, arguments);
            }
        }
    }

    start() {
        return this.transport.start();
    }

    stop() {
        return this.transport.stop();
    }

    send(api, data, callback) {
        var cb = callback;
        if (this.__logger) {
            let id = Math.random();
            let self = this;
            this.log('xmit:' + id + ':', data)
            cb = function(e, d) {
                if (e) {
                    self.log('error', 'rsp:' + id + ':\n\n', e, d)
                } else {
                    self.log('rsp:' + id + ':', d)
                }
                if (callback) {
                    callback.apply(self, arguments)
                }
            }
        }
        return this.transport.send(api, data, cb);
    }

    call(method, params, callback) {
        if (this._transportType !== 'http') {
            callback(new Error('RPC methods can only be called when using http transport'));
            return
        }
        const id = ++this.seqNo;
        jsonRpc(this.options.uri, {method, params, id})
            .then(res => { callback(null, res) }, err => { callback(err) });
    }

    signedCall(method, params, account, key, callback) {
        if (this._transportType !== 'http') {
            callback(new Error('RPC methods can only be called when using http transport'));
            return;
        }
        const id = ++this.seqNo;
        let request;
        try {
            request = signRequest({method, params, id}, account, [key]);
        } catch (error) {
            callback(error);
            return;
        }
        jsonRpc(this.options.uri, request)
            .then(res => { callback(null, res) }, err => { callback(err) });
    }

    setOptions(options) {
        Object.assign(this.options, options);
        this._setLogger(options);
        this._setTransport(options);
        this.transport.setOptions(options);
        if( options.hasOwnProperty('useTestNet') )
        {
          config.set( 'address_prefix', options.useTestNet ? 'TST' : 'STM' )
        }
    }

    setWebSocket(url) {
        this.setOptions({
            websocket: url
        });
    }

    setUri(url) {
        this.setOptions({
            uri: url
        });
    }

    streamBlockNumber(mode = 'head', callback, ts = 200) {
        if (typeof mode === 'function') {
            callback = mode;
            mode = 'head';
        }
        let current = '';
        let running = true;

        const update = () => {
            if (!running) return;

            this.getDynamicGlobalPropertiesAsync().then(
                result => {
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

                    Promise.delay(ts).then(() => {
                        update();
                    });
                },
                err => {
                    callback(err);
                },
            );
        };

        update();

        return () => {
            running = false;
        };
    }

    streamBlock(mode = 'head', callback) {
        if (typeof mode === 'function') {
            callback = mode;
            mode = 'head';
        }

        let current = '';
        let last = '';

        const release = this.streamBlockNumber(mode, (err, id) => {
            if (err) {
                release();
                callback(err);
                return;
            }

            current = id;
            if (current !== last) {
                last = current;
                this.getBlock(current, callback);
            }
        });

        return release;
    }

    streamTransactions(mode = 'head', callback) {
        if (typeof mode === 'function') {
            callback = mode;
            mode = 'head';
        }

        const release = this.streamBlock(mode, (err, result) => {
            if (err) {
                release();
                callback(err);
                return;
            }

            if (result && result.transactions) {
                result.transactions.forEach(transaction => {
                    callback(null, transaction);
                });
            }
        });

        return release;
    }

    streamOperations(mode = 'head', callback) {
        if (typeof mode === 'function') {
            callback = mode;
            mode = 'head';
        }

        const release = this.streamTransactions(mode, (err, transaction) => {
            if (err) {
                release();
                callback(err);
                return;
            }

            transaction.operations.forEach(operation => {
                callback(null, operation);
            });
        });

        return release;
    }

    broadcastTransactionSynchronousWith(options, callback) {
    const trx = options.trx;
    return this.send(
        'network_broadcast_api', {
            method: 'broadcast_transaction_synchronous',
            params: [trx],
        },
        (err, result) => {
            if (err) {
                const {
                    signed_transaction
                } = ops;
                // console.log('-- broadcastTransactionSynchronous -->', JSON.stringify(signed_transaction.toObject(trx), null, 2));
                // toObject converts objects into serializable types
                const trObject = signed_transaction.toObject(trx);
                const buf = signed_transaction.toBuffer(trx);
                err.digest = hash.sha256(buf).toString('hex');
                err.transaction_id = buf.toString('hex');
                err.transaction = JSON.stringify(trObject);
                callback(err, '');
            } else {
                callback('', result);
            }
        },
    );

    }
}

// Export singleton instance
const steem = new Steem(config);
exports = module.exports = steem;
exports.Steem = Steem;
