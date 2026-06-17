import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const migrationPath = 'supabase/migrations/20260529000000_create_reference_registry.sql';
const readmePath = 'supabase/README.md';

describe('Supabase reference registry schema', () => {
  test('defines the curation registry tables, constraints, review states, and RLS', () => {
    const sql = readFileSync(migrationPath, 'utf8');
    const releaseSql = readFileSync('supabase/migrations/20260617000000_add_reference_content_releases.sql', 'utf8');
    const combinedSql = `${sql}\n${releaseSql}`;

    [
      'reference_compounds',
      'reference_compound_aliases',
      'reference_compound_categories',
      'reference_compound_forms',
      'reference_citations',
      'reference_compound_citations',
      'reference_workflow_metadata',
      'reference_curation_events',
      'reference_content_blocks',
      'reference_library_releases',
      'reference_library_release_items',
    ].forEach((table) => {
      expect(combinedSql).toContain(`create table if not exists public.${table}`);
      expect(combinedSql).toContain(`alter table public.${table} enable row level security`);
    });

    ['candidate', 'draft', 'needs_review', 'reviewed', 'deprecated'].forEach((status) => {
      expect(sql).toContain(`'${status}'`);
    });

    expect(sql).toContain('constraint reference_compounds_slug_key unique (slug)');
    expect(sql).toContain('constraint reference_compound_aliases_alias_key unique (alias_normalized)');
    expect(sql).toContain('references public.reference_compounds(id) on delete cascade');
    expect(sql).toContain('references public.reference_citations(id) on delete restrict');
    expect(releaseSql).toContain("block_type text not null");
    expect(releaseSql).toContain("content jsonb not null default '{}'::jsonb");
    expect(releaseSql).toContain("release_version text primary key");
    expect(releaseSql).toContain("content_block_id uuid not null references public.reference_content_blocks(id) on delete restrict");
  });

  test('documents local and remote Supabase migration workflow without browser secrets', () => {
    const readme = readFileSync(readmePath, 'utf8');

    expect(readme).toContain('SUPABASE_PROJECT_REF');
    expect(readme).toContain('SUPABASE_ACCESS_TOKEN');
    expect(readme).toContain('Service role keys must not be exposed to the browser');
    expect(readme).toContain('supabase db push');
  });

  test('stores form-level reconstitution defaults for exportable calculator context', () => {
    const sql = [
      readFileSync(migrationPath, 'utf8'),
      readFileSync('supabase/migrations/20260617001000_add_reference_form_reconstitution_defaults.sql', 'utf8'),
    ].join('\n');

    expect(sql).toContain("typical_vial_amounts jsonb not null default '[]'::jsonb");
    expect(sql).toContain('typical_bac_water_ml numeric[] not null default');
  });
});
