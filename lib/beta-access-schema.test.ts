import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const migrationSql = readFileSync('supabase/migrations/20260627000000_add_beta_invites_and_entitlements.sql', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };

describe('beta access schema', () => {
  test('creates invite, redemption, and entitlement tables with RLS', () => {
    ['beta_invite_codes', 'beta_invite_redemptions', 'user_entitlements'].forEach((table) => {
      expect(migrationSql).toContain(`create table if not exists public.${table}`);
      expect(migrationSql).toContain(`alter table public.${table} enable row level security`);
    });

    expect(migrationSql).toContain('code_hash text not null unique');
    expect(migrationSql).toContain('constraint beta_invite_redemptions_user_key unique (user_id)');
    expect(migrationSql).toContain('constraint user_entitlements_user_entitlement_key unique (user_id, entitlement)');
    expect(migrationSql).toContain('create policy "service_role manages beta invite codes"');
    expect(migrationSql).toContain('create policy "service_role manages beta invite redemptions"');
    expect(migrationSql).toContain('create policy "service_role manages user entitlements"');
    expect(migrationSql).toContain('create policy "users read own entitlements"');
  });

  test('exposes service-only invite redemption function', () => {
    expect(migrationSql).toContain('create or replace function public.redeem_beta_invite');
    expect(migrationSql).toContain("digest(normalized_code, 'sha256')");
    expect(migrationSql).toContain("values (redeemer_user_id, 'beta_access'");
    expect(migrationSql).toContain('revoke all on function public.redeem_beta_invite(text, uuid, text) from public');
    expect(migrationSql).toContain('grant execute on function public.redeem_beta_invite(text, uuid, text) to service_role');
  });

  test('ships invite generation command', () => {
    expect(packageJson.scripts['beta:invite']).toBe('node tools/create-beta-invite-code.mjs');
  });
});
