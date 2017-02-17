import fetch from 'isomorphic-fetch';
import EventEmitter from 'events';
import Promise from 'bluebird';
import newDebug from 'debug';
import config from '../../config.json';
import methods from './methods';
import {hash} from '../auth/ecc';
import {ops} from '../auth/serializer';
import { camelCase } from '../util';

const debugSetup = newDebug('steem:setup');

class Steem extends EventEmitter {
  constructor(options = {}) {
    super(options);
    this.id = 0;
    this.uri = config.uri;
  }

  send(api, data, callback) {
    debugSetup('Steem::send', api, data);
    const id = data.id || this.id++;
    const payload = {
      id,
      method: 'call',
      params: [
        api,
        data.method,
        data.params,
      ],
    };
    fetch(this.uri, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        const err = json.error || '';
        const result = json.result || '';
        callback(err, result);
      }).catch((err) => {
        callback(err, '');
      });
  }

  setUri(uri) {
    this.uri = uri;
  }

  streamBlockNumber(callback, ts = 200) {
    let current = '';
    let running = true;

    const update = () => {
      if (!running) return;

      this.getDynamicGlobalPropertiesAsync()
        .then((result) => {
          const blockId = result.head_block_number;
          if (blockId !== current) {
            current = blockId;
            callback(null, current);
          }

          Promise.delay(ts).then(() => {
            update();
          });
        }, (err) => {
          callback(err);
        });
    };

    update();

    return () => {
      running = false;
    };
  }

  streamBlock(callback) {
    let current = '';
    let last = '';

    const release = this.streamBlockNumber((err, id) => {
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

  streamTransactions(callback) {
    const release = this.streamBlock((err, result) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      if (result && result.transactions) {
        result.transactions.forEach((transaction) => {
          callback(null, transaction);
        });
      }
    });

    return release;
  }

  streamOperations(callback) {
    const release = this.streamTransactions((err, transaction) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      transaction.operations.forEach((operation) => {
        callback(null, operation);
      });
    });

    return release;
  }
}

// Generate Methods from methods.json
methods.forEach((method) => {
  const methodName = camelCase(method.method);
  const methodParams = method.params || [];

  Steem.prototype[`${methodName}With`] =
    function Steem$$specializedSendWith(options, callback) {
      const params = methodParams.map((param) => options[param]);
      return this.send(method.api, {
        method: method.method,
        params,
      }, callback);
    };

  Steem.prototype[methodName] =
    function Steem$specializedSend(...args) {
      const options = methodParams.reduce((memo, param, i) => {
        memo[param] = args[i]; // eslint-disable-line no-param-reassign
        return memo;
      }, {});
      const callback = args[methodParams.length];
      return this[`${methodName}With`](options, callback);
    };
});

/*
 Wrap transaction broadcast: serializes the object and adds error reporting
 */
Steem.prototype.broadcastTransactionSynchronousWith =
  function Steem$$specializedSendWith(options, callback) {
    const trx = options.trx;
    return this.send('network_broadcast_api', {
      method: 'broadcast_transaction_synchronous',
      params: [trx],
    }, (err, result) => {
      if (err) {
        const {signed_transaction} = ops;
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
    });
  };

delete Steem.prototype.broadcastTransaction; // not supported
delete Steem.prototype.broadcastTransactionWithCallback; // not supported

Promise.promisifyAll(Steem.prototype);

// Export singleton instance
const steem = new Steem();
exports = module.exports = steem;
exports.Steem = Steem;
