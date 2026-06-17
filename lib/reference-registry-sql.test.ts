import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';
import { buildReferenceRegistrySeed } from './reference-registry-seed';
import { buildReferenceRegistryImportSql } from './reference-registry-sql';

describe('reference registry SQL', () => {
  test('builds scoped idempotent SQL for a reviewed package seed', () => {
    const snapshot = buildBundledReferenceSnapshot(
      referenceCompounds.filter((compound) => compound.id === 'retatrutide'),
    );
    const seed = buildReferenceRegistrySeed({
      ...snapshot,
      libraryVersion: '2026.06.1',
      exportedAt: '2026-06-17T01:00:00.000Z',
    });

    const sql = buildReferenceRegistryImportSql(seed);

    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
    expect(sql).toContain("delete from public.reference_library_release_items where release_version = '2026.06.1';");
    expect(sql).toContain("where slug = any(array['retatrutide']::text[])");
    expect(sql).toContain('insert into public.reference_compounds');
    expect(sql).toContain("on conflict (slug) do update set");
    expect(sql).toContain('insert into public.reference_citations');
    expect(sql).toContain('insert into public.reference_dose_presets');
    expect(sql).toContain('insert into public.reference_vial_presets');
    expect(sql).toContain('insert into public.reference_content_blocks');
    expect(sql).toContain("'retatrutide-field-brief-v1'");
    expect(sql).toContain('insert into public.reference_library_releases');
    expect(sql).toContain('insert into public.reference_library_release_items');
    expect(sql).not.toContain("'semaglutide'");
  });
});
