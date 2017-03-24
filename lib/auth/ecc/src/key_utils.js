'use strict';

var PrivateKey = require('./key_private');
var hash = require('./hash');
var secureRandom = require('secure-random');

// hash for .25 second
var HASH_POWER_MILLS = 250;

var entropyPos = 0,
    entropyCount = 0;
var entropyArray = secureRandom.randomBuffer(101);

module.exports = {
    addEntropy: function addEntropy() {
        entropyCount++;

        for (var _len = arguments.length, ints = Array(_len), _key = 0; _key < _len; _key++) {
            ints[_key] = arguments[_key];
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = ints[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var i = _step.value;

                var pos = entropyPos++ % 101;
                var i2 = entropyArray[pos] += i;
                if (i2 > 9007199254740991) entropyArray[pos] = 0;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    },


    /**
        A week random number generator can run out of entropy.  This should ensure even the worst random number implementation will be reasonably safe.
         @param1 string entropy of at least 32 bytes
    */
    random32ByteBuffer: function random32ByteBuffer() {
        var entropy = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.browserEntropy();


        if (!(typeof entropy === 'string')) {
            throw new Error("string required for entropy");
        }

        if (entropy.length < 32) {
            throw new Error("expecting at least 32 bytes of entropy");
        }

        var start_t = Date.now();

        while (Date.now() - start_t < HASH_POWER_MILLS) {
            entropy = hash.sha256(entropy);
        }var hash_array = [];
        hash_array.push(entropy);

        // Hashing for 1 second may helps the computer is not low on entropy (this method may be called back-to-back).
        hash_array.push(secureRandom.randomBuffer(32));

        return hash.sha256(Buffer.concat(hash_array));
    },
    get_random_key: function get_random_key(entropy) {
        return PrivateKey.fromBuffer(this.random32ByteBuffer(entropy));
    },


    // Turn invisible space like characters into a single space
    // normalize_brain_key(brain_key){
    //     if (!(typeof brain_key === 'string')) {
    //         throw new Error("string required for brain_key");
    //     }
    //     brain_key = brain_key.trim();
    //     return brain_key.split(/[\t\n\v\f\r ]+/).join(' ');
    // },

    browserEntropy: function browserEntropy() {
        var entropyStr = Array(entropyArray).join();
        try {
            entropyStr += new Date().toString() + " " + window.screen.height + " " + window.screen.width + " " + window.screen.colorDepth + " " + " " + window.screen.availHeight + " " + window.screen.availWidth + " " + window.screen.pixelDepth + navigator.language + " " + window.location + " " + window.history.length;

            for (var i = 0, mimeType; i < navigator.mimeTypes.length; i++) {
                mimeType = navigator.mimeTypes[i];
                entropyStr += mimeType.description + " " + mimeType.type + " " + mimeType.suffixes + " ";
            }
            console.log("INFO\tbrowserEntropy gathered", entropyCount, 'events');
        } catch (error) {
            //nodejs:ReferenceError: window is not defined
            entropyStr += hash.sha256(new Date().toString());
        }

        var b = new Buffer(entropyStr);
        entropyStr += b.toString('binary') + " " + new Date().toString();
        return entropyStr;
    }
};