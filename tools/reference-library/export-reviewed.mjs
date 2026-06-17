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

if (args.from !== 'bundled-seed') {
  fail('Only "--from bundled-seed" is supported by this exporter slice.');
}

if (!args.output) {
  fail('Missing required "--output <path>" argument.');
}

const exportedAt = args.exportedAt ?? new Date().toISOString();
const exportedFrom = args.exportedFrom ?? 'bundled-seed';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const { createJiti } = require('jiti');
const jiti = createJiti(`${repoRoot}/`);

const { referenceCompounds } = jiti(`${repoRoot}/lib/reference-compounds/index.ts`);
const { buildBundledReferenceSnapshot, validateReferenceSnapshot } = jiti(`${repoRoot}/lib/reference-library-snapshot.ts`);
const { buildReferenceRegistrySeed } = jiti(`${repoRoot}/lib/reference-registry-seed.ts`);
const { buildReferenceLibrarySnapshotFromRegistrySeed } = jiti(`${repoRoot}/lib/reference-library-export.ts`);

const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
const seed = buildReferenceRegistrySeed(bundledSnapshot);
const snapshot = buildReferenceLibrarySnapshotFromRegistrySeed(seed, {
  exportedAt,
  exportedFrom,
});
const issues = validateReferenceSnapshot(snapshot);

if (issues.length > 0) {
  fail(`Exported snapshot failed validation:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
}

const outputPath = resolve(process.cwd(), args.output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

console.log(`Exported ${snapshot.compounds.length} reviewed compounds to ${outputPath}`);

function parseArgs(argv) {
  const parsed = {
    from: 'bundled-seed',
    output: '',
    exportedAt: undefined,
    exportedFrom: undefined,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--from') {
      parsed.from = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--output') {
      parsed.output = requireValue(argv, index, arg);
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
    '  pnpm library:export-reviewed -- --from bundled-seed --output ./reference-library-snapshot.json',
    '',
    'Options:',
    '  --from bundled-seed       Export from the reviewed deterministic registry seed.',
    '  --output <path>           Write the exported app snapshot JSON.',
    '  --exported-at <iso>       Override export timestamp for deterministic releases.',
    '  --exported-from <label>   Identify the registry/source that produced the export.',
  ].join('\n'));
}
