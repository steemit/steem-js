
import types from "./auth/serializer/src/types"
import Serializer from "./auth/serializer/src/serializer"
import ByteBuffer from '@exodus/bytebuffer'

let price = new Serializer(
  "price", {
  base: types.asset,
  quote: types.asset
}
);
const propTypes = {
  key: types.public_key,
  new_signing_key: types.public_key,
  account_creation_fee: types.asset,
  account_subsidy_budget: types.uint32,
  account_subsidy_decay: types.uint32,
  maximum_block_size: types.uint32,
  sbd_interest_rate: types.uint16,
  sbd_exchange_rate: price,
  url: types.string
};
const snakeCaseRe = /_([a-z])/g;
export function camelCase(str) {
  return str.replace(snakeCaseRe, function(_m, l) {
    return l.toUpperCase();
  });
}

export function validateAccountName(value) {
  let i, label, len, suffix;

  suffix = "Account name should ";
  if (!value) {
    return suffix + "not be empty.";
  }
  const length = value.length;
  if (length < 3) {
    return suffix + "be longer.";
  }
  if (length > 16) {
    return suffix + "be shorter.";
  }
  if (/\./.test(value)) {
    suffix = "Each account segment should ";
  }
  const ref = value.split(".");
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i];
    if (!/^[a-z]/.test(label)) {
      return suffix + "start with a letter.";
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      return suffix + "have only letters, digits, or dashes.";
    }
    if (/--/.test(label)) {
      return suffix + "have only one dash in a row.";
    }
    if (!/[a-z0-9]$/.test(label)) {
      return suffix + "end with a letter or digit.";
    }
    if (!(label.length >= 3)) {
      return suffix + "be longer";
    }
  }
  return null;
}

function serialize(serializer, data) {
  const buffer = new ByteBuffer(
    ByteBuffer.DEFAULT_CAPACITY,
    ByteBuffer.LITTLE_ENDIAN
  );
  serializer.appendByteBuffer(buffer, data);
  buffer.flip();
  return buffer.toString('hex');
}

export function buildWitnessSetProperties(props) {
  const data = [];

  for (const [key, value] of Object.entries(props)) {
    const type = propTypes[key];

    if (!type) {
      throw new Error(`Unknown witness property: ${key}`);
    }

    data.push([key, serialize(type, value)]);
  }

  return data;
}
