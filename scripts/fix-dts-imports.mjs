#!/usr/bin/env node
// Post-build step: rewrite extensionless relative module specifiers in the
// emitted .d.ts files so they resolve under `moduleResolution: "node16"` /
// `"nodenext"` (#564).
//
// Why this is needed: the package ships `"type": "module"`, so TypeScript
// treats dist/**/*.d.ts as ES module declarations. Under node16/nodenext
// (the `tsc --init` default), relative imports in ESM must carry explicit
// file extensions. The declarations are emitted per source file by
// @rollup/plugin-typescript with the source's extensionless specifiers
// (`import * as auth from './auth'`), which then fail to resolve:
// re-exported values (sha256, ripemd160, ...) error with TS2305 while
// everything else silently falls back to `any`.
//
// The runtime bundles are single-file (dist/index.js etc.) and contain no
// internal relative imports, so only the declaration tree needs fixing.
// Rewriting to explicit `.js` paths keeps every other moduleResolution mode
// working: TypeScript substitutes `.js` -> `.ts`/`.d.ts` in `node`,
// `node16`, `nodenext` and `bundler` alike.
//
// Resolution rules for a specifier S relative to declaration file F:
//   - if <F-dir>/S.d.ts exists      -> S + '.js'
//   - else if <F-dir>/S/index.d.ts  -> S + '/index.js'
//   - else the specifier is left as-is and reported (build fails loudly
//     instead of shipping broken types).

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const distDir = resolve(process.argv[2] ?? 'dist');

// Matches both `... from './x'` / `... from "./x"` (import & export statements)
// and inline type references `import('./x')` / `import("./x")`, capturing the
// specifier only when it is relative (./ or ../).
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

function walkDeclarationFiles(dir) {
  const out = [];
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

function resolveExtension(fromFile, specifier) {
  if (/\.js$/.test(specifier)) return null; // already explicit
  const base = resolve(dirname(fromFile), specifier);
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(base, 'index.d.ts'))) return `${specifier}/index.js`;
  return undefined; // unresolvable
}

const files = existsSync(distDir)
  ? walkDeclarationFiles(distDir)
  : [];
if (files.length === 0) {
  console.error(`fix-dts-imports: no .d.ts files found under ${distDir}`);
  process.exit(1);
}

let totalRewrites = 0;
const unresolved = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let rewritten = source;
  SPECIFIER_RE.lastIndex = 0;
  for (const match of source.matchAll(SPECIFIER_RE)) {
    const specifier = match[3];
    const replacement = resolveExtension(file, specifier);
    if (replacement === null) continue;
    if (replacement === undefined) {
      unresolved.push(`${file}: '${specifier}'`);
      continue;
    }
    // Replace only this occurrence; specifiers are short and files are small,
    // so a global split/join is fine and avoids regex-escaping pitfalls.
    rewritten = rewritten.split(match[0]).join(match[1] + match[2] + replacement + match[2]);
    totalRewrites += 1;
  }
  if (rewritten !== source) {
    writeFileSync(file, rewritten);
  }
}

if (unresolved.length > 0) {
  console.error('fix-dts-imports: could not resolve these relative specifiers to a declaration file:');
  for (const line of unresolved) console.error(`  ${line}`);
  process.exit(1);
}

console.log(`fix-dts-imports: rewrote ${totalRewrites} relative specifier(s) across ${files.length} declaration file(s) in ${distDir}`);
