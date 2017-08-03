import api from '../api';

exports = module.exports = steemBroadcast => {
  steemBroadcast.addAccountAuth = ({ signingKey, username, authorizedUsername, role = 'posting', weight }, cb) => {
    api.getAccounts([username], (err, [userAccount]) => {
      if (err) { return cb(new Error(err), null); }
      if (!userAccount) { return cb(new Error('Invalid account name'), null); }

      const updatedAuthority = userAccount[role];

      /** Release callback if the account already exist in the account_auths array */
      const authorizedAccounts = updatedAuthority.account_auths.map(auth => auth[0]);
      const hasAuthority = authorizedAccounts.indexOf(authorizedUsername) !== -1;
      if (hasAuthority) {
        return cb(null, null);
      }

      /** Use weight_thresold as default weight */
      weight = weight || userAccount[role].weight_threshold;
      updatedAuthority.account_auths.push([authorizedUsername, weight]);
      const owner = role === 'owner' ? updatedAuthority : undefined;
      const active = role === 'active' ? updatedAuthority : undefined;
      const posting = role === 'posting' ? updatedAuthority : undefined;

      /** Add authority on user account */
      steemBroadcast.accountUpdate(
        signingKey,
        userAccount.name,
        owner,
        active,
        posting,
        userAccount.memo_key,
        userAccount.json_metadata,
        cb
      );
    });
  };

  steemBroadcast.removeAccountAuth = ({ signingKey, username, authorizedUsername, role = 'posting' }, cb) => {
    api.getAccounts([username], (err, [userAccount]) => {
      if (err) { return cb(new Error(err), null); }
      if (!userAccount) { return cb(new Error('Invalid account name'), null); }

      const updatedAuthority = userAccount[role];
      const totalAuthorizedUser = updatedAuthority.account_auths.length;
      for (let i = 0; i < totalAuthorizedUser; i++) {
        const user = updatedAuthority.account_auths[i];
        if (user[0] === authorizedUsername) {
          updatedAuthority.account_auths.splice(i, 1);
          break;
        }
      }

      /** Release callback if the account does not exist in the account_auths array */
      if (totalAuthorizedUser === updatedAuthority.account_auths.length) {
        return cb(null, null);
      }

      const owner = role === 'owner' ? updatedAuthority : undefined;
      const active = role === 'active' ? updatedAuthority : undefined;
      const posting = role === 'posting' ? updatedAuthority : undefined;

      steemBroadcast.accountUpdate(
        signingKey,
        userAccount.name,
        owner,
        active,
        posting,
        userAccount.memo_key,
        userAccount.json_metadata,
        cb
      );
    });
  };

  steemBroadcast.addKeyAuth = ({ signingKey, username, authorizedKey, role = 'posting', weight }, cb) => {
    api.getAccounts([username], (err, [userAccount]) => {
      if (err) { return cb(new Error(err), null); }
      if (!userAccount) { return cb(new Error('Invalid account name'), null); }

      const updatedAuthority = userAccount[role];

      /** Release callback if the key already exist in the key_auths array */
      const authorizedKeys = updatedAuthority.key_auths.map(auth => auth[0]);
      const hasAuthority = authorizedKeys.indexOf(authorizedKey) !== -1;
      if (hasAuthority) {
        return cb(null, null);
      }

      /** Use weight_thresold as default weight */
      weight = weight || userAccount[role].weight_threshold;
      updatedAuthority.key_auths.push([authorizedKey, weight]);
      const owner = role === 'owner' ? updatedAuthority : undefined;
      const active = role === 'active' ? updatedAuthority : undefined;
      const posting = role === 'posting' ? updatedAuthority : undefined;

      /** Add authority on user account */
      steemBroadcast.accountUpdate(
        signingKey,
        userAccount.name,
        owner,
        active,
        posting,
        userAccount.memo_key,
        userAccount.json_metadata,
        cb
      );
    });
  };

  steemBroadcast.removeKeyAuth = ({ signingKey, username, authorizedKey, role = 'posting' }, cb) => {
    api.getAccounts([username], (err, [userAccount]) => {
      if (err) { return cb(new Error(err), null); }
      if (!userAccount) { return cb(new Error('Invalid account name'), null); }

      const updatedAuthority = userAccount[role];
      const totalAuthorizedKey = updatedAuthority.key_auths.length;
      for (let i = 0; i < totalAuthorizedKey; i++) {
        const user = updatedAuthority.key_auths[i];
        if (user[0] === authorizedKey) {
          updatedAuthority.key_auths.splice(i, 1);
          break;
        }
      }

      /** Release callback if the key does not exist in the key_auths array */
      if (totalAuthorizedKey === updatedAuthority.key_auths.length) {
        return cb(null, null);
      }

      const owner = role === 'owner' ? updatedAuthority : undefined;
      const active = role === 'active' ? updatedAuthority : undefined;
      const posting = role === 'posting' ? updatedAuthority : undefined;

      steemBroadcast.accountUpdate(
        signingKey,
        userAccount.name,
        owner,
        active,
        posting,
        userAccount.memo_key,
        userAccount.json_metadata,
        cb
      );
    });
  };
};
