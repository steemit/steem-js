// Ported logic from original steem-js

// Helper: 64-bit signed integer range
const MAX_INT64 = BigInt('9223372036854775807');
const MIN_INT64 = BigInt('-9223372036854775808');

export const _internal = {
  decimal_precision_string: (number: string, precision: number): string => {
    if (number === undefined || number === null) throw new Error('number required');
    if (precision === undefined || precision === null) throw new Error('precision required');
    let number_string = String(number).trim();
    precision = Number(precision);
    // remove leading zeros (not suffixing)
    const number_parts = number_string.match(/^-?0*([0-9]*)\.?([0-9]*)$/);
    if (!number_parts) {
      throw new Error(`Invalid number: ${number_string}`);
    }
    let sign = number_string.charAt(0) === '-' ? '-' : '';
    let int_part = number_parts[1];
    let decimal_part = number_parts[2] || '';
    // remove trailing zeros
    while (/0$/.test(decimal_part)) {
      decimal_part = decimal_part.substring(0, decimal_part.length - 1);
    }
    let zero_pad_count = precision - decimal_part.length;
    if (zero_pad_count < 0) {
      throw new Error(`overflow, up to ${precision} decimals may be used`);
    }
    if (sign === '-' && !/[1-9]/.test(int_part + decimal_part)) { sign = ''; }
    if (int_part === '') { int_part = '0'; }
    for (let i = 0; i < zero_pad_count; i++) {
      decimal_part += '0';
    }
    return sign + int_part + decimal_part;
  }
};

export const to_bigint64 = (number_or_string: string, precision: number) => {
  // Convert to implied decimal string
  const implied = _internal.decimal_precision_string(number_or_string, precision);
  // Convert to BigInt
  const value = BigInt(implied);
  // Check 64-bit signed integer range
  if (value > MAX_INT64 || value < MIN_INT64) {
    throw new Error('overflow');
  }
  return value;
};

export const to_string64 = (input: any, precision: number) => {
  // Convert to string with implied decimal
  return _internal.decimal_precision_string(String(input), precision);
}; 