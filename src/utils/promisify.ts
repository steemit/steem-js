/**
 * Promisify utility function
 * Converts a callback-based function to a Promise-based one
 * Universal implementation that works in both Node.js and browser
 * 
 * @param fn - Function that uses callback pattern (err, result) => void
 * @returns Promise-based version of the function
 */
export function promisify<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => Promise<unknown> {
  return function(this: unknown, ...args: Parameters<T>): Promise<unknown> {
    return new Promise<unknown>((resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
      fn.apply(this, [...args, (err: unknown, result: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }]);
    });
  };
}

