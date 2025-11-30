interface SteemConfig {
  node?: string;
  nodes?: string[];
  uri?: string;
  address_prefix?: string;
  chain_id?: string;
  debug?: boolean;
  debug_warnings?: boolean;
}

export class Config {
  private config: { [key: string]: unknown } = {};

  get(key: string): unknown {
    return this.config[key];
  }

  getBoolean(key: string): boolean {
    const value = this.get(key);
    return !!value;
  }

  getNumber(key: string): number {
    const value = this.get(key);
    return typeof value === 'number' ? value : parseFloat(String(value));
  }

  getString(key: string): string {
    const value = this.get(key);
    return typeof value === 'string' ? value : String(value);
  }

  set(key: string, value: unknown): void {
    this.config[key] = value;
  }

  all(): { [key: string]: unknown } {
    return { ...this.config };
  }
}

const DEFAULT_CONFIG: SteemConfig = {
  address_prefix: 'STM',
  chain_id: '0000000000000000000000000000000000000000000000000000000000000000',
  // Default API endpoint: api.steemit.com
  node: 'https://api.steemit.com',
  nodes: [
    'https://api.steemit.com'
  ],
  uri: 'https://api.steemit.com'
};

// Singleton config instance
const config: Config = new Config();
Object.entries(DEFAULT_CONFIG).forEach(([k, v]) => config.set(k, v));

export const getConfig = () => config;

export const setConfig = (newConfig: Partial<SteemConfig>): void => {
  Object.entries(newConfig).forEach(([k, v]) => config.set(k, v));
};

export const resetConfig = (): void => {
  Object.entries(DEFAULT_CONFIG).forEach(([k, v]) => config.set(k, v));
};

// Alias for setConfig to match the API's setOptions
export const setOptions = setConfig;

export function get(key: string): unknown {
  return config.get(key);
} 