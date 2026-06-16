import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

export interface AuthConfig {
  provider: 'supabase';
  enabled: boolean;
  url?: string;
  anonKey?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export type PublicEnv = Record<string, string | undefined>;

export function getAuthConfig(env: PublicEnv): AuthConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      provider: 'supabase',
      enabled: false,
    };
  }

  return {
    provider: 'supabase',
    enabled: true,
    url,
    anonKey,
  };
}

export function getBrowserAuthConfig(): AuthConfig {
  return getAuthConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function createSupabaseAuthClient(config = getBrowserAuthConfig()): SupabaseClient | null {
  if (!config.enabled || !config.url || !config.anonKey) return null;

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

export function getAuthUserFromSession(session: Session | null): AuthUser | null {
  const id = session?.user.id;
  const email = session?.user.email;
  if (!id || !email) return null;

  return { id, email };
}
