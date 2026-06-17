#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

if (!args.input) {
  fail('Missing required "--input <path>" argument.');
}

if (!args.output) {
  fail('Missing required "--output <path>" argument.');
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const { createJiti } = require('jiti');
const jiti = createJiti(`${repoRoot}/`);

const { validateReferenceSnapshot } = jiti(`${repoRoot}/lib/reference-library-snapshot.ts`);
const { buildReferenceRegistrySeed } = jiti(`${repoRoot}/lib/reference-registry-seed.ts`);
const { buildReferenceRegistryImportSql } = jiti(`${repoRoot}/lib/reference-registry-sql.ts`);

const inputPath = resolve(process.cwd(), args.input);
const snapshot = JSON.parse(readFileSync(inputPath, 'utf8'));
const issues = [
  ...validateReferenceSnapshot(snapshot),
  ...validateTraceableImportPackage(snapshot),
];

if (issues.length > 0) {
  fail(`Reviewed library package failed validation:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
}

const seed = buildReferenceRegistrySeed(snapshot);
const sql = buildReferenceRegistryImportSql(seed);
const outputPath = resolve(process.cwd(), args.output);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sql, 'utf8');

console.log(`Wrote reviewed reference library import SQL for ${seed.compounds.length} compound${seed.compounds.length === 1 ? '' : 's'} to ${outputPath}`);

function validateTraceableImportPackage(snapshot) {
  const issues = [];

  if (
    snapshot?.source?.kind !== 'supabase-export'
    || typeof snapshot.source.exportedFrom !== 'string'
    || !snapshot.source.exportedFrom.trim()
  ) {
    issues.push('Reviewed import packages must come from a traceable Supabase export');
  }

  if (!Array.isArray(snapshot?.compounds) || snapshot.compounds.length === 0) {
    issues.push('Reviewed import packages must include at least one compound');
  }

  return issues;
}

function parseArgs(argv) {
  const parsed = {
    input: '',
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

    if (arg === '--input') {
      parsed.input = requireValue(argv, index, arg);
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
    '  pnpm library:import-reviewed -- --input ./reference-library-snapshot.json --output ./reference-library-import.sql',
    '',
    'Options:',
    '  --input <path>   Read a reviewed reference library snapshot package.',
    '  --output <path>  Write SQL that upserts the reviewed package into Supabase.',
  ].join('\n'));
}
