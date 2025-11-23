type TypeName = 'Array' | 'Boolean' | 'Buffer' | 'Number' | 'String' | { new(...args: any[]): any };

export default function enforce(type: TypeName, value: any): void {
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
            if (typeof type === 'function' && getName(value.constructor) === getName(type)) return;
        }
    }

    throw new TypeError('Expected ' + (typeof type === 'function' ? getName(type) : type) + ', got ' + value);
}

function getName(fn: Function): string | null {
    const match = fn.toString().match(/function (.*?)\(/);
    return match ? match[1] : null;
} 