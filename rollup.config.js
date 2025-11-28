import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import inject from '@rollup/plugin-inject';
import terser from '@rollup/plugin-terser';

// Helper function to create browser ESM build configuration
function createBrowserEsmConfig() {
  const plugins = [
    alias({
      entries: [
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'events', replacement: 'events' },
        { find: 'assert', replacement: 'assert' },
        { find: 'buffer', replacement: 'buffer' },
        { find: 'util', replacement: 'util' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'process', replacement: 'process/browser' },
        { find: 'async_hooks', replacement: './src/polyfills/async-hooks-browser.ts' }
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

  return {
    input: 'src/umd.ts',
    output: {
      file: 'dist/index.browser.js',
      format: 'es',
      sourcemap: true,
      exports: 'default',
      inlineDynamicImports: true
    },
    plugins,
    external: [],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      // Filter out circular dependency warnings from third-party libraries (not our code issues)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        const thirdPartyLibs = ['readable-stream', 'brorand', 'crypto-browserify', 'elliptic', 'asn1.js', 'diffie-hellman', 'miller-rabin', 'browserify-sign', 'assert'];
        if (thirdPartyLibs.some(lib => warning.message?.includes(lib))) {
          return;
        }
      }
      warn(warning);
    }
  };
}

// Helper function to create UMD build configuration
function createUmdConfig(minified = false) {
  const filename = minified ? 'dist/index.umd.min.js' : 'dist/index.umd.js';
  const plugins = [
    alias({
      entries: [
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'events', replacement: 'events' },
        { find: 'assert', replacement: 'assert' },
        { find: 'buffer', replacement: 'buffer' },
        { find: 'util', replacement: 'util' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'process', replacement: 'process/browser' },
        { find: 'async_hooks', replacement: './src/polyfills/async-hooks-browser.ts' }
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
      inlineDynamicImports: true,
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
    
    // Buffer polyfill - provide immediately
    if (typeof globalThis.Buffer === 'undefined') {
      globalThis.Buffer = {
        from: function(data, encoding) {
          if (typeof data === 'string') {
            if (encoding === 'hex') {
              const bytes = new Uint8Array(data.length / 2);
              for (let i = 0; i < data.length; i += 2) {
                bytes[i / 2] = parseInt(data.substr(i, 2), 16);
              }
              return bytes;
            } else if (encoding === 'binary') {
              const bytes = new Uint8Array(data.length);
              for (let i = 0; i < data.length; i++) {
                bytes[i] = data.charCodeAt(i) & 0xff;
              }
              return bytes;
            }
            return new TextEncoder().encode(data);
          }
          return new Uint8Array(data);
        },
        alloc: function(size, fill) {
          const buf = new Uint8Array(size);
          if (fill !== undefined) buf.fill(fill);
          return buf;
        },
        concat: function(buffers) {
          const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const buf of buffers) {
            result.set(buf, offset);
            offset += buf.length;
          }
          return result;
        },
        isBuffer: function(obj) {
          return obj instanceof Uint8Array;
        }
      };
      
      // Add Buffer methods to Uint8Array prototype for compatibility
      if (!Uint8Array.prototype.toString) {
        Uint8Array.prototype.toString = function(encoding) {
          if (encoding === 'hex') {
            return Array.from(this).map(b => b.toString(16).padStart(2, '0')).join('');
          } else if (encoding === 'binary') {
            return Array.from(this).map(b => String.fromCharCode(b)).join('');
          }
          return new TextDecoder().decode(this);
        };
      }
      
      if (!Uint8Array.prototype.readUInt8) {
        Uint8Array.prototype.readUInt8 = function(offset) {
          return this[offset];
        };
      }
      
      if (!Uint8Array.prototype.writeUInt8) {
        Uint8Array.prototype.writeUInt8 = function(value, offset) {
          this[offset] = value & 0xff;
        };
      }
      
      if (!Uint8Array.prototype.readUInt32LE) {
        Uint8Array.prototype.readUInt32LE = function(offset) {
          return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24)) >>> 0;
        };
      }
      
      if (!Uint8Array.prototype.slice) {
        Uint8Array.prototype.slice = function(start, end) {
          return new Uint8Array(Array.prototype.slice.call(this, start, end));
        };
      }
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
      // Filter out circular dependency warnings from third-party libraries (not our code issues)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        const thirdPartyLibs = ['readable-stream', 'brorand', 'crypto-browserify', 'elliptic', 'asn1.js', 'diffie-hellman', 'miller-rabin', 'browserify-sign', 'assert'];
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
        },
        inlineDynamicImports: true
      },
      // CommonJS for Node.js require()
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true
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
    external: [
      'axios',
      'secure-random',
      // Node.js built-in modules - should not be bundled
      'events',
      'crypto',
      'assert',
      'buffer',
      'util',
      'stream',
      'http',
      'https',
      'net',
      'tls',
      'url',
      'zlib',
      'async_hooks',
      'ws'
    ],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL' && warning.id?.includes('bluebird')) {
        return;
      }
      // Filter out circular dependency warnings from third-party libraries (not our code issues)
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        const thirdPartyLibs = ['readable-stream', 'brorand', 'crypto-browserify', 'elliptic', 'asn1.js', 'diffie-hellman', 'miller-rabin', 'browserify-sign', 'assert'];
        if (thirdPartyLibs.some(lib => warning.message?.includes(lib))) {
          return;
        }
      }
      warn(warning);
    }
  },
  // Browser ESM build (for modern bundlers in browser environment)
  createBrowserEsmConfig(),
  // Browser builds (UMD)
  createUmdConfig(false), // Regular UMD build
  createUmdConfig(true)   // Minified UMD build
]; 