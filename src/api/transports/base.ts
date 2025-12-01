import { EventEmitter } from 'events';
import { Transport, TransportOptions } from './types';

export class BaseTransport extends EventEmitter implements Transport {
  options: TransportOptions;
  id: number = 0;

  constructor(options: TransportOptions = {}) {
    super();
    this.options = options;
    this.id = 0;
  }

  setOptions(options: TransportOptions): void {
    Object.assign(this.options, options);
    this.stop();
  }

  listenTo(target: EventEmitter, eventName: string, callback: (...args: unknown[]) => void): () => void {
    const targetWithAddEventListener = target as EventEmitter & { addEventListener?: (event: string, callback: (...args: unknown[]) => void) => void; removeEventListener?: (event: string, callback: (...args: unknown[]) => void) => void };
    if ('addEventListener' in target && typeof targetWithAddEventListener.addEventListener === 'function') {
      targetWithAddEventListener.addEventListener(eventName, callback);
      return () => {
        if (targetWithAddEventListener.removeEventListener) {
          targetWithAddEventListener.removeEventListener(eventName, callback);
        }
      };
    } else {
      target.on(eventName, callback);
      return () => {
        target.removeListener(eventName, callback);
      };
    }
  }

  send(_api: string, _data: unknown, _callback: (error: Error | null, result?: unknown) => void): void {
    // Base implementation - should be overridden by subclasses
  }

  start(): Promise<void> {
    // Base implementation - should be overridden by subclasses
    return Promise.resolve();
  }

  stop(): Promise<void> {
    // Base implementation - should be overridden by subclasses
    return Promise.resolve();
  }
}

export default BaseTransport; 