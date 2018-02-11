import each from 'lodash/each';

export class Config {
  constructor(c) {
    each(c, (value, key) => {
      this[key] = value;
    });
  }

  get(k) {
    return this[k];
  }

  set(k, v) {
    this[k] = v;
  }
}

