import { defineConfig } from 'tsup';
import pkg from './package.json';

// Fix for ESM builds breaking on bundled CJS deps that use require('stream') etc.
// Bundle our own CLI code, but keep prompt libs external so Node loads their CJS safely.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  // We import these directly (even if they're transitive), so ensure they're never bundled.
  '@inquirer/core',
  '@inquirer/ansi',
  '@inquirer/figures',
  '@inquirer/type',
  '@inquirer/checkbox',
  '@inquirer/*',
  'mute-stream'
];

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  target: 'node20',
  bundle: true,
  sourcemap: true,
  external
});

