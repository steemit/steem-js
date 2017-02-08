// Low-level types that make up operations

var ByteBuffer = require('bytebuffer');
var base58 = require('bs58');

var Serializer = require('../serializer');
var fp = require('./fast-parser');
var chain_types = require('./chain-types');
var Long = ByteBuffer.Long;

var PublicKey = require("./key-public");
var hash = require('./../signature/hash');
var config = 'STM';
var Types = {};

var HEX_DUMP = process.env.npm_config__graphene_serializer_hex_dump;
var DB_MAX_INSTANCE_ID = Long.fromNumber(((Math.pow(2, 48)) - 1));

/**
* Asset symbols contain the following information
*
*  4 bit PRECISION
*  4 bit RESERVED
*  CHAR[6] up to 6 upper case alpha numeric ascii characters,
*  char = \0  null terminated
*
*  It is treated as a uint64_t for all internal operations, but
*  is easily converted to something that can be displayed.
*/
Types.asset = {
    fromByteBuffer: function fromByteBuffer(b) {
        var amount = b.readInt64();
        var precision = b.readUint8();
        var b_copy = b.copy(b.offset, b.offset + 7);
        var symbol = new Buffer(b_copy.toBinary(), "binary").toString().replace(/\x00/g, "");
        b.skip(7);
        // "1.000 STEEM" always written with full precision
        var amount_string = fromImpliedDecimal(amount, precision);
        return amount_string + " " + symbol;
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        object = object.trim();
        if (!/^[0-9]+\.?[0-9]* [A-Za-z0-9]+$/.test(object)) throw new Error("Expecting amount like '99.000 SYMBOL', instead got '" + object + "'");

        var amount = object.split(" ")[0];
        var symbol = object.split(" ")[1];
        if (symbol.length > 6) throw new Error("Symbols are not longer than 6 characters " + symbol + "-" + symbol.length);

        b.writeInt64(toLong(amount.replace(".", "")));
        var dot = amount.indexOf("."); // 0.000
        var precision = dot === -1 ? 0 : amount.length - dot - 1;
        b.writeUint8(precision);
        b.append(symbol.toUpperCase(), 'binary');
        for (var i = 0; i < 7 - symbol.length; i++) {
            b.writeUint8(0);
        } return;
    },
    fromObject: function fromObject(object) {
        return object;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "0.000 STEEM";
        }
        return object;
    }
};

Types.uint8 = {

    fromByteBuffer: function fromByteBuffer(b) {
        return b.readUint8();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeUint8(object);
        return;
    },
    fromObject: function fromObject(object) {
        return object;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return 0;
        }
        return parseInt(object);
    }
};

Types.uint16 = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readUint16();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeUint16(object);
        return;
    },
    fromObject: function fromObject(object) {
        return object;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return 0;
        }
        return parseInt(object);
    }
};

Types.uint32 = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readUint32();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeUint32(object);
        return;
    },
    fromObject: function fromObject(object) {
        return object;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return 0;
        }
        return parseInt(object);
    }
};

var MIN_SIGNED_32 = -1 * Math.pow(2, 31);
var MAX_SIGNED_32 = Math.pow(2, 31) - 1;

Types.varint32 = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readVarint32();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeVarint32(object);
        return;
    },
    fromObject: function fromObject(object) {
        return object;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return 0;
        }
        return parseInt(object);
    }
};

Types.int16 = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readInt16();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeInt16(object);
        return;
    },
    fromObject: function fromObject(object) {
        return object;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return 0;
        }
        return parseInt(object);
    }
};

Types.int64 = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readInt64();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeInt64(toLong(object));
        return;
    },
    fromObject: function fromObject(object) {
        return toLong(object);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "0";
        }
        return toLong(object).toString();
    }
};

Types.uint64 = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readUint64();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeUint64(toLong(object));
        return;
    },
    fromObject: function fromObject(object) {
        return toLong(object);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "0";
        }
        return toLong(object).toString();
    }
};

Types.string = {
    fromByteBuffer: function fromByteBuffer(b) {
        return new Buffer(b.readVString(), 'utf8');
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeVString(object.toString());
        return;
    },
    fromObject: function fromObject(object) {
        return new Buffer(object, 'utf8');
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "";
        }
        return object.toString('utf8');
    }
};

