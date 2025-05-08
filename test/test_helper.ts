import { expect, beforeAll } from 'vitest';
import { setConfig } from '../src/config';

var assert = require('assert');

module.exports = {
            
    error(message_substring, f){
        var fail = false;
        try {
            f();
            fail = true;
        } catch (e) {
            if (e.toString().indexOf(message_substring) === -1) {
                throw new Error("expecting " + message_substring);
            }
        }
        if (fail) {
            throw new Error("expecting " + message_substring);
        }
    }
}

beforeAll(() => {
  setConfig({
    address_prefix: 'STM',
    chain_id: '0000000000000000000000000000000000000000000000000000000000000000',
    node: 'https://api.steemit.com',
    nodes: ['https://api.steemit.com'],
    websocket: 'wss://api.steemit.com'
  });
});

export function error(message_substring: string, f: () => void) {
    var fail = false;
    try {
        f();
        fail = true;
    } catch (e) {
        if (e.toString().indexOf(message_substring) === -1) {
            throw new Error('expecting ' + message_substring);
        }
    }
    if (fail) {
        throw new Error('expecting ' + message_substring);
    }
}