import { operations, Operation } from './operations';

export interface BroadcastOptions {
    roles: string[];
    operation: string;
    params: unknown[];
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

export function createOperation(options: BroadcastOptions): [string, unknown[]] {
    validateOperation(options);
    return [options.operation, options.params];
}

export function createTransaction(operations: [string, unknown[]][]): { ref_block_num: number; ref_block_prefix: number; expiration: string; operations: [string, unknown[]][]; extensions: unknown[] } {
    return {
        ref_block_num: 0,
        ref_block_prefix: 0,
        expiration: new Date(Date.now() + 60000).toISOString().slice(0, -5),
        operations: operations,
        extensions: []
    };
}

export function createSignedTransaction(transaction: { ref_block_num: number; ref_block_prefix: number; expiration: string; operations: [string, unknown[]][]; extensions: unknown[] }, signatures: string[]): { ref_block_num: number; ref_block_prefix: number; expiration: string; operations: [string, unknown[]][]; extensions: unknown[]; signatures: string[] } {
    return {
        ...transaction,
        signatures: signatures
    };
} 