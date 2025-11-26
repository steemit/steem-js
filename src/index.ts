import { Api, setOptions as setApiOptions } from './api';
import { setOptions as setConfigOptions, getConfig } from './config';
import * as auth from './auth';
import * as broadcast from './broadcast';
import * as formatter from './formatter';
import * as memo from './memo';
import * as operations from './operations';
import * as serializer from './serializer';
import * as utils from './utils';

// Create the API instance
const api = new Api();

// Create the main steem object with all modules
const steem = {
  api,
  auth,
  broadcast,
  formatter,
  memo,
  operations,
  serializer,
  utils,
  config: {
    set: (options: any) => {
      setApiOptions(options);
      setConfigOptions(options);
    },
    get: (key: string) => getConfig().get(key),
    getBoolean: (key: string) => getConfig().getBoolean(key),
    getNumber: (key: string) => getConfig().getNumber(key),
    getString: (key: string) => getConfig().getString(key),
    all: () => getConfig().all()
  }
};

// For the broadcast module to have access to the api
if (typeof broadcast.setApi === 'function') {
  broadcast.setApi(api);
}

// Export everything as named exports
export { steem };
export * from './crypto'; 