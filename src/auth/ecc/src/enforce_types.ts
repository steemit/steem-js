type TypeName = 'Array' | 'Boolean' | 'Buffer' | 'Number' | 'String' | { new(...args: unknown[]): unknown };

export default function enforce(type: TypeName, value: unknown): void {
    switch (type) {
        case 'Array': {
            if (Array.isArray(value)) return;
            break;
        }

        case 'Boolean': {
            if (typeof value === 'boolean') return;
            break;
        }

        case 'Buffer': {
            if (Buffer.isBuffer(value)) return;
            break;
        }

        case 'Number': {
            if (typeof value === 'number') return;
            break;
        }

        case 'String': {
            if (typeof value === 'string') return;
            break;
        }

        default: {
            if (typeof type === 'function' && value != null && typeof value === 'object' && 'constructor' in value && getName(value.constructor as Function) === getName(type)) return;
        }
    }

    throw new TypeError('Expected ' + (typeof type === 'function' ? getName(type) : type) + ', got ' + String(value));
}

function getName(fn: Function): string | null {
    const match = fn.toString().match(/function (.*?)\(/);
    return match ? match[1] : null;
} 