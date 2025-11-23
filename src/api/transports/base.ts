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

  listenTo(target: EventEmitter, eventName: string, callback: (...args: any[]) => void): () => void {
    if ('addEventListener' in target && typeof (target as any).addEventListener === 'function') {
      (target as any).addEventListener(eventName, callback);
      return () => {
        (target as any).removeEventListener(eventName, callback);
      };
    } else {
      target.on(eventName, callback);
      return () => {
        target.removeListener(eventName, callback);
      };
    }
  }

  send(_api: string, _data: any, _callback: (error: any, result?: any) => void): void {
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