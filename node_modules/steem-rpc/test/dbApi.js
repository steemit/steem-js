var expect = require("expect.js");

const options = {
    // user: "username",
    // pass: "password",
    url: "ws://127.0.0.1:8090",
    apis: ["database_api", "market_history_api"],
    debug: true
};

var {Client} = require("../src/index");
var Api = Client.get(options, true);

describe("Db API", function ()  {
    this.timeout(10000);
    // Connect once for all tests // ws://localhost:8090
    before(function() {
        return Api.initPromise;
    });

    it("Get dynamic global object", function(done) {
        return Api.database_api().exec("get_dynamic_global_properties", [])
            .then(function(response) {
                expect(response.id).to.equal("2.0.0");
                done();
            }).catch(done);
    });

    it("Get trending state", function(done) {
        return Api.database_api().exec("get_state", ["trending"])
            .then(function(response) {
                done();
            }).catch(done);
    })

    it("Get block", function(done) {
        return Api.database_api().exec("get_block", [1])
            .then(function(response) {
                expect(response.previous).to.equal("0000000000000000000000000000000000000000");
                done();
            }).catch(done);
    })

    it("Get witness count", function(done) {
        return Api.database_api().exec("get_witness_count", [])
            .then(function(response) {
                expect(response).to.be.a('number');
                expect(response).to.be.above(0);
                done();
            }).catch(done);
    })

    it("Get order book", function(done) {
        return Api.database_api().exec("get_order_book", [10])
            .then(function(response) {
                expect(response.asks).to.be.an('array');
                expect(response.bids).to.be.an('array');
                done();
            }).catch(done);
    })

    // it("Get potential signatures", function(done) {
    //
    //     return Api.database_api().exec("get_potential_signatures", [])
    //         .then(function(response) {
    //             console.log("Potential sigs:", response);
    //         })
    // });

});
