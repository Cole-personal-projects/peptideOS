#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseArgs, readRecordFiles } from './record-files.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const { createJiti } = require('jiti');
const jiti = createJiti(`${repoRoot}/`);

const {
  parseReferenceLibraryRecord,
  validateReferenceLibraryRecord,
} = jiti(`${repoRoot}/lib/reference-library-record.ts`);

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  if (!args.input) {
    throw new Error('Missing required "--input <path>" argument.');
  }

  const recordFiles = readRecordFiles(args.input);
  const issues = [];

  recordFiles.forEach((file) => {
    const record = parseReferenceLibraryRecord(file.raw);
    validateReferenceLibraryRecord(record).forEach((issue) => {
      issues.push(`${file.path}: ${issue}`);
    });
  });

  if (issues.length > 0) {
    throw new Error(`Reference library record validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
  }

  console.log(`Validated ${recordFiles.length} reference library records`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('');
  printUsage();
  process.exit(1);
}

function printUsage() {
  console.log([
    'Usage:',
    '  pnpm library:validate-records',
    '  node tools/reference-library/validate-records.mjs --input reference-library/compounds',
    '',
    'Options:',
    '  --input <path>      Directory or YAML file to validate. Directories read direct *.yml/*.yaml children only.',
  ].join('\n'));
}
