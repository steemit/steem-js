// Regression tests for #564: the published .d.ts tree must resolve under
// `moduleResolution: "node16"/"nodenext"`.
//
// The package is `"type": "module"`, so node16/nodenext requires explicit
// file extensions on every relative specifier inside dist/**/*.d.ts.
// Before the fix, extensionless specifiers (`import * as auth from './auth'`)
// made re-exported values fail with TS2305 while everything else silently
// degraded to `any` — and with `skipLibCheck: false` tsc reported TS2834
// from inside node_modules/@steemit/steem-js/dist.
//
// These tests run against the built `dist/` output (CI builds before
// testing). They are skipped when `dist/` is absent so a bare `pnpm test`
// without a prior `pnpm build` still passes locally.

import { describe, it, expect, afterAll } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const distExists = existsSync(join(distDir, 'index.d.ts'));

// Same shape as the rewrite in scripts/fix-dts-imports.mjs: `from '...'`
// (import/export statements) and inline `import('...')` type references,
// restricted to relative specifiers.
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

function walkDeclarationFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkDeclarationFiles(full));
    } else if (entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

// Consumer project compiled with `tsc --init` defaults for a modern ESM
// setup — exactly the configuration broken in #564.
const consumerFixture = `import { steem, Api, sha256, ripemd160, signRequest, validateRequest } from '@steemit/steem-js';
import type { Operation, Transaction } from '@steemit/steem-js';

export { ripemd160, signRequest, validateRequest };
export type { Operation, Transaction };

// Deliberate type mismatches: with healthy declarations each line below is
// exactly one TS2322. If an import silently degrades to \`any\` (the #564
// failure mode), its assignment compiles and the missing TS2322 exposes it.
export const apiInstanceIsTyped: symbol = steem.api;
export const apiClassIsTyped: symbol = Api;
export const sha256IsTyped: symbol = sha256;
`;

const consumerTsconfig = `{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": false
  },
  "files": ["repro.ts"]
}
`;

describe.skipIf(!distExists)('published declarations under moduleResolution nodenext (#564)', () => {
  const tmpDirs: string[] = [];

  afterAll(() => {
    for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
  });

  it('leaves no extensionless relative specifier in dist/**/*.d.ts', () => {
    const offenders: string[] = [];
    for (const file of walkDeclarationFiles(distDir)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(SPECIFIER_RE)) {
        if (!/\.js$/.test(match[3])) {
          offenders.push(`${file}: '${match[3]}'`);
        }
      }
    }
    expect(offenders, `extensionless relative specifiers survived the build:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('resolves the package with real (non-any) types from a nodenext consumer project', { timeout: 120_000 }, () => {
    const tmp = mkdtempSync(join(tmpdir(), 'steem-js-nodenext-'));
    tmpDirs.push(tmp);

    // Simulate an installed consumer: node_modules/@steemit/steem-js -> repo.
    mkdirSync(join(tmp, 'node_modules', '@steemit'), { recursive: true });
    symlinkSync(repoRoot, join(tmp, 'node_modules', '@steemit', 'steem-js'), 'dir');
    writeFileSync(join(tmp, 'package.json'), '{"type":"module"}\n');
    writeFileSync(join(tmp, 'tsconfig.json'), consumerTsconfig);
    writeFileSync(join(tmp, 'repro.ts'), consumerFixture);

    const tsc = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    const result = spawnSync(process.execPath, [tsc, '-p', join(tmp, 'tsconfig.json')], {
      encoding: 'utf8',
      timeout: 120_000,
    });

    const errors = (result.stdout + result.stderr)
      .split('\n')
      .filter((line) => line.includes(': error TS'));

    // The failure modes from #564 must be gone entirely:
    // TS2305 re-exports missing, TS2834 extensionless relative imports
    // inside our declarations, TS2307 module not found.
    for (const code of ['TS2305', 'TS2834', 'TS2307']) {
      expect(
        errors.filter((e) => e.includes(code)),
        `${code} leaked into the consumer build:\n${errors.join('\n')}`
      ).toEqual([]);
    }
    // No diagnostic may originate from inside our published declarations.
    expect(
      errors.filter((e) => e.includes(join('steem-js', 'dist'))),
      `errors reported inside dist declarations:\n${errors.join('\n')}`
    ).toEqual([]);

    // Exactly the three deliberate mismatches from the fixture: proves
    // steem.api / Api / sha256 carry real types instead of `any`.
    expect(errors.filter((e) => e.includes('TS2322')).length).toBe(3);
    expect(errors.length).toBe(3);
  });
});
