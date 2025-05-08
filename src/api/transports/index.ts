import { HttpTransport } from './http';
import { WsTransport } from './ws';
export * from './types';

export const transports = {
  http: HttpTransport,
  ws: WsTransport
}; 