import { describe, it, expect } from 'vitest';
import { error } from './test_helper';
import * as serializer from '../src/serializer';
import Long from 'long';

const Convert = serializer.convert;
const type = serializer.types;
const p = serializer.precision;

const overflow = (f: () => void) => error('overflow', f);

describe('steem.auth: types', () => {
  it('vote_id', () => {
    const toHex = (id: string) => {
      const vote = type.vote_id.fromObject(id);
      return Convert(type.vote_id).toHex(vote);
    };
    expect(toHex('255:0')).toBe('ff000000');
    expect(toHex('0:' + 0xffffff)).toBe('00ffffff');
    const out_of_range = (id: string) => {
      try {
        toHex(id);
        expect(false).toBe(true); // should have been out of range
      } catch (e: any) {
        expect(e.message.includes('out of range')).toBe(true);
      }
    };
    out_of_range('0:' + (0xffffff + 1));
    out_of_range('256:0');
  });

  it('set sort', () => {
    const bool_set = type.set(type.bool);
    expect(Convert(bool_set).toHex([1, 0])).toBe('020001');
    try {
      Convert(bool_set).toHex([1, 1]);
    } catch (e: any) {
      console.log('set sort duplicate error:', e.message);
      error('duplicate (set)', () => { throw e; });
    }
  });

  it('string sort', () => {
    const setType = type.set(type.string);
    const set = setType.fromObject(['a', 'z', 'm']);
    const setObj = setType.toObject(set);
    expect(setObj).toEqual(['a', 'm', 'z']);
  });

  it('map sort', () => {
    const bool_map = type.map(type.bool, type.bool);
    expect(Convert(bool_map).toHex([[1, 1], [0, 0]])).toBe('0200000101');
    try {
      Convert(bool_map).toHex([[1, 1], [1, 1]]);
    } catch (e: any) {
      console.log('map sort duplicate error:', e.message);
      error('duplicate (map)', () => { throw e; });
    }
  });

  it('public_key sort', () => {
    const mapType = type.map(type.public_key, type.uint16);
    const map = mapType.fromObject([
      ['STM8me6d9PqzTgcoHxx6b4rnvWVTqz11kafidRAZwfacJkcJtfd75', 0],
      ['STM56ankGHKf6qUsQe7vPsXTSEqST6Dt1ff73aV3YQbedzRua8NLQ', 0],
    ]);
    const mapObject = mapType.toObject(map);
    expect(mapObject).toEqual([
      ['STM56ankGHKf6qUsQe7vPsXTSEqST6Dt1ff73aV3YQbedzRua8NLQ', 0],
      ['STM8me6d9PqzTgcoHxx6b4rnvWVTqz11kafidRAZwfacJkcJtfd75', 0],
    ]);
  });

  it('type_id sort', () => {
    const t = type.map(type.protocol_id_type('account'), type.uint16);
    expect(t.fromObject([[1, 1], [0, 0]])).toEqual([[0, 0], [1, 1]]);
    expect(t.fromObject([[0, 0], [1, 1]])).toEqual([[0, 0], [1, 1]]);
  });

  it('precision number strings', () => {
    const check = (input_string: string, precision: number, output_string: string) => {
      expect(
        p._internal.decimal_precision_string(input_string, precision)
      ).toBe(output_string);
    };
    check('12345678901234567890123456789012345678901234567890.12345', 5, '1234567890123456789012345678901234567890123456789012345');
    check('', 0, '0');
    check('0', 0, '0');
    check('-0', 0, '0');
    check('-00', 0, '0');
    check('-0.0', 0, '0');
    check('-', 0, '0');
    check('1', 0, '1');
    check('11', 0, '11');
    overflow(() => check('.1', 0, ''));
    overflow(() => check('-.1', 0, ''));
    overflow(() => check('0.1', 0, ''));
    overflow(() => check('1.1', 0, ''));
    overflow(() => check('1.11', 1, ''));
    check('', 1, '00');
    check('1', 1, '10');
    check('1.1', 1, '11');
    check('-1', 1, '-10');
    check('-1.1', 1, '-11');
  });

  it('precision number long', () => {
    let _precision: number | undefined;
    expect(Long.MAX_VALUE.toString()).toBe(Long.MAX_VALUE.toString());
    overflow(() => p.to_bigint64('9223372036854775808', _precision = 0));
    expect(p.to_string64(Long.ZERO, 0)).toBe('0');
    expect(p.to_string64(Long.ZERO, 1)).toBe('00');
    overflow(() => p.to_bigint64('92233720368547758075', _precision = 1));
  });
}); 