#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const REQUIRED_FLAGS = ['--run', '--passWithNoTests'];
const IGNORED_FLAGS = new Map([
  ['--runInBand', 'serial execution is enabled by default'],
  ['-i', 'serial execution is enabled by default'],
]);

const incomingArgs = process.argv.slice(2);
const passthroughArgs = [];

for (const arg of incomingArgs) {
  if (REQUIRED_FLAGS.includes(arg)) {
    // Skip duplicates of the required flags; they are appended once below.
    continue;
  }

  if (IGNORED_FLAGS.has(arg)) {
    console.warn(`[run-vitest] Ignoring unsupported flag "${arg}" (${IGNORED_FLAGS.get(arg)})`);
    continue;
  }

  passthroughArgs.push(arg);
}

const finalArgs = [...REQUIRED_FLAGS, ...passthroughArgs];

const result = spawnSync('pnpm', ['exec', 'vitest', ...finalArgs], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
