import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot, validateReferenceSnapshot } from './reference-library-snapshot';
import { buildReferenceRegistrySeed } from './reference-registry-seed';

describe('reference registry seed', () => {
  test('maps the current reviewed library into deterministic Supabase registry rows', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const seed = buildReferenceRegistrySeed(snapshot);

    expect(seed.sourceSnapshot).toBeDefined();
    expect(validateReferenceSnapshot(seed.sourceSnapshot!)).toEqual([]);
    expect(seed.compounds).toHaveLength(referenceCompounds.length);
    expect(seed.compounds.every((compound) => compound.review_status === 'reviewed')).toBe(true);
    expect(seed.aliases.length).toBe(referenceCompounds.flatMap((compound) => compound.aliases).length);
    expect(seed.categories.length).toBe(referenceCompounds.length);
    expect(seed.forms.length).toBe(referenceCompounds.length);
    expect(seed.citations).toHaveLength(snapshot.citations.length);
    expect(seed.dosePresets.length).toBe(referenceCompounds.flatMap((compound) => compound.dosePresets).length);
    expect(seed.vialPresets.length).toBe(referenceCompounds.flatMap((compound) => compound.vialPresets).length);
    expect(seed.workflowMetadata).toHaveLength(referenceCompounds.length);
    expect(seed.contentBlocks.some((block) => (
      block.compound_slug === 'retatrutide'
      && block.block_type === 'field_brief'
      && block.review_status === 'reviewed'
      && typeof block.content.headline === 'string'
      && block.content.headline.includes('triple-agonist')
    ))).toBe(true);
    expect(seed.libraryRelease.release_version).toBe(snapshot.libraryVersion);
    expect(seed.releaseItems.some((item) => (
      item.compound_slug === 'retatrutide'
      && item.content_block_id === 'retatrutide-field-brief-v1'
    ))).toBe(true);
  });

  test('keeps preset rows supported by the Supabase migration schema', () => {
    const migration = readFileSync('supabase/migrations/20260529001000_add_reference_presets.sql', 'utf8');

    expect(migration).toContain('create table if not exists public.reference_dose_presets');
    expect(migration).toContain('create table if not exists public.reference_vial_presets');
    expect(migration).toContain('alter table public.reference_dose_presets enable row level security');
    expect(migration).toContain('alter table public.reference_vial_presets enable row level security');
  });

  test('keeps content block and release rows supported by the Supabase migration schema', () => {
    const migration = readFileSync('supabase/migrations/20260617000000_add_reference_content_releases.sql', 'utf8');

    expect(migration).toContain('create table if not exists public.reference_content_blocks');
    expect(migration).toContain('create table if not exists public.reference_library_releases');
    expect(migration).toContain('create table if not exists public.reference_library_release_items');
    expect(migration).toContain('alter table public.reference_content_blocks enable row level security');
    expect(migration).toContain('alter table public.reference_library_releases enable row level security');
    expect(migration).toContain('alter table public.reference_library_release_items enable row level security');
  });

  test('exports complete content block sets for compounds with pro-grade profiles', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const seed = buildReferenceRegistrySeed(snapshot);
    const profiledCompoundIds = referenceCompounds
      .filter((compound) => compound.referenceProfile)
      .map((compound) => compound.id);

    profiledCompoundIds.forEach((compoundId) => {
      expect(seed.contentBlocks
        .filter((block) => block.compound_slug === compoundId)
        .map((block) => block.block_type)
        .sort()
      ).toEqual([
        'evidence_snapshot',
        'field_brief',
        'regulatory_status',
        'safety_watch',
      ]);
    });
  });
});
