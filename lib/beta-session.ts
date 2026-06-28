export const BETA_SESSION_COOKIE = 'peptideos_beta_access';

const MAX_COOKIE_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface BetaSession {
  email: string;
  entitlement: 'beta_access';
  issuedAt: number;
  expiresAt: number;
}

export async function createBetaSessionCookie(email: string, secret: string, now = new Date()) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const session: BetaSession = {
    email: email.trim().toLowerCase(),
    entitlement: 'beta_access',
    issuedAt,
    expiresAt: issuedAt + MAX_COOKIE_AGE_SECONDS,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifyBetaSessionCookie(value: string | undefined, secret: string, now = new Date()) {
  if (!value || !secret) return null;

  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  if ((await signPayload(payload, secret)) !== signature) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<BetaSession>;
    if (!parsed.email || parsed.entitlement !== 'beta_access') return null;
    if (typeof parsed.issuedAt !== 'number') return null;
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Math.floor(now.getTime() / 1000)) return null;

    return {
      email: parsed.email,
      entitlement: 'beta_access' as const,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function getBetaSessionMaxAgeSeconds() {
  return MAX_COOKIE_AGE_SECONDS;
}

async function signPayload(payload: string, secret: string) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}
