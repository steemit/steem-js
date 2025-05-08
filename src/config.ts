interface SteemConfig {
  node?: string;
  nodes?: string[];
  uri?: string;
  websocket?: string;
  address_prefix?: string;
  chain_id?: string;
}

export class Config {
  private config: { [key: string]: any } = {};

  get(key: string): any {
    return this.config[key];
  }

  getBoolean(key: string): boolean {
    const value = this.get(key);
    return !!value;
  }

  getNumber(key: string): number {
    const value = this.get(key);
    return typeof value === 'number' ? value : parseFloat(value);
  }

  getString(key: string): string {
    const value = this.get(key);
    return typeof value === 'string' ? value : String(value);
  }

  set(key: string, value: any): void {
    this.config[key] = value;
  }

  all(): { [key: string]: any } {
    return { ...this.config };
  }
}

const DEFAULT_CONFIG: SteemConfig = {
  address_prefix: 'STM',
  chain_id: '0000000000000000000000000000000000000000000000000000000000000000',
  node: 'https://api.steemit.com',
  nodes: [
    'https://api.steemit.com'
  ],
  uri: 'https://api.steemit.com',
  websocket: 'wss://api.steemit.com'
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

export function get(key: string): any {
  return config.get(key);
} 