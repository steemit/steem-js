/**
 * 向 < 10 的整形数值进行补 0
 * @param {number} n
 * @returns {string}
 */
export function padZero(n: number): string {
  if (!Number.isInteger(n)) {
    return String(n);
  }
  return n < 10 ? `0${n}` : String(n);
}