Types.string_binary = {
    fromByteBuffer: function fromByteBuffer(b) {
        var b_copy;
        var len = b.readVarint32();
        b_copy = b.copy(b.offset, b.offset + len), b.skip(len);
        return new Buffer(b_copy.toBinary(), 'binary');
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        b.writeVarint32(object.length);
        b.append(object.toString('binary'), 'binary');
        return;
    },
    fromObject: function fromObject(object) {
        return new Buffer(object);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "";
        }
        return object.toString();
    }
};

Types.bytes = function (size) {
    return {
        fromByteBuffer: function fromByteBuffer(b) {
            if (size === undefined) {
                var b_copy;
                var len = b.readVarint32();
                b_copy = b.copy(b.offset, b.offset + len), b.skip(len);
                return new Buffer(b_copy.toBinary(), 'binary');
            } else {
                b_copy = b.copy(b.offset, b.offset + size), b.skip(size);
                return new Buffer(b_copy.toBinary(), 'binary');
            }
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            if (typeof object === "string") object = new Buffer(object, "hex");

            if (size === undefined) {
                b.writeVarint32(object.length);
            }
            b.append(object.toString('binary'), 'binary');
            return;
        },
        fromObject: function fromObject(object) {
            if (Buffer.isBuffer(object)) return object;

            return new Buffer(object, 'hex');
        },
        toObject: function toObject(object, debug) {
            if (debug.use_default && object === undefined) {
                var zeros = function zeros(num) {
                    return new Array(num).join("00");
                };
                return zeros(size);
            }
            return object.toString('hex');
        }
    };
};

Types.bool = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readUint8() === 1;
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        // supports boolean or integer
        b.writeUint8(JSON.parse(object) ? 1 : 0);
        return;
    },
    fromObject: function fromObject(object) {
        return JSON.parse(object) ? true : false;
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return false;
        }
        return JSON.parse(object) ? true : false;
    }
};

Types.void = {
    fromByteBuffer: function fromByteBuffer(b) {
        throw new Error("(void) undefined type");
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        throw new Error("(void) undefined type");
    },
    fromObject: function fromObject(object) {
        throw new Error("(void) undefined type");
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return undefined;
        }
        throw new Error("(void) undefined type");
    }
};

Types.array = function (st_operation) {
    return {
        fromByteBuffer: function fromByteBuffer(b) {
            var size = b.readVarint32();
            if (HEX_DUMP) {
                console.log("varint32 size = " + size.toString(16));
            }
            var result = [];
            for (var i = 0; 0 < size ? i < size : i > size; 0 < size ? i++ : i++) {
                result.push(st_operation.fromByteBuffer(b));
            }
            return sortOperation(result, st_operation);
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            object = sortOperation(object, st_operation);
            b.writeVarint32(object.length);
            for (var i = 0, o; i < object.length; i++) {
                o = object[i];
                st_operation.appendByteBuffer(b, o);
            }
        },
        fromObject: function fromObject(object) {
            object = sortOperation(object, st_operation);
            var result = [];
            for (var i = 0, o; i < object.length; i++) {
                o = object[i];
                result.push(st_operation.fromObject(o));
            }
            return result;
        },
        toObject: function toObject(object, debug) {
            if (debug.use_default && object === undefined) {
                return [st_operation.toObject(object, debug)];
            }
            object = sortOperation(object, st_operation);

            var result = [];
            for (var i = 0, o; i < object.length; i++) {
                o = object[i];
                result.push(st_operation.toObject(o, debug));
            }
            return result;
        }
    };
};

Types.time_point_sec = {
    fromByteBuffer: function fromByteBuffer(b) {
        return b.readUint32();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        if (typeof object !== "number") object = Types.time_point_sec.fromObject(object);

        b.writeUint32(object);
        return;
    },
    fromObject: function fromObject(object) {
        if (typeof object === "number") return object;

        if (object.getTime) return Math.floor(object.getTime() / 1000);

        if (typeof object !== "string") throw new Error("Unknown date type: " + object);

        // if(typeof object === "string" && !/Z$/.test(object))
        //     object = object + "Z"

        return Math.floor(new Date(object).getTime() / 1000);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) return new Date(0).toISOString().split('.')[0];

        if (typeof object === "string") return object;

        if (object.getTime) return object.toISOString().split('.')[0];

        var int = parseInt(object);
        return new Date(int * 1000).toISOString().split('.')[0];
    }
};

