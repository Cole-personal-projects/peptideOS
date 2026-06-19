#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseArgs, readRecordFiles } from './record-files.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const { createJiti } = require('jiti');
const jiti = createJiti(`${repoRoot}/`);

const {
  buildReferenceLibrarySnapshotFromRecords,
  parseReferenceLibraryRecord,
  validateReferenceLibraryRecord,
} = jiti(`${repoRoot}/lib/reference-library-record.ts`);
const { validateReferenceSnapshot } = jiti(`${repoRoot}/lib/reference-library-snapshot.ts`);

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  if (!args.input) {
    throw new Error('Missing required "--input <path>" argument.');
  }
  if (!args.output) {
    throw new Error('Missing required "--output <path>" argument.');
  }

  const records = readRecordFiles(args.input).map((file) => {
    const record = parseReferenceLibraryRecord(file.raw);
    const issues = validateReferenceLibraryRecord(record);
    if (issues.length > 0) {
      throw new Error(`Reference library record validation failed for ${file.path}:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    }
    return record;
  });

  const snapshot = buildReferenceLibrarySnapshotFromRecords(records, {
    exportedAt: args.exportedAt,
  });
  const approvedCount = snapshot.compounds.length;

  if (approvedCount === 0) {
    throw new Error('No approved reference library records were found.');
  }

  const snapshotIssues = validateReferenceSnapshot(snapshot);
  if (snapshotIssues.length > 0) {
    throw new Error(`Built snapshot failed validation:\n${snapshotIssues.map((issue) => `- ${issue}`).join('\n')}`);
  }

  const outputPath = resolve(process.cwd(), args.output);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(`Built ${approvedCount} approved reference library compounds to ${outputPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('');
  printUsage();
  process.exit(1);
}

function printUsage() {
  console.log([
    'Usage:',
    '  pnpm library:build-records',
    '  node tools/reference-library/build-records.mjs --input reference-library/compounds --output app/generated/reference-library.snapshot.json',
    '',
    'Options:',
    '  --input <path>         Directory or YAML file to build from. Directories read direct *.yml/*.yaml children only.',
    '  --output <path>        Snapshot JSON path for the app bundle.',
    '  --exported-at <iso>    Override export timestamp for deterministic releases.',
  ].join('\n'));
}
