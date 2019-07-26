const Long = require("bytebuffer").Long;

const v = require("./validation");
const DB_MAX_INSTANCE_ID = Long.fromNumber(Math.pow(2, 48) - 1);

class ObjectId {
  constructor(space, type, instance) {
    this.space = space;
    this.type = type;
    this.instance = instance;
    const instance_string = this.instance.toString();
    const object_id = `${this.space}.${this.type}.${instance_string}`;
    if (!v.is_digits(instance_string)) {
      throw new `Invalid object id ${object_id}`();
    }
  }

  static fromString(value) {
    if (
      value.space !== undefined &&
      value.type !== undefined &&
      value.instance !== undefined
    ) {
      return value;
    }
    const params = v.require_match(
      /^([0-9]+)\.([0-9]+)\.([0-9]+)$/,
      v.required(value, "object_id"),
      "object_id"
    );
    return new ObjectId(
      parseInt(params[1]),
      parseInt(params[2]),
      Long.fromString(params[3])
    );
  }

  static fromLong(long) {
    const space = long.shiftRight(56).toInt();
    const type = long.shiftRight(48).toInt() & 0x00ff;
    const instance = long.and(DB_MAX_INSTANCE_ID);
    return new ObjectId(space, type, instance);
  }

  static fromByteBuffer(b) {
    return ObjectId.fromLong(b.readUint64());
  }

  toLong() {
    return Long.fromNumber(this.space)
      .shiftLeft(56)
      .or(
        Long.fromNumber(this.type)
          .shiftLeft(48)
          .or(this.instance)
      );
  }

  appendByteBuffer(b) {
    return b.writeUint64(this.toLong());
  }

  toString() {
    return `${this.space}.${this.type}.${this.instance.toString()}`;
  }
}

module.exports = ObjectId;
