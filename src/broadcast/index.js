import Promise from 'bluebird';
import newDebug from 'debug';
import noop from 'lodash/noop';
import steemAuth from 'steemauth';

import formatter from '../formatter';
import operations from './operations.json';
import steemApi from '../api';
import { camelCase } from '../util';

const debug = newDebug('steem:broadcast');

const steemBroadcast = {};

// Base transaction logic -----------------------------------------------------

/**
 * Sign and broadcast transactions on the steem network
 */

steemBroadcast.send = function steemBroadcast$send(tx, privKeys, callback) {
  const resultP = steemBroadcast._prepareTransaction(tx)
    .then((transaction) => {
      debug(
        'Signing transaction (transaction, transaction.operations)',
        transaction, transaction.operations
      );
      return Promise.join(
        transaction,
        steemAuth.signTransaction(transaction, privKeys)
      );
    })
    .spread((transaction, signedTransaction) => {
      debug(
        'Broadcasting transaction (transaction, transaction.operations)',
        transaction, transaction.operations
      );
      return steemApi.broadcastTransactionWithCallbackAsync(
        () => {},
        signedTransaction
      ).then(() => signedTransaction);
    });

  resultP.nodeify(callback || noop);
};

steemBroadcast._prepareTransaction = function steemBroadcast$_prepareTransaction(tx) {
  // Login and get global properties
  const loginP = steemApi.loginAsync('', '');
  const propertiesP = loginP.then(() => {
    return steemApi.getDynamicGlobalPropertiesAsync()
  });
  return propertiesP
    .then((properties) => {
      // Set defaults on the transaction
      return Object.assign({
        ref_block_num: properties.head_block_number & 0xFFFF,
        ref_block_prefix: new Buffer(properties.head_block_id, 'hex').readUInt32LE(4),
        expiration: new Date(
          (properties.timestamp || Date.now()) +
            15 * 1000
        ),
      }, tx);
    });
};

// Generated wrapper ----------------------------------------------------------

// Generate operations from operations.json
operations.forEach((operation) => {
  const operationName = camelCase(operation.operation);
  const operationParams = operation.params || [];

  const useCommentPermlink =
    operationParams.indexOf('parent_permlink') !== -1 &&
    operationParams.indexOf('parent_permlink') !== -1;

  steemBroadcast[`${operationName}With`] =
    function steemBroadcast$specializedSendWith(wif, options, callback) {
      debug(`Sending operation "${operationName}" with`, {options, callback});
      const keys = {};
      if (operation.roles && operation.roles.length) {
        keys[operation.roles[0]] = wif; // TODO - Automatically pick a role? Send all?
      }
      return steemBroadcast.send({
        extensions: [],
        operations: [[operation.operation, Object.assign(
          {},
          options,
          options.json_metadata != null ? {
            json_metadata: JSON.stringify(options.json_metadata),
          } : {},
          useCommentPermlink && options.permlink == null ? {
            permlink: formatter.commentPermlink(options.parent_author, options.parent_permlink),
          } : {}
        )]],
      }, keys, callback);
    };

  steemBroadcast[operationName] =
    function steemBroadcast$specializedSend(wif, ...args) {
      debug(`Parsing operation "${operationName}" with`, {args});
      const options = operationParams.reduce((memo, param, i) => {
        memo[param] = args[i]; // eslint-disable-line no-param-reassign
        return memo;
      }, {});
      const callback = args[operationParams.length];
      return steemBroadcast[`${operationName}With`](wif, options, callback);
    };
});

Promise.promisifyAll(steemBroadcast);

exports = module.exports = steemBroadcast;
