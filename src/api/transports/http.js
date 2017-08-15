import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'bluebird';
import newDebug from 'debug';
import Transport from './base';

const { fetch } = fetchPonyfill(Promise);
const debug = newDebug('steem:http');

export default class HttpTransport extends Transport {
  send(api, data, callback) {
    debug('Steem::send', api, data);
    const id = data.id || this.id++;
    const payload = {
      id,
      jsonrpc: '2.0',
      method: 'call',
      params: [api, data.method, data.params],
    };
    fetch(this.options.uri, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then(res => {
        debug('Steem::receive', api, data);
        return res.json();
      })
      .then(json => {
        const err = json.error || '';
        const result = json.result || '';
        callback(err, result);
      })
      .catch(err => {
        callback(err, '');
      });
  }
}