Types.set = function (st_operation) {
    return {
        validate: function validate(array) {
            var dup_map = {};
            for (var i = 0, o; i < array.length; i++) {
                o = array[i];
                var ref;
                if (ref = typeof o === "undefined" ? "undefined" : _typeof(o), ['string', 'number'].indexOf(ref) >= 0) {
                    if (dup_map[o] !== undefined) {
                        throw new Error("duplicate (set)");
                    }
                    dup_map[o] = true;
                }
            }
            return sortOperation(array, st_operation);
        },
        fromByteBuffer: function fromByteBuffer(b) {
            var size = b.readVarint32();
            if (HEX_DUMP) {
                console.log("varint32 size = " + size.toString(16));
            }
            return this.validate(function () {
                var result = [];
                for (var i = 0; 0 < size ? i < size : i > size; 0 < size ? i++ : i++) {
                    result.push(st_operation.fromByteBuffer(b));
                }
                return result;
            } ());
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            if (!object) {
                object = [];
            }
            b.writeVarint32(object.length);
            var iterable = this.validate(object);
            for (var i = 0, o; i < iterable.length; i++) {
                o = iterable[i];
                st_operation.appendByteBuffer(b, o);
            }
            return;
        },
        fromObject: function fromObject(object) {
            if (!object) {
                object = [];
            }
            return this.validate(function () {
                var result = [];
                for (var i = 0, o; i < object.length; i++) {
                    o = object[i];
                    result.push(st_operation.fromObject(o));
                }
                return result;
            } ());
        },
        toObject: function toObject(object, debug) {
            if (debug.use_default && object === undefined) {
                return [st_operation.toObject(object, debug)];
            }
            if (!object) {
                object = [];
            }
            return this.validate(function () {
                var result = [];
                for (var i = 0, o; i < object.length; i++) {
                    o = object[i];
                    result.push(st_operation.toObject(o, debug));
                }
                return result;
            } ());
        }
    };
};

// global_parameters_update_operation current_fees
Types.fixed_array = function (count, st_operation) {
    return {
        fromByteBuffer: function fromByteBuffer(b) {
            var i, j, ref, results;
            results = [];
            for (i = j = 0, ref = count; j < ref; i = j += 1) {
                results.push(st_operation.fromByteBuffer(b));
            }
            return sortOperation(results, st_operation);
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            var i, j, ref;
            if (count !== 0) {
                object = sortOperation(object, st_operation);
            }
            for (i = j = 0, ref = count; j < ref; i = j += 1) {
                st_operation.appendByteBuffer(b, object[i]);
            }
        },
        fromObject: function fromObject(object) {
            var i, j, ref, results;
            results = [];
            for (i = j = 0, ref = count; j < ref; i = j += 1) {
                results.push(st_operation.fromObject(object[i]));
            }
            return results;
        },
        toObject: function toObject(object, debug) {
            var i, j, k, ref, ref1, results, results1;
            if (debug == null) {
                debug;
            }
            if (debug.use_default && object === void 0) {
                results = [];
                for (i = j = 0, ref = count; j < ref; i = j += 1) {
                    results.push(st_operation.toObject(void 0, debug));
                }
                return results;
            }
            results1 = [];
            for (i = k = 0, ref1 = count; k < ref1; i = k += 1) {
                results1.push(st_operation.toObject(object[i], debug));
            }
            return results1;
        }
    };
};

/* Supports instance numbers (11) or object types (1.2.11).  Object type
validation is enforced when an object type is used. */
var id_type = function id_type(reserved_spaces, object_type) {
    return {
        fromByteBuffer: function fromByteBuffer(b) {
            return b.readVarint32();
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            if (object.resolve !== undefined) {
                object = object.resolve;
            }
            // convert 1.2.n into just n
            if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(object)) {
                object = parseInt(object.split('.')[2], 10);
            }
            b.writeVarint32(parseInt(object), 10);
            return;
        },
        fromObject: function fromObject(object) {
            if (object.resolve !== undefined) {
                object = object.resolve;
            }
            if (typeof object === "numeric" || /^[0-9]+$/.test(object)) {
                return parseInt(object, 10);
            }
            return parseInt(object.split('.')[2], 10);
        },
        toObject: function toObject(object, debug) {
            var object_type_id = chain_types.object_type[object_type];
            if (debug.use_default && object === undefined) {
                return '' + reserved_spaces + '.' + object_type_id + '.0';
            }
            if (object.resolve !== undefined) {
                object = object.resolve;
            }
            if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(object)) {
                object = parseInt(object.split('.')[2], 10);
            }

            return '' + reserved_spaces + '.' + object_type_id + '.' + object;
        }
    };
};

Types.protocol_id_type = function (name) {
    return id_type(chain_types.reserved_spaces.protocol_ids, name);
};

