


const options = {
    // user: "username",
    // pass: "password",
    url: "ws://localhost:8090"
};
const {Client} = require("../src/index");
var Api = Client(options, true);

Api.initPromise.then(response => {
    console.log("response:", response);

    Promise.all([
        Api.database_api().exec("get_accounts", [["ned"]]),
        Api.database_api().exec("get_account_history", ["ned", -1, 15])
    ])
    .then(response => {
        let [account, history] = response;
        console.log("got account:", account);
        console.log("got history:", history);

    }).catch(err => {
        console.log("err", err.split('"api\\":'));
        // err.split('"api\\":');
    });
});
