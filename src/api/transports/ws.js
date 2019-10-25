import Promise from 'bluebird';
import isNode from 'detect-node';
import newDebug from 'debug';

import Transport from './base';

let WebSocket;
if (isNode) {
  WebSocket = require('ws'); // eslint-disable-line global-require
} else if (typeof window !== 'undefined') {
  WebSocket = window.WebSocket;
} else {
  throw new Error("Couldn't decide on a `WebSocket` class");
}

const debug = newDebug('steem:ws');

export default class WsTransport extends Transport {
  constructor(options = {}) {
    super(Object.assign({id: 0}, options));

    this._requests = new Map();
    this.inFlight = 0;
    this.isOpen = false;
  }

  start() {

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.options.websocket);
      this.ws.onerror = (err) => {
        this.startPromise = null;
        reject(err);
      };
      this.ws.onopen = () => {
        this.isOpen = true;
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        resolve();
      };
    });
    return this.startPromise;
  }

  stop() {
    debug('Stopping...');

    this.startPromise = null;
    this.isOpen = false;
    this._requests.clear();

    if (this.ws) {
      this.ws.onerror = this.ws.onmessage = this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  send(api, data, callback) {
    debug('Steem::send', api, data);
    return this.start().then(() => {
      const deferral = {};
      new Promise((resolve, reject) => {
        deferral.resolve = (val) => {
          resolve(val);
          callback(null, val);
        };
        deferral.reject = (val) => {
          reject(val);
          callback(val);
        }
      });

      if (this.options.useAppbaseApi) {
        api = 'condenser_api';
      }

      const _request = {
        deferral,
        startedAt: Date.now(),
        message: {
          id: data.id || this.id++,
          method: 'call',
          jsonrpc: '2.0',
          params: [api, data.method, data.params]
        }
      };
      this.inFlight++;
      this._requests.set(_request.message.id, _request);
      this.ws.send(JSON.stringify(_request.message));
      return deferral;
    });
  }

  onError(error) {
    for (let _request of this._requests) {
      _request.deferral.reject(error);
    }
    this.stop();
  }

  onClose() {
    const error = new Error('Connection was closed');
    for (let _request of this._requests) {
      _request.deferral.reject(error);
    }
    this._requests.clear();
  }

  onMessage(websocketMessage) {
    const message = JSON.parse(websocketMessage.data);
    debug('-- Steem.onMessage -->', message.id);
    if (!this._requests.has(message.id)) {
      throw new Error(`Panic: no request in queue for message id ${message.id}`);
    }
    const _request = this._requests.get(message.id);
    this._requests.delete(message.id);

    const errorCause = message.error;
    if (errorCause) {
      const err = new Error(
        // eslint-disable-next-line prefer-template
        (errorCause.message || 'Failed to complete operation') +
          ' (see err.payload for the full error payload)'
      );
      err.payload = message;
      _request.deferral.reject(err);
    } else {
      this.emit('track-performance', _request.message.method, Date.now() - _request.startedAt);
      _request.deferral.resolve(message.result);
    }

  }
}
