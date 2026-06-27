import { afterEach, describe, expect, test, vi } from 'vitest';

import { createSupabaseServerClient, createSupabaseTokenVerifier, getSupabaseServerConfig } from './supabase-server';

describe('Supabase server clients', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reports server config incomplete without service-role key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    expect(getSupabaseServerConfig()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
      serviceRoleKey: undefined,
      configured: false,
    });
    expect(createSupabaseServerClient()).toBeNull();
  });

  test('creates service and token verifier clients when env is complete', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    expect(getSupabaseServerConfig()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
      serviceRoleKey: 'service-role-key',
      configured: true,
    });
    expect(createSupabaseServerClient()?.auth).toBeDefined();
    expect(createSupabaseTokenVerifier('access-token')?.auth).toBeDefined();
  });

  test('does not create token verifier without public auth config', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    expect(createSupabaseTokenVerifier('access-token')).toBeNull();
  });
});
