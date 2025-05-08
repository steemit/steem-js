export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const flatten = <T>(array: T[][]): T[] => {
  return array.reduce((acc, val) => acc.concat(val), []);
};

export const isValidAddress = (address: string): boolean => {
  return /^[1-5a-z]{1,12}$/.test(address);
};

export const isValidAmount = (amount: string): boolean => {
  return /^\d+\.\d{3}\s(STEEM|SBD)$/.test(amount);
};

export const isValidPermlink = (permlink: string): boolean => {
  return /^[a-z0-9-]+$/.test(permlink);
}; 