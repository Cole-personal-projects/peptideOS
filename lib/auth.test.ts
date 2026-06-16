import { describe, expect, test } from 'vitest';
import { getAuthConfig } from './auth';

describe('auth configuration', () => {
  test('reports Supabase auth as disabled when public config is missing', () => {
    expect(getAuthConfig({})).toEqual({
      provider: 'supabase',
      enabled: false,
    });
  });

  test('reports Supabase auth as enabled when public URL and anon key are configured', () => {
    expect(getAuthConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    })).toEqual({
      provider: 'supabase',
      enabled: true,
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });
});
