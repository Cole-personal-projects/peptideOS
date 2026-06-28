const PUBLIC_FILE_PATTERN = /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webmanifest|woff2?)$/i;

export function isBetaGateEnabled(env: Record<string, string | undefined> = process.env) {
  return env.BETA_GATE_ENABLED !== 'false';
}

export function getBetaCookieSecret(env: Record<string, string | undefined> = process.env) {
  return (
    env.BETA_GATE_COOKIE_SECRET?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    env.ANTHROPIC_API_KEY?.trim() ||
    ''
  );
}

export function isPublicBetaPath(pathname: string) {
  return (
    pathname === '/beta' ||
    pathname === '/api/beta/redeem' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/ocr/') ||
    pathname.startsWith('/icon-') ||
    PUBLIC_FILE_PATTERN.test(pathname)
  );
}

export function isApiPath(pathname: string) {
  return pathname.startsWith('/api/');
}

export function safeBetaNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/beta') || value.startsWith('/api/beta/redeem')) return '/';
  return value;
}
