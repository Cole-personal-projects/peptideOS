import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';

describe('reference library import SQL command', () => {
  test('writes an idempotent Supabase import for a reviewed compound package', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-import-'));
    const inputPath = join(workDir, 'retatrutide-package.json');
    const outputPath = join(workDir, 'retatrutide-import.sql');

    try {
      expect(packageJson.scripts['library:import-reviewed']).toBe('node tools/reference-library/import-reviewed.mjs');

      const snapshot = buildBundledReferenceSnapshot(
        referenceCompounds.filter((compound) => compound.id === 'retatrutide'),
      );
      writeFileSync(inputPath, JSON.stringify({
        ...snapshot,
        libraryVersion: '2026.06.1',
        exportedAt: '2026-06-17T01:00:00.000Z',
        source: {
          kind: 'supabase-export',
          registry: 'peptideos-reference-registry',
          exportedFrom: 'retatrutide-curation-package',
        },
      }, null, 2), 'utf8');

      const result = spawnSync('node', [
        'tools/reference-library/import-reviewed.mjs',
        '--input',
        inputPath,
        '--output',
        outputPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Wrote reviewed reference library import SQL for 1 compound');

      const sql = readFileSync(outputPath, 'utf8');
      expect(sql).toContain('begin;');
      expect(sql).toContain('commit;');
      expect(sql).toContain("'retatrutide'");
      expect(sql).toContain("'retatrutide-field-brief-v1'");
      expect(sql).toContain('insert into public.reference_library_releases');
      expect(sql).toContain('insert into public.reference_library_release_items');
      expect(sql).toContain('on conflict (slug) do update set');
      expect(sql).not.toContain("'semaglutide'");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test('rejects untraceable bundled snapshots as curation imports', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-import-'));
    const inputPath = join(workDir, 'bundled-retatrutide.json');
    const outputPath = join(workDir, 'bundled-retatrutide.sql');

    try {
      const snapshot = buildBundledReferenceSnapshot(
        referenceCompounds.filter((compound) => compound.id === 'retatrutide'),
      );
      writeFileSync(inputPath, JSON.stringify(snapshot, null, 2), 'utf8');

      const result = spawnSync('node', [
        'tools/reference-library/import-reviewed.mjs',
        '--input',
        inputPath,
        '--output',
        outputPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Reviewed import packages must come from a traceable Supabase export');
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test('rejects empty curation packages before writing SQL', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-import-'));
    const inputPath = join(workDir, 'empty-package.json');
    const outputPath = join(workDir, 'empty-package.sql');

    try {
      const snapshot = buildBundledReferenceSnapshot([]);
      writeFileSync(inputPath, JSON.stringify({
        ...snapshot,
        libraryVersion: '2026.06.2',
        source: {
          kind: 'supabase-export',
          registry: 'peptideos-reference-registry',
          exportedFrom: 'empty-curation-package',
        },
      }, null, 2), 'utf8');

      const result = spawnSync('node', [
        'tools/reference-library/import-reviewed.mjs',
        '--input',
        inputPath,
        '--output',
        outputPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Reviewed import packages must include at least one compound');
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test('accepts transparent emerging packages without citation-backed evidence', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-library-import-'));
    const inputPath = join(workDir, 'emerging-package.json');
    const outputPath = join(workDir, 'emerging-package.sql');

    try {
      const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');
      const emergingCompound = {
        ...retatrutide!,
        id: 'emerging-test-compound',
        name: 'Emerging Test Compound',
        aliases: ['ETC-1'],
        dosePresets: retatrutide!.dosePresets.map((preset) => ({ ...preset, citationIds: [] })),
        vialPresets: retatrutide!.vialPresets.map((preset) => ({ ...preset, citationIds: [] })),
        citations: [],
        referenceProfile: {
          ...retatrutide!.referenceProfile!,
          evidenceTier: 'identity-only',
          reviewSummary: 'Early community interest only; PeptideOS can track it but cannot verify efficacy claims.',
          clinicalEvidence: [{
            design: 'community-reported',
            population: 'Biohacking community reports; no verified clinical population.',
            finding: 'Anecdotal reports exist, but reviewed source-backed human evidence is not available.',
            citationIds: [],
            sourceQuality: 'uncited-emerging',
            limitations: 'No source-backed human study or authoritative identity record is attached yet.',
          }],
          evidenceGaps: [
            'No authoritative identity source is attached.',
            'No reviewed clinical evidence is attached.',
            'Community reports may not match the compound, purity, dose, or route users actually have.',
          ],
          regulatoryStatus: {
            status: 'unknown',
            region: 'US',
            summary: 'No confirmed US regulatory status is attached; users should treat status as unknown.',
            citationIds: [],
            sourceQuality: 'uncited-emerging',
            limitations: 'Regulatory status has not been verified against an authoritative source.',
          },
        },
      } as never;
      const snapshot = buildBundledReferenceSnapshot([emergingCompound]);
      writeFileSync(inputPath, JSON.stringify({
        ...snapshot,
        libraryVersion: '2026.06.3',
        source: {
          kind: 'supabase-export',
          registry: 'peptideos-reference-registry',
          exportedFrom: 'emerging-curation-package',
        },
      }, null, 2), 'utf8');

      const result = spawnSync('node', [
        'tools/reference-library/import-reviewed.mjs',
        '--input',
        inputPath,
        '--output',
        outputPath,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(readFileSync(outputPath, 'utf8')).toContain("'emerging-test-compound'");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
