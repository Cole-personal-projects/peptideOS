import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const migrationPath = 'supabase/migrations/20260616000000_create_app_user_sync_records.sql';
const labMigrationPath = 'supabase/migrations/20260622000000_add_lab_result_sync_collections.sql';

describe('Supabase app user sync schema', () => {
  test('defines authenticated user-owned sync rows with row level security', () => {
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.app_user_sync_records');
    expect(sql).toContain('user_id uuid not null references auth.users(id) on delete cascade');
    expect(sql).toContain('collection text not null');
    expect(sql).toContain('record_id text not null');
    expect(sql).toContain('payload jsonb not null');
    expect(sql).toContain('primary key (user_id, collection, record_id)');
    expect(sql).toContain('alter table public.app_user_sync_records enable row level security');
    expect(sql).toContain('using (auth.uid() = user_id)');
    expect(sql).toContain('with check (auth.uid() = user_id)');
  });

  test('allows lab result collections in sync rows', () => {
    const sql = readFileSync(labMigrationPath, 'utf8');
    expect(sql).toContain('lab_reports');
    expect(sql).toContain('lab_results');
    expect(sql).toContain('lab_import_audits');
  });
});
