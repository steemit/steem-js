import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';

export default [
  // Server-side builds (Node.js)
  {
    input: 'src/index.ts',
    output: [
      // ES Module for modern bundlers and Node.js
      {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true,
        generatedCode: {
          constBindings: true
        }
      },
      // CommonJS for Node.js require()
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
        browser: false
      }),
      commonjs({
        transformMixedEsModules: true,
        strictRequires: true,
        esmExternals: true
      }),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true
      })
    ],
    external: ['axios', 'crypto-js'],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      warn(warning);
    }
  },
  // Browser build (UMD)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'steem',
      sourcemap: true,
      globals: {
        'crypto-js': 'CryptoJS',
        'url': 'url',
        'http': 'http',
        'https': 'https',
        'net': 'net',
        'tls': 'tls',
        'zlib': 'zlib'
      }
    },
    plugins: [
      alias({
        entries: [
          { find: 'crypto', replacement: 'crypto-browserify' },
          { find: 'events', replacement: 'events' },
          { find: 'assert', replacement: 'assert' },
          { find: 'buffer', replacement: 'buffer' },
          { find: 'util', replacement: 'util' },
          { find: 'stream', replacement: 'stream-browserify' }
        ]
      }),
      resolve({
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true
      })
    ],
    external: [
      'crypto-js',
      'url',
      'http',
      'https',
      'net',
      'tls',
      'zlib'
    ],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      warn(warning);
    }
  }
]; 