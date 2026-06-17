import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';
import { referenceCompounds } from './reference-compounds';
import { validateReferenceSnapshot } from './reference-library-snapshot';

describe('reference library export command', () => {
  test('writes a reviewed registry snapshot that the app can consume', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-export-'));
    const outputPath = join(workDir, 'reference-library-snapshot.json');

    try {
      expect(packageJson.scripts['library:export-reviewed']).toBe('node tools/reference-library/export-reviewed.mjs');

      const result = spawnSync('node', [
        'tools/reference-library/export-reviewed.mjs',
        '--from',
        'bundled-seed',
        '--output',
        outputPath,
        '--exported-at',
        '2026-06-17T00:00:00.000Z',
        '--exported-from',
        'command-test',
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain(`Exported ${referenceCompounds.length} reviewed compounds`);

      const snapshot = JSON.parse(readFileSync(outputPath, 'utf8'));
      expect(validateReferenceSnapshot(snapshot)).toEqual([]);
      expect(snapshot).toEqual(expect.objectContaining({
        exportedAt: '2026-06-17T00:00:00.000Z',
        source: {
          kind: 'supabase-export',
          registry: 'peptideos-reference-registry',
          exportedFrom: 'command-test',
        },
      }));
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test('accepts the pnpm argument separator before export options', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-export-'));
    const outputPath = join(workDir, 'reference-library-snapshot.json');

    try {
      const result = spawnSync('node', [
        'tools/reference-library/export-reviewed.mjs',
        '--',
        '--from',
        'bundled-seed',
        '--output',
        outputPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain(`Exported ${referenceCompounds.length} reviewed compounds`);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
