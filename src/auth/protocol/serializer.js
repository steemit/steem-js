var ByteBuffer = require('bytebuffer');
var HEX_DUMP = process.env.npm_config__graphene_serializer_hex_dump;

var Serializer = function () {
    function Serializer(operation_name, types) {
        this.operation_name = operation_name;
        this.types = types;
        if (this.types) this.keys = Object.keys(this.types);

        Serializer.printDebug = true;
    }

    Serializer.prototype.fromByteBuffer = function fromByteBuffer(b) {
        var object = {};
        var field = null;
        try {
            var iterable = this.keys;
            for (var i = 0, field; i < iterable.length; i++) {
                field = iterable[i];
                var type = this.types[field];
                try {
                    if (HEX_DUMP) {
                        if (type.operation_name) {
                            console.error(type.operation_name);
                        } else {
                            var o1 = b.offset;
                            type.fromByteBuffer(b);
                            var o2 = b.offset;
                            b.offset = o1;
                            var _b = b.copy(o1, o2);
                            console.error(this.operation_name + '.' + field + '\t', _b.toHex());
                        }
                    }
                    object[field] = type.fromByteBuffer(b);
                } catch (e) {
                    if (Serializer.printDebug) {
                        console.error('Error reading ' + this.operation_name + '.' + field + ' in data:');
                        b.printDebug();
                    }
                    throw e;
                }
            }
        } catch (error) {
            EC._throw(this.operation_name + '.' + field, error);
        }

        return object;
    };

    Serializer.prototype.appendByteBuffer = function appendByteBuffer(b, object) {
        var field = null;
        try {
            var iterable = this.keys;
            for (var i = 0, field; i < iterable.length; i++) {
                field = iterable[i];
                var type = this.types[field];
                type.appendByteBuffer(b, object[field]);
            }
        } catch (error) {
            try {
                EC._throw(this.operation_name + '.' + field + " = " + JSON.stringify(object[field]), error);
            } catch (e) {
                // circular ref
                EC._throw(this.operation_name + '.' + field + " = " + object[field], error);
            }
        }
        return;
    };

    Serializer.prototype.fromObject = function fromObject(serialized_object) {
        var result = {};
        var field = null;
        try {
            var iterable = this.keys;
            for (var i = 0, field; i < iterable.length; i++) {
                field = iterable[i];
                var type = this.types[field];
                var value = serialized_object[field];
                var object = type.fromObject(value);
                result[field] = object;
            }
        } catch (error) {
            EC._throw(this.operation_name + '.' + field, error);
        }

        return result;
    };

    /**
        @arg {boolean} [debug.use_default = false] - more template friendly
        @arg {boolean} [debug.annotate = false] - add user-friendly information
    */
    Serializer.prototype.toObject = function toObject() {
        var serialized_object = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var debug = arguments.length <= 1 || arguments[1] === undefined ? { use_default: false, annotate: false } : arguments[1];

        var result = {};
        var field = null;
        try {
            if (!this.types) return result;

            var iterable = this.keys;
            for (var i = 0, field; i < iterable.length; i++) {
                field = iterable[i];
                var type = this.types[field];
                var object = type.toObject(typeof serialized_object !== "undefined" && serialized_object !== null ? serialized_object[field] : undefined, debug);
                result[field] = object;
                if (HEX_DUMP) {
                    var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
                    var has_value = typeof serialized_object !== "undefined" && serialized_object !== null;
                    if (has_value) {
                        var value = serialized_object[field];
                        if (value) type.appendByteBuffer(b, value);
                    }
                    b = b.copy(0, b.offset);
                    console.error(this.operation_name + '.' + field, b.toHex());
                }
            }
        } catch (error) {
            EC._throw(this.operation_name + '.' + field, error);
        }

        return result;
    };

    /** Sort by the first element in a operation */
    Serializer.prototype.compare = function compare(a, b) {

        var first_key = this.keys[0];
        var first_type = this.types[first_key];

        var valA = a[first_key];
        var valB = b[first_key];

        if (first_type.compare) return first_type.compare(valA, valB);

        if (typeof valA === "number" && typeof valB === "number") return valA - valB;

        var encoding = void 0;
        if (Buffer.isBuffer(valA) && Buffer.isBuffer(valB)) {
            // A binary string compare does not work.  If localeCompare is well supported that could replace HEX.  Performanance is very good so comparing HEX works.
            encoding = "hex";
        }

        var strA = valA.toString(encoding);
        var strB = valB.toString(encoding);
        return strA > strB ? 1 : strA < strB ? -1 : 0;
    };

    // <helper_functions>
    Serializer.prototype.fromHex = function fromHex(hex) {
        var b = ByteBuffer.fromHex(hex, ByteBuffer.LITTLE_ENDIAN);
        return this.fromByteBuffer(b);
    };

    Serializer.prototype.fromBuffer = function fromBuffer(buffer) {
        var b = ByteBuffer.fromBinary(buffer.toString("binary"), ByteBuffer.LITTLE_ENDIAN);
        return this.fromByteBuffer(b);
    };

    Serializer.prototype.toHex = function toHex(object) {
        var b = this.toByteBuffer(object);
        return b.toHex();
    };

    Serializer.prototype.toByteBuffer = function toByteBuffer(object) {
        var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        this.appendByteBuffer(b, object);
        return b.copy(0, b.offset);
    };

    Serializer.prototype.toBuffer = function toBuffer(object) {
        return new Buffer(this.toByteBuffer(object).toBinary(), 'binary');
    };

    return Serializer;
} ();

var ErrorWithCause = function(message,cause){
        this.message = message;
        if ((typeof cause !== "undefined" && cause !== null) ? cause.message : undefined) {
            this.message = 'cause\t'+cause.message+'\t' + this.message;
        }

        var stack = "";//(new Error).stack
        if ((typeof cause !== "undefined" && cause !== null) ? cause.stack : undefined) {
            stack = 'caused by\n\t'+cause.stack+'\t' + stack;
        }

        this.stack = this.message + "\n" + stack;

    this._throw = function(message, cause){
        var msg = message;
        if ((typeof cause !== "undefined" && cause !== null) ? cause.message : undefined) { msg += '\t cause: '+cause.message+' '; }
        if ((typeof cause !== "undefined" && cause !== null) ? cause.stack : undefined) { msg += '\n stack: '+cause.stack+' '; }
        throw new Error(msg);
    }
};
var EC = new ErrorWithCause(); 

module.exports = Serializer;