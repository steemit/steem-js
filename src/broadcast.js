import clone from 'lodash/clone';
import newDebug from 'debug';
import steemAuth from 'steemauth';

import formatter from './formatter';
import steemApi from './api';

const debug = newDebug('steem:broadcast');

exports = module.exports = {
  send(tx, privKeys, callback) {
    steemApi.login('', '', () => {
      steemApi.getDynamicGlobalProperties((err, result) => {
        if (err) {
          callback(err);
          return;
        }

        const output = clone(result);
        const transaction = clone(tx);

        output.timestamp = output.timestamp || Date.now();

        const expiration = new Date(output.timestamp + 15 * 1000);

        transaction.expiration = expiration.toISOString().replace('Z', '');
        transaction.ref_block_num = output.head_block_number & 0xFFFF;
        transaction.ref_block_prefix = new Buffer(output.head_block_id, 'hex').readUInt32LE(4);

        debug(
          'Signing transaction (transaction, transaction.operations)',
          transaction, transaction.operations
        );
        const signedTransaction = steemAuth.signTransaction(transaction, privKeys);
        steemApi.broadcastTransactionWithCallback(
          () => {},
          signedTransaction,
          callback
        );
      });
    });
  },

  vote(wif, voter, author, permlink, weight, callback) {
    const tx = {
      extensions: [],
      operations: [['vote', {
        voter,
        author,
        permlink,
        weight,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  upvote(wif, voter, author, permlink, weight, callback) {
    exports.vote(wif, voter, author, permlink, weight || 10000, callback);
  },

  downvote(wif, voter, author, permlink, weight, callback) {
    exports.vote(wif, voter, author, permlink, -Math.abs(weight || 10000), callback);
  },

  comment(
    wif, parentAuthor, parentPermlink, author, permlink, title, body,
    jsonMetadata, callback
  ) {
    const tx = {
      extensions: [],
      operations: [['comment', {
        author,
        title,
        body,
        parent_author: parentAuthor,
        parent_permlink: parentPermlink,
        permlink: permlink || formatter.commentPermlink(parentAuthor, parentPermlink),
        json_metadata: JSON.stringify(jsonMetadata),
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  transfer(wif, from, to, amount, memo, callback) {
    const tx = {
      extensions: [],
      operations: [['transfer', {
        from,
        to,
        amount,
        memo,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  transferToVesting(wif, from, to, amount, callback) {
    const tx = {
      extensions: [],
      operations: [['transfer_to_vesting', {
        from,
        to,
        amount,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  withdrawVesting(wif, account, vestingShares, callback) {
    const tx = {
      extensions: [],
      operations: [['withdraw_vesting', {
        account,
        vesting_shares: vestingShares,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  limitOrderCreate(
    wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration,
    callback
  ) {
    const tx = {
      extensions: [],
      operations: [['limit_order_create', {
        owner,
        orderid,
        expiration,
        amount_to_sell: amountToSell,
        min_to_receive: minToReceive,
        fill_or_kill: fillOrKill,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  limitOrderCancel(wif, owner, orderid, callback) {
    const tx = {
      extensions: [],
      operations: [['limit_order_cancel', {
        owner,
        orderid,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  feedPublish(wif, publisher, exchangeRate, callback) {
    const tx = {
      extensions: [],
      operations: [['feed_publish', {
        publisher: publisher,
        exchange_rate: exchangeRate,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  convert(wif, owner, requestid, amount, callback) {
    const tx = {
      extensions: [],
      operations: [['convert', {
        owner,
        requestid,
        amount,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  accountCreate(
    wif, fee, creator, newAccountName, owner, active, posting, memoKey,
    jsonMetadata, callback
  ) {
    const tx = {
      extensions: [],
      operations: [['account_create', {
        fee,
        creator,
        owner,
        active,
        posting,
        new_account_name: newAccountName,
        memo_key: memoKey,
        json_metadata: JSON.stringify(jsonMetadata),
      }]],
    };
    exports.send(tx, { owner: wif }, callback);
  },

  accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, callback) {
    const tx = {
      extensions: [],
      operations: [['account_update', {
        account,
        owner,
        active,
        posting,
        memo_key: memoKey,
        json_metadata: JSON.stringify(jsonMetadata),
      }]],
    };
    exports.send(tx, { owner: wif }, callback);
  },

  witnessUpdate(wif, owner, url, blockSigningKey, props, fee, callback) {
    const tx = {
      extensions: [],
      operations:[['witness_update', {
        owner,
        url,
        props,
        fee,
        block_signing_key: blockSigningKey,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  accountWitnessVote(wif, account, witness, approve, callback) {
    const tx = {
      extensions: [],
      operations:[['account_witness_vote', {
        account,
        witness,
        approve,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  accountWitnessProxy(wif, account, proxy, callback) {
    const tx = {
      extensions: [],
      operations:[['account_witness_proxy', {
        account,
        proxy,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  pow(wif, worker, input, signature, work, callback) {
    const tx = {
      extensions: [],
      operations:[['pow', {
        worker,
        input,
        signature,
        work,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  custom(wif, requiredAuths, id, data, callback) {
    const tx = {
      extensions: [],
      operations: [['custom', {
        id,
        data,
        required_auths: requiredAuths,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  reportOverProduction(wif, reporter, firstBlock, secondBlock, callback) {
    const tx = {
      extensions: [],
      operations: [['report_over_production', {
        reporter,
        first_block: firstBlock,
        second_block: secondBlock,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  deleteComment(wif, author, permlink, callback) {
    const tx = {
      extensions: [],
      operations: [['delete_comment', {
        author,
        permlink,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  customJson(wif, requiredAuths, requiredPostingAuths, id, json, callback) {
    const tx = {
      extensions: [],
      operations: [['custom_json', {
        id,
        json,
        required_auths: requiredAuths,
        required_posting_auths: requiredPostingAuths,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  commentOptions(
    wif, author, permlink, maxAcceptedPayout, percentSteemDollars, allowVotes,
    allowCurationRewards, extensions, callback
  ) {
    const tx = {
      extensions: [],
      operations: [['comment_options', {
        author,
        extensions,
        permlink,
        max_accepted_payout: maxAcceptedPayout,
        percent_steem_dollars: percentSteemDollars,
        allow_votes: allowVotes,
        allow_curation_rewards: allowCurationRewards,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  setWithdrawVestingRoute(wif, fromAccount, toAccount, percent, autoVest, callback) {
    const tx = {
      extensions: [],
      operations: [['set_withdraw_vesting_route', {
        from_account: fromAccount,
        to_account: toAccount,
        percent,
        auto_vest: autoVest,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  limitOrderCreate2(
    wif, owner, orderid, amountToSell, exchangeRate, fillOrKill, expiration,
    callback
  ) {
    const tx = {
      extensions: [],
      operations: [['limit_order_create2', {
        expiration,
        owner,
        orderid,
        amount_to_sell: amountToSell,
        exchange_rate: exchangeRate,
        fill_or_kill: fillOrKill,
      }]],
    };
    exports.send(tx, { active: wif }, callback);
  },

  challengeAuthority(wif, challenger, challenged, requireOwner, callback) {
    var tx = {
      extensions: [],
      operations: [['challenge_authority', {
        challenger,
        challenged,
        require_owner: requireOwner,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  proveAuthority(wif, challenged, requireOwner, callback) {
    const tx = {
      extensions: [],
      operations: [['prove_authority', {
        challenged,
        require_owner: requireOwner,
      }]],
    };
    exports.send(tx, { posting: wif }, callback);
  },

  requestAccountRecovery(
    wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions,
    callback
  ) {
    const tx = {
      extensions: [],
      operations: [['request_account_recovery', {
        extensions,
        recovery_account: recoveryAccount,
        account_to_recover: accountToRecover,
        new_owner_authority: newOwnerAuthority,
      }]],
    };
    exports.send(tx, { owner: wif }, callback);
  },

  recoverAccount(
    wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions,
    callback
  ) {
    const tx = {
      extensions: [],
      operations: [['recover_account', {
        extensions,
        account_to_recover: accountToRecover,
        new_owner_authority: newOwnerAuthority,
        recent_owner_authority: recentOwnerAuthority,
      }]],
    };
    exports.send(tx, { owner: wif }, callback);
  },

  changeRecoveryAccount(wif, accountToRecover, newRecoveryAccount, extensions, callback) {
    const tx = {
      extensions: [],
      operations: [['change_recovery_account', {
        extensions,
        account_to_recover: accountToRecover,
        new_recovery_account: newRecoveryAccount,
      }]],
    };
    exports.send(tx, { owner: wif }, callback);
  },

  escrowTransfer(
    wif, from, to, amount, memo, escrowId, agent, fee, jsonMeta, expiration,
    callback
  ) {
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
        expiration: expiration,
      }]],
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },

  escrowDispute(wif, from, to, escrowId, who, callback) {
    var tx = {
      extensions: [],
      operations: [['escrow_dispute', {
        from: from,
        to: to,
        escrow_id: escrowId,
        who: who,
      }]],
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },

  escrowRelease(wif, from, to, escrowId, who, amount, callback) {
    var tx = {
      extensions: [],
      operations: [['escrow_release', {
        from: from,
        to: to,
        escrow_id: escrowId,
        who: who,
        amount: amount,
      }]],
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },

  fillConvertRequest(wif, owner, requestid, amountIn, amountOut, callback) {
    var tx = {
      extensions: [],
      operations: [['fill_convert_request', {
        owner: owner,
        requestid: requestid,
        amount_in: amountIn,
        amount_out: amountOut,
      }]],
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },

  commentReward(wif, author, permlink, sbdPayout, vestingPayout, callback) {
    var tx = {
      extensions: [],
      operations: [['comment_reward', {
        author: author,
        permlink: permlink,
        sbd_payout: sbdPayout,
        vesting_payout: vestingPayout,
      }]],
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },

  curateReward(wif, curator, reward, commentAuthor, commentPermlink, callback) {
    var tx = {
      extensions: [],
      operations: [['curate_reward', {
        curator: curator,
        reward: reward,
        comment_author: commentAuthor,
        comment_permlink: commentPermlink,
      }]],
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },

  liquidityReward(wif, owner, payout, callback) {
    var tx = {
      extensions: [],
      operations: [['liquidity_reward', {
        owner: owner,
        payout: payout,
      }]],
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },

  interest(wif, owner, interest, callback) {
    var tx = {
      extensions: [],
      operations: [['interest', {
        owner: owner,
        interest: interest,
      }]],
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },

  fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, callback) {
    var tx = {
      extensions: [],
      operations: [['fill_vesting_withdraw', {
        from_account: fromAccount,
        to_account: toAccount,
        withdrawn: withdrawn,
        deposited: deposited,
      }]],
    };
    exports.send(tx, { active: wif }, function (err, result) {
      callback(err, result);
    });
  },

  fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, callback) {
    var tx = {
      extensions: [],
      operations: [['fill_order', {
        current_owner: currentOwner,
        current_orderid: currentOrderid,
        current_pays: currentPays,
        open_owner: openOwner,
        open_orderid: openOrderid,
        open_pays: openPays,
      }]],
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },

  commentPayout(wif, author, permlink, payout, callback) {
    var tx = {
      extensions: [],
      operations: [['comment_payout', {
        author: author,
        permlink: permlink,
        payout: payout,
      }]],
    };
    exports.send(tx, { posting: wif }, function (err, result) {
      callback(err, result);
    });
  },
};
