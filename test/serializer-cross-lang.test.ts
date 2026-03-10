import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serializeTransaction } from '../src/auth/serializer/transaction';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SerializerFixture {
  name: string;
  tx: any;
  expected_hex: string;
}

function loadFixtures(): SerializerFixture[] {
  const dir = path.resolve(__dirname, 'fixtures/serializer');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = JSON.parse(raw) as SerializerFixture;
    return parsed;
  });
}

/** Normalize tx so authority key_auths/account_auths work with serializeTransaction (handles Go object form). */
function normalizeTxForSerialize(tx: any): any {
  if (!tx?.operations) return tx;
  const out = JSON.parse(JSON.stringify(tx));
  for (const op of out.operations) {
    if (!Array.isArray(op) || op.length !== 2) continue;
    const data = op[1];
    if (!data || typeof data !== 'object') continue;
    for (const authKey of ['owner', 'active', 'posting']) {
      const auth = data[authKey];
      if (!auth || typeof auth !== 'object') continue;
      if (auth.key_auths !== undefined) {
        if (!Array.isArray(auth.key_auths)) {
          auth.key_auths = Object.entries(auth.key_auths)
            .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
            .map(([k, v]) => [k, v]);
        } else {
          auth.key_auths = auth.key_auths.filter(
            (x: any) => Array.isArray(x) && x.length >= 2
          );
        }
      }
      if (auth.account_auths !== undefined) {
        if (!Array.isArray(auth.account_auths)) {
          auth.account_auths = Object.entries(auth.account_auths)
            .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
            .map(([k, v]) => [k, v]);
        } else {
          auth.account_auths = auth.account_auths.filter(
            (x: any) => Array.isArray(x) && x.length >= 2
          );
        }
      }
    }
  }
  return out;
}

describe('Cross-lang serializer fixtures (steemutil ↔ steem-js)', () => {
  const fixtures = loadFixtures();

  for (const fixture of fixtures) {
    it(`matches steemutil encoder for ${fixture.name}`, () => {
      const tx = normalizeTxForSerialize(fixture.tx);
      const buf = serializeTransaction(tx);
      const hex = buf.toString('hex');
      expect(hex).toBe(fixture.expected_hex);
    });
  }
});

