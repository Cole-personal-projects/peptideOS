import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';

describe('reference library seed SQL command', () => {
  test('writes reviewed registry seed SQL for Supabase', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-seed-'));
    const outputPath = join(workDir, 'reference-library-seed.sql');

    try {
      expect(packageJson.scripts['library:seed-reviewed-sql']).toBe('node tools/reference-library/seed-reviewed-sql.mjs');

      const result = spawnSync('node', [
        'tools/reference-library/seed-reviewed-sql.mjs',
        '--output',
        outputPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Wrote reviewed reference library seed SQL');

      const sql = readFileSync(outputPath, 'utf8');
      expect(sql).toContain('insert into public.reference_compounds');
      expect(sql).toContain("'retatrutide'");
      expect(sql).toContain('insert into public.reference_content_blocks');
      expect(sql).toContain("'retatrutide-field-brief-v1'");
      expect(sql).toContain('insert into public.reference_library_releases');
      expect(sql).toContain('insert into public.reference_library_release_items');
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
