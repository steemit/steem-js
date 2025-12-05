import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import inject from '@rollup/plugin-inject';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

// Helper function to create UMD build configuration
function createUmdConfig(minified = false) {
  const filename = minified ? 'dist/index.umd.min.js' : 'dist/index.umd.js';
  const plugins = [
    replace({
      __VERSION__: version,
      preventAssignment: true
    }),
    inject({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
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
  var g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
  
    // Process polyfill
  if (typeof g.process === 'undefined') {
    g.process = {
        browser: true,
        env: {},
        version: '',
        versions: {},
        nextTick: function(fn) { setTimeout(fn, 0); },
        exit: function() {},
        cwd: function() { return '/'; },
        platform: 'browser'
      };
    if (typeof globalThis !== 'undefined') {
      globalThis.process = g.process;
    }
  }
  // Buffer will be set in outro after all modules are loaded
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
      replace({
        __VERSION__: version,
        preventAssignment: true
      }),
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
      banner: `// Process polyfill and CommonJS exports for browser
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
  // Define exports for util module that uses top-level exports.*
  // This is a fallback for modules that Rollup's commonjs plugin doesn't fully transform
  if (typeof exports === 'undefined') {
    try {
      Object.defineProperty(g, 'exports', { value: {}, writable: true, configurable: true });
    } catch(e) {
      g.exports = {};
    }
  }
})();
// Define utilExports in global scope for replace plugin (exports.format -> utilExports.format)
var utilExports = typeof globalThis !== 'undefined' ? (globalThis.utilExports || (globalThis.utilExports = {})) : (typeof window !== 'undefined' ? (window.utilExports || (window.utilExports = {})) : {});
// Buffer will be set in src/index.ts after importing buffer module
// The inject plugin will replace Buffer references with buffer.Buffer in the code
`
    },
    plugins: [
      replace({
        __VERSION__: version,
        preventAssignment: true
      }),
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
      replace({
        // Fix util module exports that are not properly transformed by commonjs plugin
        // This replaces top-level exports.* references that appear outside of IIFE wrappers
        preventAssignment: false,
        delimiters: ['\\b', '\\b'],
        values: {
          'exports.format': 'utilExports.format',
          'exports.inspect': 'utilExports.inspect'
        }
      }),
      inject({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
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
        strictRequires: true,
        requireReturnsDefault: 'auto',
        defaultIsModuleExports: 'auto',
        esmExternals: true
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
