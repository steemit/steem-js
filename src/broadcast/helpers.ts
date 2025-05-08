import { operations, Operation } from './operations';

export interface BroadcastOptions {
    roles: string[];
    operation: string;
    params: any[];
}

export function getOperation(operation: string): Operation | undefined {
    return operations.find(op => op.operation === operation);
}

export function validateOperation(options: BroadcastOptions): void {
    const operation = getOperation(options.operation);
    if (!operation) {
        throw new Error(`Operation ${options.operation} not found`);
    }

    if (options.params.length !== operation.params.length) {
        throw new Error(`Operation ${options.operation} requires ${operation.params.length} parameters, got ${options.params.length}`);
    }

    const hasRequiredRole = options.roles.some(role => operation.roles.includes(role));
    if (!hasRequiredRole) {
        throw new Error(`Operation ${options.operation} requires one of the following roles: ${operation.roles.join(', ')}`);
    }
}

export function createOperation(options: BroadcastOptions): [string, any[]] {
    validateOperation(options);
    return [options.operation, options.params];
}

export function createTransaction(operations: [string, any[]][]): any {
    return {
        ref_block_num: 0,
        ref_block_prefix: 0,
        expiration: new Date(Date.now() + 60000).toISOString().slice(0, -5),
        operations: operations,
        extensions: []
    };
}

export function createSignedTransaction(transaction: any, signatures: string[]): any {
    return {
        ...transaction,
        signatures: signatures
    };
} 