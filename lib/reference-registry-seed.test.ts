import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot, validateReferenceSnapshot } from './reference-library-snapshot';
import { buildReferenceRegistrySeed } from './reference-registry-seed';

describe('reference registry seed', () => {
  test('maps the current reviewed library into deterministic Supabase registry rows', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const seed = buildReferenceRegistrySeed(snapshot);

    expect(validateReferenceSnapshot(seed.sourceSnapshot)).toEqual([]);
    expect(seed.compounds).toHaveLength(referenceCompounds.length);
    expect(seed.compounds.every((compound) => compound.review_status === 'reviewed')).toBe(true);
    expect(seed.aliases.length).toBe(referenceCompounds.flatMap((compound) => compound.aliases).length);
    expect(seed.categories.length).toBe(referenceCompounds.length);
    expect(seed.forms.length).toBe(referenceCompounds.length);
    expect(seed.citations).toHaveLength(snapshot.citations.length);
    expect(seed.dosePresets.length).toBe(referenceCompounds.flatMap((compound) => compound.dosePresets).length);
    expect(seed.vialPresets.length).toBe(referenceCompounds.flatMap((compound) => compound.vialPresets).length);
    expect(seed.workflowMetadata).toHaveLength(referenceCompounds.length);
  });

  test('keeps preset rows supported by the Supabase migration schema', () => {
    const migration = readFileSync('supabase/migrations/20260529001000_add_reference_presets.sql', 'utf8');

    expect(migration).toContain('create table if not exists public.reference_dose_presets');
    expect(migration).toContain('create table if not exists public.reference_vial_presets');
    expect(migration).toContain('alter table public.reference_dose_presets enable row level security');
    expect(migration).toContain('alter table public.reference_vial_presets enable row level security');
  });
});
