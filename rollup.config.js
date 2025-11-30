import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import inject from '@rollup/plugin-inject';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

// Helper function to create UMD build configuration
function createUmdConfig(minified = false) {
  const filename = minified ? 'dist/index.umd.min.js' : 'dist/index.umd.js';
  const plugins = [
    inject({
      process: 'process/browser',
      preventAssignment: false
    }),
    alias({
      entries: [
        { find: 'events', replacement: 'events' },
        { find: 'assert', replacement: 'assert' },
        { find: 'buffer', replacement: 'buffer' },
        { find: 'util', replacement: 'util' }
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
  ];

  // Add terser for minified version
  if (minified) {
    plugins.push(terser({
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug'] // Remove console.debug calls
      },
      mangle: {
        reserved: ['steem'] // Don't mangle the global name
      },
      format: {
        comments: false // Remove comments
      }
    }));
  }

  return {
    input: 'src/umd.ts',
    output: {
      file: filename,
      format: 'umd',
      name: 'steem',
      sourcemap: true,
      exports: 'default',
      banner: `(function() {
  // Provide minimal polyfills for browser
  if (typeof globalThis !== 'undefined') {
    // Process polyfill
    if (typeof globalThis.process === 'undefined') {
      globalThis.process = {
        browser: true,
        env: {},
        version: '',
        versions: {},
        nextTick: function(fn) { setTimeout(fn, 0); },
        exit: function() {},
        cwd: function() { return '/'; },
        platform: 'browser'
      };
    }
  }
})();`,
      globals: {}
    },
    plugins,
    external: [],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      // Filter out "Could not resolve" warnings for @noble packages (they are resolved by commonjs plugin)
      if (warning.message?.includes('Could not resolve import') && warning.message?.includes('@noble/')) {
        return;
      }
      // Filter out "Unresolved dependencies" warnings for @noble packages (they are bundled by commonjs plugin)
      if (warning.code === 'UNRESOLVED_IMPORT') {
        const noblePackages = ['@noble/hashes', '@noble/ciphers'];
        if (noblePackages.some(pkg => warning.source?.includes(pkg) || (warning.message && warning.message.includes(pkg)))) {
          return;
        }
      }
      // Filter out "Missing global variable names" warnings for @noble packages (they are bundled by commonjs plugin)
      if (warning.code === 'MISSING_GLOBAL_NAME' && warning.message?.includes('@noble/')) {
        return;
      }
      // Filter out circular dependency warnings from third-party libraries (not our code issues)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        const thirdPartyLibs = ['readable-stream', 'brorand', 'elliptic', 'asn1.js', 'diffie-hellman', 'miller-rabin', 'browserify-sign', 'assert'];
        if (thirdPartyLibs.some(lib => warning.message?.includes(lib))) {
          return;
        }
      }
      warn(warning);
    }
  };
}

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
    external: [],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      // Filter out "Could not resolve" warnings for @noble packages (they are resolved by commonjs plugin)
      if (warning.message?.includes('Could not resolve import') && warning.message?.includes('@noble/')) {
        return;
      }
      // Filter out "Unresolved dependencies" warnings for @noble packages (they are bundled by commonjs plugin)
      if (warning.code === 'UNRESOLVED_IMPORT') {
        const noblePackages = ['@noble/hashes', '@noble/ciphers'];
        if (noblePackages.some(pkg => warning.source?.includes(pkg) || (warning.message && warning.message.includes(pkg)))) {
          return;
        }
      }
      // Filter out circular dependency warnings from third-party libraries (not our code issues)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        const thirdPartyLibs = ['readable-stream', 'brorand', 'elliptic', 'asn1.js', 'diffie-hellman', 'miller-rabin', 'browserify-sign', 'assert'];
        if (thirdPartyLibs.some(lib => warning.message?.includes(lib))) {
          return;
        }
      }
      // Filter out "Missing global variable names" warnings for @noble packages (they are bundled, not external)
      if (warning.code === 'MISSING_GLOBAL_NAME' && warning.message?.includes('@noble/')) {
        return;
      }
      warn(warning);
    }
  },
  // Browser ES Module build (for modern bundlers like Vite, Webpack 5)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/browser.esm.js',
      format: 'es',
      sourcemap: true,
      generatedCode: {
        constBindings: true
      },
      banner: `// Process polyfill for browser
(function() {
  var g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
  var proc = { browser: true, env: {}, version: '', versions: {}, nextTick: function(fn) { setTimeout(fn, 0); }, exit: function() {}, cwd: function() { return '/'; }, platform: 'browser' };
  g.process = proc;
  // Define process on globalThis for ES modules
  if (typeof globalThis !== 'undefined') {
    try {
      Object.defineProperty(globalThis, 'process', { value: proc, writable: true, configurable: true });
    } catch(e) {
      globalThis.process = proc;
    }
  }
})();`
    },
    plugins: [
      replace({
        // Replace require('crypto') calls in browser builds to prevent Vite from externalizing crypto
        // This ensures the code path is never executed in browsers
        preventAssignment: true,
        delimiters: ['', ''],
        values: {
          "typeof require !== 'undefined' ? require('crypto') : null": 'null',
          'typeof require !== "undefined" ? require("crypto") : null': 'null',
          "require('crypto')": 'null',
          'require("crypto")': 'null'
        }
      }),
      inject({
        process: 'process/browser',
        preventAssignment: false
      }),
      alias({
        entries: [
          { find: 'events', replacement: 'events' },
          { find: 'assert', replacement: 'assert' },
          { find: 'buffer', replacement: 'buffer' },
          { find: 'util', replacement: 'util' }
        ]
      }),
      resolve({
        preferBuiltins: false,
        browser: true,
      }),
      commonjs({
        transformMixedEsModules: true,
        strictRequires: true
      }),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true
      })
    ],
    external: [], // Bundle everything for browser (crypto require is replaced with null)
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      // Filter out "Could not resolve" warnings for @noble packages (they are resolved by commonjs plugin)
      if (warning.message?.includes('Could not resolve import') && warning.message?.includes('@noble/')) {
        return;
      }
      // Filter out "Unresolved dependencies" warnings for @noble packages (they are bundled by commonjs plugin)
      if (warning.code === 'UNRESOLVED_IMPORT') {
        const noblePackages = ['@noble/hashes', '@noble/ciphers'];
        if (noblePackages.some(pkg => warning.source?.includes(pkg) || (warning.message && warning.message.includes(pkg)))) {
          return;
        }
      }
      // Filter out "Missing global variable names" warnings for @noble packages (they are bundled by commonjs plugin)
      if (warning.code === 'MISSING_GLOBAL_NAME' && warning.message?.includes('@noble/')) {
        return;
      }
      // Filter out circular dependency warnings from third-party libraries (not our code issues)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        const thirdPartyLibs = ['readable-stream', 'brorand', 'elliptic', 'asn1.js', 'diffie-hellman', 'miller-rabin', 'browserify-sign', 'assert'];
        if (thirdPartyLibs.some(lib => warning.message?.includes(lib))) {
          return;
        }
      }
      warn(warning);
    }
  },
  // Browser builds (UMD)
  createUmdConfig(false), // Regular UMD build
  createUmdConfig(true)   // Minified UMD build
];
