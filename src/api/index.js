import EventEmitter from 'events';
import Promise from 'bluebird';
import cloneDeep from 'lodash/cloneDeep';
import defaults from 'lodash/defaults';
import isNode from 'detect-node';
import newDebug from 'debug';
import config from '../config';
import methods from './methods';
import { camelCase } from '../util';

const debugEmitters = newDebug('steem:emitters');
const debugProtocol = newDebug('steem:protocol');
const debugSetup = newDebug('steem:setup');
const debugApiIds = newDebug('steem:api_ids');
const debugWs = newDebug('steem:ws');

let WebSocket;
if (isNode) {
  WebSocket = require('ws'); // eslint-disable-line global-require
} else if (typeof window !== 'undefined') {
  WebSocket = window.WebSocket;
} else {
  throw new Error('Couldn\'t decide on a `WebSocket` class');
}

const DEFAULTS = {
  apiIds: {
    database_api: 0,
    login_api: 1,
    follow_api: 2,
    network_broadcast_api: 4,
  },
  id: 0,
};

class Steem extends EventEmitter {
  constructor(options = {}) {
    super(options);
    defaults(options, DEFAULTS);
    this.options = cloneDeep(options);

    this.id = 0;
    this.inFlight = 0;
    this.currentP = Promise.fulfilled();
    this.apiIds = this.options.apiIds;
    this.isOpen = false;
    this.releases = [];

    // A Map of api name to a promise to it's API ID refresh call
    this.apiIdsP = {};
  }

  setWebSocket(url) {
    console.warn("steem.api.setWebSocket(url) is now deprecated instead use steem.config.set('websocket',url)");
    debugSetup('Setting WS', url);
    config.set('websocket', url);
    this.stop();
  }

  start() {
    if (this.startP) {
      return this.startP;
    }

    const startP = new Promise((resolve, reject) => {
      if (startP !== this.startP) return;
      const url = config.get('websocket');
      this.ws = new WebSocket(url);

      const releaseOpen = this.listenTo(this.ws, 'open', () => {
        debugWs('Opened WS connection with', url);
        this.isOpen = true;
        releaseOpen();
        resolve();
      });

      const releaseClose = this.listenTo(this.ws, 'close', () => {
        debugWs('Closed WS connection with', url);
        this.isOpen = false;
        delete this.ws;
        this.stop();

        if (startP.isPending()) {
          reject(new Error(
            'The WS connection was closed before this operation was made'
          ));
        }
      });

      const releaseMessage = this.listenTo(this.ws, 'message', (message) => {
        debugWs('Received message', message.data);
        this.emit('message', JSON.parse(message.data));
      });

      this.releases = this.releases.concat([
        releaseOpen,
        releaseClose,
        releaseMessage,
      ]);
    });

    this.startP = startP;
    this.getApiIds();

    return startP;
  }

  stop() {
    debugSetup('Stopping...');
    if (this.ws) this.ws.close();
    this.apiIdsP = {};
    delete this.startP;
    delete this.ws;
    this.releases.forEach((release) => release());
    this.releases = [];
  }

  listenTo(target, eventName, callback) {
    debugEmitters('Adding listener for', eventName, 'from', target.constructor.name);
    if (target.addEventListener) target.addEventListener(eventName, callback);
    else target.on(eventName, callback);

    return () => {
      debugEmitters('Removing listener for', eventName, 'from', target.constructor.name);
      if (target.removeEventListener) target.removeEventListener(eventName, callback);
      else target.removeListener(eventName, callback);
    };
  }

  /**
   * Refreshes API IDs, populating the `Steem::apiIdsP` map.
   *
   * @param {String} [requestName] If provided, only this API will be refreshed
   * @param {Boolean} [force] If true the API will be forced to refresh, ignoring existing results
   */

  getApiIds(requestName, force) {
    if (!force && requestName && this.apiIdsP[requestName]) {
      return this.apiIdsP[requestName];
    }

    const apiNamesToRefresh = requestName ? [requestName] : Object.keys(this.apiIds);
    apiNamesToRefresh.forEach((name) => {
      debugApiIds('Syncing API ID', name);
      this.apiIdsP[name] = this.getApiByNameAsync(name).then((result) => {
        if (result != null) {
          this.apiIds[name] = result;
        } else {
          debugApiIds('Dropped null API ID for', name, result);
        }
      });
    });

    // If `requestName` was provided, only wait for this API ID
    if (requestName) {
      return this.apiIdsP[requestName];
    }

    // Otherwise wait for all of them
    return Promise.props(this.apiIdsP);
  }

  waitForSlot() {
    if (this.inFlight < 10) {
      debugEmitters('Less than 10 in-flight messages, moving on');
      return null;
    }

    debugEmitters('More than 10 in-flight messages, waiting');
    return Promise.delay(100).then(() => {
      if (this.inFlight < 10) {
        debugEmitters('Less than 10 in-flight messages, moving on');
        return null;
      }
      return this.waitForSlot();
    });
  }

  send(api, data, callback) {
    debugSetup('Steem::send', api, data);
    const id = data.id || this.id++;
    const startP = this.start();

    const apiIdsP = api === 'login_api' && data.method === 'get_api_by_name'
      ? Promise.fulfilled()
      : this.getApiIds(api);

    if (api === 'login_api' && data.method === 'get_api_by_name') {
      debugApiIds('Sending setup message');
    } else {
      debugApiIds('Going to wait for setup messages to resolve');
    }

    this.currentP = Promise.join(startP, apiIdsP, this.waitForSlot())
      .then(() => new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error(
            'The WS connection was closed while this request was pending'
          ));
          return;
        }

        const payload = JSON.stringify({
          id,
          method: 'call',
          params: [
            this.apiIds[api],
            data.method,
            data.params,
          ],
        });

        const release = this.listenTo(this, 'message', (message) => {
          // We're still seeing old messages
          if (message.id !== id) {
            debugProtocol('Different message was dropped', message);
            return;
          }

          this.inFlight -= 1;
          release();

          // Our message's response came back
          const errorCause = message.error;
          if (errorCause) {
            const err = new Error(
              // eslint-disable-next-line prefer-template
              (errorCause.message || 'Failed to complete operation') +
              ' (see err.payload for the full error payload)'
            );
            err.payload = message;
            reject(err);
            return;
          }

          if (api === 'login_api' && data.method === 'login') {
            debugApiIds(
              'network_broadcast_api API ID depends on the WS\' session. ' +
              'Triggering a refresh...'
            );
            this.getApiIds('network_broadcast_api', true);
          }

          debugProtocol('Resolved', api, data, '->', message);
          resolve(message.result);
        });

        debugWs('Sending message', payload);
        this.ws.send(payload);
      }))
      .nodeify(callback);

    this.inFlight += 1;

    return this.currentP;
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
  const methodName = method.method_name || camelCase(method.method);
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

Promise.promisifyAll(Steem.prototype);

// Export singleton instance
const steem = new Steem();
exports = module.exports = steem;
exports.Steem = Steem;
exports.Steem.DEFAULTS = DEFAULTS;
