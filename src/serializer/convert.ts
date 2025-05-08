/**
 * Convert implementation to support serializing types.
 */
export class Convert {
  private type: any;

  constructor(type: any) {
    this.type = type;
  }

  toHex(value: any): string {
    if (!this.type || typeof this.type.toHex !== 'function') {
      throw new Error(`Type ${this.type} does not implement toHex method`);
    }
    return this.type.toHex(value);
  }

  fromHex(hex: string): any {
    if (!this.type || typeof this.type.fromHex !== 'function') {
      throw new Error(`Type ${this.type} does not implement fromHex method`);
    }
    return this.type.fromHex(hex);
  }

  fromObject(obj: any): any {
    if (!this.type || typeof this.type.fromObject !== 'function') {
      throw new Error(`Type ${this.type} does not implement fromObject method`);
    }
    return this.type.fromObject(obj);
  }

  toObject(obj: any): any {
    if (!this.type || typeof this.type.toObject !== 'function') {
      throw new Error(`Type ${this.type} does not implement toObject method`);
    }
    return this.type.toObject(obj);
  }
}

// Export a factory function to create Convert instances
export default function(type: any): Convert {
  return new Convert(type);
} 