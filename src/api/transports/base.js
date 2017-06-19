import Promise from 'bluebird';
import EventEmitter from 'events';
import each from 'lodash/each';

export default class Transport extends EventEmitter {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.id = 0;
  }

  setOptions(options) {
    each(options, (value, key) => {
      this.options[key] = value;
    });
    this.stop();
  }

  listenTo(target, eventName, callback) {
    if (target.addEventListener) target.addEventListener(eventName, callback);
    else target.on(eventName, callback);

    return () => {
      if (target.removeEventListener)
        target.removeEventListener(eventName, callback);
      else target.removeListener(eventName, callback);
    };
  }

  send() {}
  start() {}
  stop() {}
}

Promise.promisifyAll(Transport.prototype);
