import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';

export default defineConfig([
  // ESM config
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.mjs',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      del({ targets: 'dist/*' }), 
      typescript(),
      nodeResolve(),
      commonjs(),
      terser(),
    ],
  },
  // UMD config
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/index.js',
      format: 'umd',
      name: 'steem', // UMD global variable name
      sourcemap: true,
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
      terser(),
    ],
  },
  // Generate .d.ts file config
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/types/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
]);
