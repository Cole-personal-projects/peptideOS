import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';
import { validateReferenceSnapshot } from './reference-library-snapshot';

describe('compound curation package command', () => {
  test('packages a reviewed compound into a traceable library import snapshot', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-compound-package-'));
    const packagePath = join(workDir, 'retatrutide-package.json');
    const importSqlPath = join(workDir, 'retatrutide-import.sql');

    try {
      expect(packageJson.scripts['compound:package-reviewed']).toBe('node tools/compound-curation/package-reviewed.mjs');

      const packageResult = spawnSync('node', [
        'tools/compound-curation/package-reviewed.mjs',
        '--compound',
        'retatrutide',
        '--release-version',
        '2026.06.4',
        '--exported-at',
        '2026-06-17T02:00:00.000Z',
        '--output',
        packagePath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(packageResult.status).toBe(0);
      expect(packageResult.stderr).toBe('');
      expect(packageResult.stdout).toContain('Packaged reviewed compound retatrutide');

      const snapshot = JSON.parse(readFileSync(packagePath, 'utf8'));
      expect(validateReferenceSnapshot(snapshot)).toEqual([]);
      expect(snapshot).toEqual(expect.objectContaining({
        libraryVersion: '2026.06.4',
        exportedAt: '2026-06-17T02:00:00.000Z',
        source: {
          kind: 'supabase-export',
          registry: 'peptideos-reference-registry',
          exportedFrom: 'compound-curation-package:retatrutide',
        },
      }));
      expect(snapshot.compounds.map((compound: { id: string }) => compound.id)).toEqual(['retatrutide']);

      const importResult = spawnSync('node', [
        'tools/reference-library/import-reviewed.mjs',
        '--input',
        packagePath,
        '--output',
        importSqlPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(importResult.status).toBe(0);
      expect(importResult.stderr).toBe('');
      expect(readFileSync(importSqlPath, 'utf8')).toContain("'retatrutide'");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test('rejects compounds that are not in the reviewed reference index', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-compound-package-'));
    const packagePath = join(workDir, 'not-reviewed-package.json');

    try {
      const result = spawnSync('node', [
        'tools/compound-curation/package-reviewed.mjs',
        '--compound',
        'not-reviewed-yet',
        '--release-version',
        '2026.06.5',
        '--output',
        packagePath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Reviewed compound "not-reviewed-yet" was not found in the reference index.');
      expect(existsSync(packagePath)).toBe(false);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
