import { createHmac, timingSafeEqual } from 'node:crypto';

export const BETA_SESSION_COOKIE = 'peptideos_beta_access';
const MAX_COOKIE_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface BetaSession {
  email: string;
  entitlement: 'beta_access';
  issuedAt: number;
  expiresAt: number;
}

export function createBetaSessionCookie(email: string, secret: string, now = new Date()) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const session: BetaSession = {
    email: email.trim().toLowerCase(),
    entitlement: 'beta_access',
    issuedAt,
    expiresAt: issuedAt + MAX_COOKIE_AGE_SECONDS,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyBetaSessionCookie(value: string | undefined, secret: string, now = new Date()): BetaSession | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  if (!safeEqual(signature, signPayload(payload, secret))) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<BetaSession>;
    if (!parsed.email || parsed.entitlement !== 'beta_access') return null;
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Math.floor(now.getTime() / 1000)) return null;
    if (typeof parsed.issuedAt !== 'number') return null;
    return {
      email: parsed.email,
      entitlement: 'beta_access',
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

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}
