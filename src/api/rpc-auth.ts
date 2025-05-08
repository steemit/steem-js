import { hash } from '../auth/ecc';

interface RpcRequest {
  method: string;
  params: any[];
  id: number;
}

export function sign(request: RpcRequest, account: string, keys: string[]): any {
  const message = JSON.stringify(request);
  const messageHash = hash.sha256(message);
  const signatures = keys.map(key => {
    // TODO: Implement proper signing with the key
    return 'dummy_signature';
  });

  return {
    ...request,
    signatures
  };
} 