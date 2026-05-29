import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const migrationPath = 'supabase/migrations/20260529000000_create_reference_registry.sql';
const readmePath = 'supabase/README.md';

describe('Supabase reference registry schema', () => {
  test('defines the curation registry tables, constraints, review states, and RLS', () => {
    const sql = readFileSync(migrationPath, 'utf8');

    [
      'reference_compounds',
      'reference_compound_aliases',
      'reference_compound_categories',
      'reference_compound_forms',
      'reference_citations',
      'reference_compound_citations',
      'reference_workflow_metadata',
      'reference_curation_events',
    ].forEach((table) => {
      expect(sql).toContain(`create table if not exists public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    });

    ['candidate', 'draft', 'needs_review', 'reviewed', 'deprecated'].forEach((status) => {
      expect(sql).toContain(`'${status}'`);
    });

    expect(sql).toContain('constraint reference_compounds_slug_key unique (slug)');
    expect(sql).toContain('constraint reference_compound_aliases_alias_key unique (alias_normalized)');
    expect(sql).toContain('references public.reference_compounds(id) on delete cascade');
    expect(sql).toContain('references public.reference_citations(id) on delete restrict');
  });

  test('documents local and remote Supabase migration workflow without browser secrets', () => {
    const readme = readFileSync(readmePath, 'utf8');

    expect(readme).toContain('SUPABASE_PROJECT_REF');
    expect(readme).toContain('SUPABASE_ACCESS_TOKEN');
    expect(readme).toContain('Service role keys must not be exposed to the browser');
    expect(readme).toContain('supabase db push');
  });
});
