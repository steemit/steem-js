/**
 * Convert implementation to support serializing types.
 */
export class Convert {
  private type: { toHex?: (value: unknown) => string; fromHex?: (hex: string) => unknown; fromObject?: (obj: unknown) => unknown; toObject?: (value: unknown) => unknown } | null;

  constructor(type: { toHex?: (value: unknown) => string; fromHex?: (hex: string) => unknown; fromObject?: (obj: unknown) => unknown } | null) {
    this.type = type;
  }

  toHex(value: unknown): string {
    if (!this.type || typeof this.type.toHex !== 'function') {
      throw new Error(`Type ${this.type} does not implement toHex method`);
    }
    return this.type.toHex(value);
  }

  fromHex(hex: string): unknown {
    if (!this.type || typeof this.type.fromHex !== 'function') {
      throw new Error(`Type ${this.type} does not implement fromHex method`);
    }
    return this.type.fromHex(hex);
  }

  fromObject(obj: unknown): unknown {
    if (!this.type || typeof this.type.fromObject !== 'function') {
      throw new Error(`Type ${this.type} does not implement fromObject method`);
    }
    return this.type.fromObject(obj);
  }

  toObject(obj: unknown): unknown {
    if (!this.type || typeof this.type.toObject !== 'function') {
      throw new Error(`Type ${this.type} does not implement toObject method`);
    }
    return this.type.toObject(obj);
  }
}

// Export a factory function to create Convert instances
export default function(type: { toHex?: (value: unknown) => string; fromHex?: (hex: string) => unknown; fromObject?: (obj: unknown) => unknown; toObject?: (value: unknown) => unknown } | null): Convert {
  return new Convert(type);
} 