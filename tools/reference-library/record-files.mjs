import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const recordExtensions = new Set(['.yml', '.yaml']);

export function readRecordFiles(input) {
  const inputPath = resolve(process.cwd(), input);

  if (!existsSync(inputPath)) {
    throw new Error(`Input path does not exist: ${inputPath}`);
  }

  const inputStat = statSync(inputPath);
  const filePaths = inputStat.isDirectory()
    ? readdirSync(inputPath)
      .map((name) => join(inputPath, name))
      .filter((filePath) => statSync(filePath).isFile())
      .filter((filePath) => recordExtensions.has(extname(filePath)))
      .sort((a, b) => a.localeCompare(b))
    : [inputPath];

  return filePaths.map((filePath) => ({
    path: filePath,
    raw: readFileSync(filePath, 'utf8'),
  }));
}

export function parseArgs(argv) {
  const parsed = {
    input: '',
    output: '',
    exportedAt: undefined,
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
    if (arg === '--exported-at') {
      parsed.exportedAt = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument "${arg}".`);
  }

  return parsed;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for "${flag}".`);
  }
  return value;
}