Types.object_id_type = {
    fromByteBuffer: function fromByteBuffer(b) {
        return ObjectId.fromByteBuffer(b);
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        if (object.resolve !== undefined) {
            object = object.resolve;
        }
        object = ObjectId.fromString(object);
        object.appendByteBuffer(b);
        return;
    },
    fromObject: function fromObject(object) {
        if (object.resolve !== undefined) {
            object = object.resolve;
        }
        return ObjectId.fromString(object);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "0.0.0";
        }
        if (object.resolve !== undefined) {
            object = object.resolve;
        }
        object = ObjectId.fromString(object);
        return object.toString();
    }
};

Types.vote_id = {
    TYPE: 0x000000FF,
    ID: 0xFFFFFF00,
    fromByteBuffer: function fromByteBuffer(b) {
        var value = b.readUint32();
        return {
            type: value & this.TYPE,
            id: value & this.ID
        };
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        if (object === "string") object = Types.vote_id.fromObject(object);

        var value = object.id << 8 | object.type;
        b.writeUint32(value);
        return;
    },
    fromObject: function fromObject(object) {
        if ((typeof object === "undefined" ? "undefined" : _typeof(object)) === "object") {
            return object;
        }
        var type,
            id = object.split(':');
        return { type: type, id: id };
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return "0:0";
        }
        if (typeof object === "string") object = Types.vote_id.fromObject(object);

        return object.type + ":" + object.id;
    },
    compare: function compare(a, b) {
        if ((typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") a = Types.vote_id.fromObject(a);
        if ((typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") b = Types.vote_id.fromObject(b);
        return parseInt(a.id) - parseInt(b.id);
    }
};

Types.optional = function (st_operation) {
    return {
        fromByteBuffer: function fromByteBuffer(b) {
            if (!(b.readUint8() === 1)) {
                return undefined;
            }
            return st_operation.fromByteBuffer(b);
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            if (object !== null && object !== undefined) {
                b.writeUint8(1);
                st_operation.appendByteBuffer(b, object);
            } else {
                b.writeUint8(0);
            }
            return;
        },
        fromObject: function fromObject(object) {
            if (object === undefined) {
                return undefined;
            }
            return st_operation.fromObject(object);
        },
        toObject: function toObject(object, debug) {
            // toObject is only null save if use_default is true
            var result_object = function () {
                if (!debug.use_default && object === undefined) {
                    return undefined;
                } else {
                    return st_operation.toObject(object, debug);
                }
            } ();

            if (debug.annotate) {
                if ((typeof result_object === "undefined" ? "undefined" : _typeof(result_object)) === "object") {
                    result_object.__optional = "parent is optional";
                } else {
                    result_object = { __optional: result_object };
                }
            }
            return result_object;
        }
    };
};

Types.static_variant = function (_st_operations) {
    return {
        nosort: true,
        st_operations: _st_operations,
        opTypeId: function opTypeId(value) {
            var pos = 0,
                type_id;
            if (typeof value === "number") type_id = value; else {
                for (var _iterator = this.st_operations, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) {
                    var _ref;

                    if (_isArray) {
                        if (_i >= _iterator.length) break;
                        _ref = _iterator[_i++];
                    } else {
                        _i = _iterator.next();
                        if (_i.done) break;
                        _ref = _i.value;
                    }

                    var op = _ref;

                    if (op.operation_name === value) {
                        type_id = pos;
                        break;
                    }
                    pos++;
                }
            }
            return type_id;
        },
        fromByteBuffer: function fromByteBuffer(b) {
            var type_id = b.readVarint32();
            var st_operation = this.st_operations[type_id];
            if (HEX_DUMP) {
                console.error('static_variant id 0x' + type_id.toString(16) + ' (' + type_id + ')');
            }
            return [type_id, st_operation.fromByteBuffer(b)];
        },
        appendByteBuffer: function appendByteBuffer(b, object) {
            var type_id = this.opTypeId(object[0]);
            var st_operation = this.st_operations[type_id];
            b.writeVarint32(type_id);
            st_operation.appendByteBuffer(b, object[1]);
            return;
        },
        fromObject: function fromObject(object) {
            var type_id = this.opTypeId(object[0]);
            var st_operation = this.st_operations[type_id];
            return [type_id, st_operation.fromObject(object[1])];
        },
        toObject: function toObject(object, debug) {
            if (debug.use_default && object === undefined) {
                return [this.st_operations[0].operation_name, this.st_operations[0].toObject(undefined, debug)];
            }
            var type_id = this.opTypeId(object[0]);
            var st_operation = this.st_operations[type_id];
            return [st_operation.operation_name, st_operation.toObject(object[1], debug)];
        },
        compare: function compare(a, b) {
            return strCmp(this.opTypeId(a[0]), this.opTypeId(b[0]));
        }
    };
};

Types.map = function (key_st_operation, value_st_operation) {
    return {
        validate: function validate(array) {
            if (!Array.isArray(array)) {
                throw new Error("expecting array");
            }
            var dup_map = {};
            for (var i = 0, o; i < array.length; i++) {
                o = array[i];
                var ref;
                if (!(o.length === 2)) {
                    throw new Error("expecting two elements");
                }
                if (ref = _typeof(o[0]), ['number', 'string'].indexOf(ref) >= 0) {
                    if (dup_map[o[0]] !== undefined) {
                        throw new Error("duplicate (map)");
                    }
                    dup_map[o[0]] = true;
                }
            }
            return sortOperation(array, key_st_operation);
        },

        fromByteBuffer: function fromByteBuffer(b) {
            var result = [];
            var end = b.readVarint32();
            for (var i = 0; 0 < end ? i < end : i > end; 0 < end ? i++ : i++) {
                result.push([key_st_operation.fromByteBuffer(b), value_st_operation.fromByteBuffer(b)]);
            }
            return this.validate(result);
        },

        appendByteBuffer: function appendByteBuffer(b, object) {
            this.validate(object);
            b.writeVarint32(object.length);
            for (var i = 0, o; i < object.length; i++) {
                o = object[i];
                key_st_operation.appendByteBuffer(b, o[0]);
                value_st_operation.appendByteBuffer(b, o[1]);
            }
            return;
        },
        fromObject: function fromObject(object) {
            var result = [];
            for (var i = 0, o; i < object.length; i++) {
                o = object[i];
                result.push([key_st_operation.fromObject(o[0]), value_st_operation.fromObject(o[1])]);
            }
            return this.validate(result);
        },
        toObject: function toObject(object, debug) {
            if (debug.use_default && object === undefined) {
                return [[key_st_operation.toObject(undefined, debug), value_st_operation.toObject(undefined, debug)]];
            }
            object = this.validate(object);
            var result = [];
            for (var i = 0, o; i < object.length; i++) {
                o = object[i];
                result.push([key_st_operation.toObject(o[0], debug), value_st_operation.toObject(o[1], debug)]);
            }
            return result;
        }
    };
};

Types.public_key = {
    toPublic: function toPublic(object) {
        if (object.resolve !== undefined) {
            object = object.resolve;
        }
        return object == null ? object : object.Q ? object : PublicKey.fromStringOrThrow(object);
    },
    fromByteBuffer: function fromByteBuffer(b) {
        return fp.public_key(b);
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        fp.public_key(b, Types.public_key.toPublic(object));
        return;
    },
    fromObject: function fromObject(object) {
        if (object.Q) {
            return object;
        }
        return Types.public_key.toPublic(object);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return config.address_prefix + "859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2HqhToVM";
        }
        return object.toString();
    },
    compare: function compare(a, b) {
        // sort decending
        return -1 * strCmp(a.toString(), b.toString());
    }
};

Types.address = {
    _to_address: function _to_address(object) {
        if (object.addy) {
            return object;
        }
        return Address.fromString(object);
    },
    fromByteBuffer: function fromByteBuffer(b) {
        return new Address(fp.ripemd160(b));
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
        fp.ripemd160(b, Types.address._to_address(object).toBuffer());
        return;
    },
    fromObject: function fromObject(object) {
        return Types.address._to_address(object);
    },
    toObject: function toObject(object, debug) {
        if (debug.use_default && object === undefined) {
            return config.address_prefix + "664KmHxSuQyDsfwo4WEJvWpzg1QKdg67S";
        }
        return Types.address._to_address(object).toString();
    },
    compare: function compare(a, b) {
        // sort decending
        return -1 * strCmp(a.toString(), b.toString());
    }
};
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var strCmp = function strCmp(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
};
var firstEl = function firstEl(el) {
    return Array.isArray(el) ? el[0] : el;
};
var sortOperation = function sortOperation(array, st_operation) {
    return st_operation.nosort ? array : st_operation.compare ? array.sort(function (a, b) {
        return st_operation.compare(firstEl(a), firstEl(b));
    }) : // custom compare operation
        array.sort(function (a, b) {
            return typeof firstEl(a) === "number" && typeof firstEl(b) === "number" ? firstEl(a) - firstEl(b) :
                // A binary string compare does not work. Performanance is very good so HEX is used..  localeCompare is another option.
                Buffer.isBuffer(firstEl(a)) && Buffer.isBuffer(firstEl(b)) ? strCmp(firstEl(a).toString("hex"), firstEl(b).toString("hex")) : strCmp(firstEl(a).toString(), firstEl(b).toString());
        });
};
var toLong = function toLong(value) {
    return Long.isLong(value) ? value : Long.fromString(value);
};

var ObjectId = function () {
    function ObjectId(space, type, instance) {
        this.space = space;
        this.type = type;
        this.instance = instance;
        var instance_string = this.instance.toString();
        var object_id = this.space + "." + this.type + "." + instance_string;
    }

    ObjectId.fromString = function fromString(value) {
        if (value.space !== undefined && value.type !== undefined && value.instance !== undefined) {
            return value;
        }
        var params = value.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/);
        return new ObjectId(parseInt(params[1]), parseInt(params[2]), Long.fromString(params[3]));
    };

    ObjectId.fromLong = function fromLong(long) {
        var space = long.shiftRight(56).toInt();
        var type = long.shiftRight(48).toInt() & 0x00ff;
        var instance = long.and(DB_MAX_INSTANCE_ID);
        return new ObjectId(space, type, instance);
    };

    ObjectId.fromByteBuffer = function fromByteBuffer(b) {
        return ObjectId.fromLong(b.readUint64());
    };

    ObjectId.prototype.toLong = function toLong() {
        return Long.fromNumber(this.space).shiftLeft(56).or(Long.fromNumber(this.type).shiftLeft(48).or(this.instance));
    };

    ObjectId.prototype.appendByteBuffer = function appendByteBuffer(b) {
        return b.writeUint64(this.toLong());
    };

    ObjectId.prototype.toString = function toString() {
        return this.space + "." + this.type + "." + this.instance.toString();
    };

    return ObjectId;
} ();

var Address = function () {
    function Address(addy) {
        this.addy = addy;
    }

    Address.fromBuffer = function fromBuffer(buffer) {
        var _hash = hash.sha512(buffer);
        var addy = hash.ripemd160(_hash);
        return new Address(addy);
    };

    Address.fromString = function fromString(string) {
        var address_prefix = arguments.length <= 1 || arguments[1] === undefined ? config.address_prefix : arguments[1];

        var prefix = string.slice(0, address_prefix.length);
        var addy = string.slice(address_prefix.length);
        addy = new Buffer(base58.decode(addy), 'binary');
        var checksum = addy.slice(-4);
        addy = addy.slice(0, -4);
        var new_checksum = hash.ripemd160(addy);
        new_checksum = new_checksum.slice(0, 4);
        return new Address(addy);
    };

    /** @return Address - Compressed PTS format (by default) */
    Address.fromPublic = function fromPublic(public_key) {
        var compressed = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
        var version = arguments.length <= 2 || arguments[2] === undefined ? 56 : arguments[2];

        var sha2 = hash.sha256(public_key.toBuffer(compressed));
        var rep = hash.ripemd160(sha2);
        var versionBuffer = new Buffer(1);
        versionBuffer.writeUInt8(0xFF & version, 0);
        var addr = Buffer.concat([versionBuffer, rep]);
        var check = hash.sha256(addr);
        check = hash.sha256(check);
        var buffer = Buffer.concat([addr, check.slice(0, 4)]);
        return new Address(hash.ripemd160(buffer));
    };

    Address.prototype.toBuffer = function toBuffer() {
        return this.addy;
    };

    Address.prototype.toString = function toString() {
        var address_prefix = arguments.length <= 0 || arguments[0] === undefined ? config.address_prefix : arguments[0];
        var checksum = hash.ripemd160(this.addy);
        var addy = Buffer.concat([this.addy, checksum.slice(0, 4)]);
        return address_prefix + base58.encode(addy);
    };

    return Address;
} ();

var fromImpliedDecimal = function fromImpliedDecimal(number, precision) {
    if (typeof number === "number") {
        assert(number <= 9007199254740991, "overflow");
        number = "" + number;
    } else if (number.toString) number = number.toString();

    while (number.length < precision + 1) {
        // 0.123
        number = "0" + number;
    } // 44000 => 44.000
    var dec_string = number.substring(number.length - precision);
    return number.substring(0, number.length - precision) + (dec_string ? "." + dec_string : "");
};

module.exports = Types;