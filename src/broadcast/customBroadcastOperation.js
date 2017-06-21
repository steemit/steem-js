import api from "../api";

const weight = 1;
exports = module.exports = steemBroadcast => {
  steemBroadcast.addAccountAuth = async (
    activeWif,
    username,
    authorizedUsername,
    role = "posting",
    cb
  ) => {
    const [userAccount] = await api.getAccountsAsync([username]);

    const updatedAuthority = userAccount[role];
    const authorizedAccounts = updatedAuthority.account_auths.map(
      auth => auth[0]
    );
    const hasAuthority = authorizedAccounts.indexOf(authorizedUsername) !== -1;

    if (hasAuthority) {
      const error = `${authorizedUsername} is already authorized`;
      cb({ error });
    } else {
      updatedAuthority.account_auths.push([authorizedUsername, weight]);
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
    }
  };
};
