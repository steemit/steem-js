'use strict';

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _steemauth = require('steemauth');

var _steemauth2 = _interopRequireDefault(_steemauth);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('steem:broadcast');

exports = module.exports = {
  send: function send(tx, privKeys, callback) {
    _api2.default.login('', '', function () {
      _api2.default.getDynamicGlobalProperties(function (err, result) {
        if (err) {
          callback(err);
          return;
        }

        var output = (0, _clone2.default)(result);
        var transaction = (0, _clone2.default)(tx);

        output.timestamp = output.timestamp || Date.now();

        var expiration = new Date(output.timestamp + 15 * 1000);

        transaction.expiration = expiration.toISOString().replace('Z', '');
        transaction.ref_block_num = output.head_block_number & 0xFFFF;
        transaction.ref_block_prefix = new Buffer(output.head_block_id, 'hex').readUInt32LE(4);

        debug('Signing transaction (transaction, transaction.operations)', transaction, transaction.operations);
        var signedTransaction = _steemauth2.default.signTransaction(transaction, privKeys);
        _api2.default.broadcastTransactionWithCallback(function () {}, signedTransaction, callback);
      });
    });
  },
  vote: function vote(wif, voter, author, permlink, weight, callback) {
    var tx = {
      extensions: [],
      operations: [['vote', {
        voter: voter,
        author: author,
        permlink: permlink,
        weight: weight
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  upvote: function upvote(wif, voter, author, permlink, weight, callback) {
    exports.vote(wif, voter, author, permlink, weight || 10000, callback);
  },
  downvote: function downvote(wif, voter, author, permlink, weight, callback) {
    exports.vote(wif, voter, author, permlink, -Math.abs(weight || 10000), callback);
  },
  comment: function comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, callback) {
    var tx = {
      extensions: [],
      operations: [['comment', {
        author: author,
        title: title,
        body: body,
        parent_author: parentAuthor,
        parent_permlink: parentPermlink,
        permlink: permlink || _formatter2.default.commentPermlink(parentAuthor, parentPermlink),
        json_metadata: JSON.stringify(jsonMetadata)
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  transfer: function transfer(wif, from, to, amount, memo, callback) {
    var tx = {
      extensions: [],
      operations: [['transfer', {
        from: from,
        to: to,
        amount: amount,
        memo: memo
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  transferToVesting: function transferToVesting(wif, from, to, amount, callback) {
    var tx = {
      extensions: [],
      operations: [['transfer_to_vesting', {
        from: from,
        to: to,
        amount: amount
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  withdrawVesting: function withdrawVesting(wif, account, vestingShares, callback) {
    var tx = {
      extensions: [],
      operations: [['withdraw_vesting', {
        account: account,
        vesting_shares: vestingShares
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  limitOrderCreate: function limitOrderCreate(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration, callback) {
    var tx = {
      extensions: [],
      operations: [['limit_order_create', {
        owner: owner,
        orderid: orderid,
        expiration: expiration,
        amount_to_sell: amountToSell,
        min_to_receive: minToReceive,
        fill_or_kill: fillOrKill
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  limitOrderCancel: function limitOrderCancel(wif, owner, orderid, callback) {
    var tx = {
      extensions: [],
      operations: [['limit_order_cancel', {
        owner: owner,
        orderid: orderid
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  feedPublish: function feedPublish(wif, publisher, exchangeRate, callback) {
    var tx = {
      extensions: [],
      operations: [['feed_publish', {
        publisher: publisher,
        exchange_rate: exchangeRate
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  convert: function convert(wif, owner, requestid, amount, callback) {
    var tx = {
      extensions: [],
      operations: [['convert', {
        owner: owner,
        requestid: requestid,
        amount: amount
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  accountCreate: function accountCreate(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, callback) {
    var tx = {
      extensions: [],
      operations: [['account_create', {
        fee: fee,
        creator: creator,
        owner: owner,
        active: active,
        posting: posting,
        new_account_name: newAccountName,
        memo_key: memoKey,
        json_metadata: JSON.stringify(jsonMetadata)
      }]]
    };
    exports.send(tx, { owner: wif }, callback);
  },
  accountUpdate: function accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, callback) {
    var tx = {
      extensions: [],
      operations: [['account_update', {
        account: account,
        owner: owner,
        active: active,
        posting: posting,
        memo_key: memoKey,
        json_metadata: JSON.stringify(jsonMetadata)
      }]]
    };
    exports.send(tx, { owner: wif }, callback);
  },
  witnessUpdate: function witnessUpdate(wif, owner, url, blockSigningKey, props, fee, callback) {
    var tx = {
      extensions: [],
      operations: [['witness_update', {
        owner: owner,
        url: url,
        props: props,
        fee: fee,
        block_signing_key: blockSigningKey
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  accountWitnessVote: function accountWitnessVote(wif, account, witness, approve, callback) {
    var tx = {
      extensions: [],
      operations: [['account_witness_vote', {
        account: account,
        witness: witness,
        approve: approve
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  accountWitnessProxy: function accountWitnessProxy(wif, account, proxy, callback) {
    var tx = {
      extensions: [],
      operations: [['account_witness_proxy', {
        account: account,
        proxy: proxy
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  pow: function pow(wif, worker, input, signature, work, callback) {
    var tx = {
      extensions: [],
      operations: [['pow', {
        worker: worker,
        input: input,
        signature: signature,
        work: work
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  custom: function custom(wif, requiredAuths, id, data, callback) {
    var tx = {
      extensions: [],
      operations: [['custom', {
        id: id,
        data: data,
        required_auths: requiredAuths
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  reportOverProduction: function reportOverProduction(wif, reporter, firstBlock, secondBlock, callback) {
    var tx = {
      extensions: [],
      operations: [['report_over_production', {
        reporter: reporter,
        first_block: firstBlock,
        second_block: secondBlock
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  deleteComment: function deleteComment(wif, author, permlink, callback) {
    var tx = {
      extensions: [],
      operations: [['delete_comment', {
        author: author,
        permlink: permlink
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  customJson: function customJson(wif, requiredAuths, requiredPostingAuths, id, json, callback) {
    var tx = {
      extensions: [],
      operations: [['custom_json', {
        id: id,
        json: json,
        required_auths: requiredAuths,
        required_posting_auths: requiredPostingAuths
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  commentOptions: function commentOptions(wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes, allowCurationRewards, extensions, callback) {
    var tx = {
      extensions: [],
      operations: [['comment_options', {
        author: author,
        extensions: extensions,
        permlink: permlink,
        max_accepted_payout: maxAcceptedPayout,
        percent_steem_dollars: percentSteemDollars,
        allow_votes: allowVotes,
        allow_curation_rewards: allowCurationRewards
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  setWithdrawVestingRoute: function setWithdrawVestingRoute(wif, fromAccount, toAccount, percent, autoVest, callback) {
    var tx = {
      extensions: [],
      operations: [['set_withdraw_vesting_route', {
        from_account: fromAccount,
        to_account: toAccount,
        percent: percent,
        auto_vest: autoVest
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  limitOrderCreate2: function limitOrderCreate2(wif, owner, orderid, amountToSell, exchangeRate, fillOrKill, expiration, callback) {
    var tx = {
      extensions: [],
      operations: [['limit_order_create2', {
        expiration: expiration,
        owner: owner,
        orderid: orderid,
        amount_to_sell: amountToSell,
        exchange_rate: exchangeRate,
        fill_or_kill: fillOrKill
      }]]
    };
    exports.send(tx, { active: wif }, callback);
  },
  challengeAuthority: function challengeAuthority(wif, challenger, challenged, requireOwner, callback) {
    var tx = {
      extensions: [],
      operations: [['challenge_authority', {
        challenger: challenger,
        challenged: challenged,
        require_owner: requireOwner
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  proveAuthority: function proveAuthority(wif, challenged, requireOwner, callback) {
    var tx = {
      extensions: [],
      operations: [['prove_authority', {
        challenged: challenged,
        require_owner: requireOwner
      }]]
    };
    exports.send(tx, { posting: wif }, callback);
  },
  requestAccountRecovery: function requestAccountRecovery(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions, callback) {
    var tx = {
      extensions: [],
      operations: [['request_account_recovery', {
        extensions: extensions,
        recovery_account: recoveryAccount,
        account_to_recover: accountToRecover,
        new_owner_authority: newOwnerAuthority
      }]]
    };
    exports.send(tx, { owner: wif }, callback);
  },
  recoverAccount: function recoverAccount(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions, callback) {
    var tx = {
      extensions: [],
      operations: [['recover_account', {
        extensions: extensions,
        account_to_recover: accountToRecover,
        new_owner_authority: newOwnerAuthority,
        recent_owner_authority: recentOwnerAuthority
      }]]
    };
    exports.send(tx, { owner: wif }, callback);
  },
  changeRecoveryAccount: function changeRecoveryAccount(wif, accountToRecover, newRecoveryAccount, extensions, callback) {
    var tx = {
      extensions: [],
      operations: [['change_recovery_account', {
        extensions: extensions,
        account_to_recover: accountToRecover,
        new_recovery_account: newRecoveryAccount
      }]]
    };
    exports.send(tx, { owner: wif }, callback);
  },
  escrowTransfer: function escrowTransfer(wif, from, to, amount, memo, escrowId, agent, fee, jsonMeta, expiration, callback) {
    var tx = {
      extensions: [],
      operations: [['escrow_transfer', {
        from: from,
        to: to,
        amount: amount,
        memo: memo,
        escrow_id: escrowId,
        agent: agent,
        fee: fee,
        json_meta: jsonMeta,
        expiration: expiration
      }]]
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },
  escrowDispute: function escrowDispute(wif, from, to, escrowId, who, callback) {
    var tx = {
      extensions: [],
      operations: [['escrow_dispute', {
        from: from,
        to: to,
        escrow_id: escrowId,
        who: who
      }]]
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },
  escrowRelease: function escrowRelease(wif, from, to, escrowId, who, amount, callback) {
    var tx = {
      extensions: [],
      operations: [['escrow_release', {
        from: from,
        to: to,
        escrow_id: escrowId,
        who: who,
        amount: amount
      }]]
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },
  fillConvertRequest: function fillConvertRequest(wif, owner, requestid, amountIn, amountOut, callback) {
    var tx = {
      extensions: [],
      operations: [['fill_convert_request', {
        owner: owner,
        requestid: requestid,
        amount_in: amountIn,
        amount_out: amountOut
      }]]
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },
  commentReward: function commentReward(wif, author, permlink, sbdPayout, vestingPayout, callback) {
    var tx = {
      extensions: [],
      operations: [['comment_reward', {
        author: author,
        permlink: permlink,
        sbd_payout: sbdPayout,
        vesting_payout: vestingPayout
      }]]
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },
  curateReward: function curateReward(wif, curator, reward, commentAuthor, commentPermlink, callback) {
    var tx = {
      extensions: [],
      operations: [['curate_reward', {
        curator: curator,
        reward: reward,
        comment_author: commentAuthor,
        comment_permlink: commentPermlink
      }]]
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },
  liquidityReward: function liquidityReward(wif, owner, payout, callback) {
    var tx = {
      extensions: [],
      operations: [['liquidity_reward', {
        owner: owner,
        payout: payout
      }]]
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },
  interest: function interest(wif, owner, _interest, callback) {
    var tx = {
      extensions: [],
      operations: [['interest', {
        owner: owner,
        interest: _interest
      }]]
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },
  fillVestingWithdraw: function fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, callback) {
    var tx = {
      extensions: [],
      operations: [['fill_vesting_withdraw', {
        from_account: fromAccount,
        to_account: toAccount,
        withdrawn: withdrawn,
        deposited: deposited
      }]]
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },
  fillOrder: function fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, callback) {
    var tx = {
      extensions: [],
      operations: [['fill_order', {
        current_owner: currentOwner,
        current_orderid: currentOrderid,
        current_pays: currentPays,
        open_owner: openOwner,
        open_orderid: openOrderid,
        open_pays: openPays
      }]]
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },
  commentPayout: function commentPayout(wif, author, permlink, payout, callback) {
    var tx = {
      extensions: [],
      operations: [['comment_payout', {
        author: author,
        permlink: permlink,
        payout: payout
      }]]
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  }
};