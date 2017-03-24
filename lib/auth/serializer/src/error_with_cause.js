"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** Exception nesting.  */
var ErrorWithCause = function () {
    function ErrorWithCause(message, cause) {
        _classCallCheck(this, ErrorWithCause);

        this.message = message;
        if (typeof cause !== "undefined" && cause !== null ? cause.message : undefined) {
            this.message = "cause\t" + cause.message + "\t" + this.message;
        }

        var stack = ""; //(new Error).stack
        if (typeof cause !== "undefined" && cause !== null ? cause.stack : undefined) {
            stack = "caused by\n\t" + cause.stack + "\t" + stack;
        }

        this.stack = this.message + "\n" + stack;
    }

    _createClass(ErrorWithCause, null, [{
        key: "throw",
        value: function _throw(message, cause) {
            var msg = message;
            if (typeof cause !== "undefined" && cause !== null ? cause.message : undefined) {
                msg += "\t cause: " + cause.message + " ";
            }
            if (typeof cause !== "undefined" && cause !== null ? cause.stack : undefined) {
                msg += "\n stack: " + cause.stack + " ";
            }
            throw new Error(msg);
        }
    }]);

    return ErrorWithCause;
}();

module.exports = ErrorWithCause;