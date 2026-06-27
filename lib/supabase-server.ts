import { createClient } from '@supabase/supabase-js';

export function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;

  return {
    url,
    anonKey,
    serviceRoleKey,
    configured: Boolean(url && anonKey && serviceRoleKey),
  };
}

export function createSupabaseServerClient() {
  const { url, serviceRoleKey } = getSupabaseServerConfig();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseTokenVerifier(accessToken: string) {
  const { url, anonKey } = getSupabaseServerConfig();
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
