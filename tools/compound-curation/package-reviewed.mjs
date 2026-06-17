#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

if (!args.compound) {
  fail('Missing required "--compound <slug>" argument.');
}

if (!args.releaseVersion) {
  fail('Missing required "--release-version <YYYY.MM.patch>" argument.');
}

if (!args.output) {
  fail('Missing required "--output <path>" argument.');
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const { createJiti } = require('jiti');
const jiti = createJiti(`${repoRoot}/`);

const { referenceCompounds } = jiti(`${repoRoot}/lib/reference-compounds/index.ts`);
const { buildBundledReferenceSnapshot, validateReferenceSnapshot } = jiti(`${repoRoot}/lib/reference-library-snapshot.ts`);

const compound = referenceCompounds.find((entry) => entry.id === args.compound);

if (!compound) {
  fail(`Reviewed compound "${args.compound}" was not found in the reference index.`);
}

const exportedAt = args.exportedAt ?? new Date().toISOString();
const exportedFrom = args.exportedFrom ?? `compound-curation-package:${compound.id}`;
const snapshot = {
  ...buildBundledReferenceSnapshot([compound]),
  libraryVersion: args.releaseVersion,
  exportedAt,
  source: {
    kind: 'supabase-export',
    registry: 'peptideos-reference-registry',
    exportedFrom,
  },
};
const issues = validateReferenceSnapshot(snapshot);

if (issues.length > 0) {
  fail(`Reviewed compound package failed validation:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
}

const outputPath = resolve(process.cwd(), args.output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

console.log(`Packaged reviewed compound ${compound.id} to ${outputPath}`);

function parseArgs(argv) {
  const parsed = {
    compound: '',
    releaseVersion: '',
    exportedAt: undefined,
    exportedFrom: undefined,
    output: '',
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') continue;

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--compound') {
      parsed.compound = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--release-version') {
      parsed.releaseVersion = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--exported-at') {
      parsed.exportedAt = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--exported-from') {
      parsed.exportedFrom = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--output') {
      parsed.output = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    fail(`Unknown argument "${arg}".`);
  }

  return parsed;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    fail(`Missing value for "${flag}".`);
  }
  return value;
}

function fail(message) {
  console.error(message);
  console.error('');
  printUsage();
  process.exit(1);
}

function printUsage() {
  console.log([
    'Usage:',
    '  pnpm compound:package-reviewed -- --compound retatrutide --release-version 2026.06.4 --output ./retatrutide-package.json',
    '',
    'Options:',
    '  --compound <slug>           Reviewed compound slug from the app reference index.',
    '  --release-version <value>   Release version using YYYY.MM.patch format.',
    '  --output <path>             Write a traceable reviewed library import package.',
    '  --exported-at <iso>         Override export timestamp for reproducible packages.',
    '  --exported-from <label>     Override trace label for the package source.',
  ].join('\n'));
}
