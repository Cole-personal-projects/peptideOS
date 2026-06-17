import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import {
  createSupabaseAuthClient,
  getAuthConfig,
  getAuthUserFromSession,
  getBrowserAuthConfig,
  verifyEmailOtp,
} from './auth';

describe('auth configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  test('reads Supabase auth config from public browser environment variables', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://browser.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'browser-anon-key');

    expect(getBrowserAuthConfig()).toEqual({
      provider: 'supabase',
      enabled: true,
      url: 'https://browser.supabase.co',
      anonKey: 'browser-anon-key',
    });
  });

  test('does not create a Supabase client when auth is not configured', () => {
    expect(createSupabaseAuthClient({ provider: 'supabase', enabled: false })).toBeNull();
  });

  test('creates a Supabase client when public auth config is complete', () => {
    const client = createSupabaseAuthClient({
      provider: 'supabase',
      enabled: true,
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });

    expect(client).not.toBeNull();
    expect(client?.auth).toBeDefined();
  });

  test('maps a Supabase session to the app auth user', () => {
    const session = {
      user: {
        id: 'user-1',
        email: 'amy@example.com',
      },
    } as Session;

    expect(getAuthUserFromSession(session)).toEqual({
      id: 'user-1',
      email: 'amy@example.com',
    });
  });

  test('returns no auth user when the Supabase session cannot identify an email user', () => {
    expect(getAuthUserFromSession(null)).toBeNull();
    expect(getAuthUserFromSession({ user: { id: 'user-1' } } as Session)).toBeNull();
  });

  test('verifies an email one-time code for PWA sign-in', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { verifyOtp } };

    const result = await verifyEmailOtp(client, ' amy@example.com ', ' 123456 ');

    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'amy@example.com',
      token: '123456',
      type: 'email',
    });
    expect(result).toEqual({ ok: true, message: 'Signed in.' });
  });
});
