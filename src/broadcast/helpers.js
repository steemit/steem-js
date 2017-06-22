import api from "../api";

const defaultWeight = 1;

exports = module.exports = steemBroadcast => {
  steemBroadcast.addAccountAuth = (
    activeWif,
    username,
    authorizedUsername,
    role = "posting",
    cb
  ) => {
    api.getAccountsAsync([username]).then(([userAccount]) => {
      const updatedAuthority = userAccount[role];
      const authorizedAccounts = updatedAuthority.account_auths.map(
        auth => auth[0]
      );
      const hasAuthority =
        authorizedAccounts.indexOf(authorizedUsername) !== -1;

      if (hasAuthority) {
        // user does already exist in authorized list
        return cb(null, null);
      }
      updatedAuthority.account_auths.push([authorizedUsername, defaultWeight]);
      const owner = role === "owner" ? updatedAuthority : undefined;
      const active = role === "active" ? updatedAuthority : undefined;
      const posting = role === "posting" ? updatedAuthority : undefined;
      /** Add authority on user account */
      steemBroadcast.accountUpdate(
        activeWif,
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

  steemBroadcast.removeAccountAuth = (
    activeWif,
    username,
    authorizedUsername,
    role = "posting",
    cb
  ) => {
    api.getAccountsAsync([username]).then(([userAccount]) => {
      const updatedAuthority = userAccount[role];
      const totalAuthorizedUser = updatedAuthority.account_auths.length;
      for (let i = 0; i < totalAuthorizedUser; i++) {
        const user = updatedAuthority.account_auths[i];
        if (user[0] === authorizedUsername) {
          updatedAuthority.account_auths.splice(i, 1);
          break;
        }
      }
      // user does not exist in authorized list
      if (totalAuthorizedUser === updatedAuthority.account_auths.length) {
        return cb(null, null);
      }

      const owner = role === "owner" ? updatedAuthority : undefined;
      const active = role === "active" ? updatedAuthority : undefined;
      const posting = role === "posting" ? updatedAuthority : undefined;

      steemBroadcast.accountUpdate(
        activeWif,
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
