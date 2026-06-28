import { describe, expect, test } from 'vitest';

import { getBetaCookieSecret, isApiPath, isBetaGateEnabled, isPublicBetaPath, safeBetaNextPath } from './beta-gate';

describe('beta gate helpers', () => {
  test('defaults enabled unless explicitly disabled', () => {
    expect(isBetaGateEnabled({})).toBe(true);
    expect(isBetaGateEnabled({ BETA_GATE_ENABLED: 'true' })).toBe(true);
    expect(isBetaGateEnabled({ BETA_GATE_ENABLED: 'false' })).toBe(false);
  });

  test('keeps beta, static, and service worker routes public', () => {
    expect(isPublicBetaPath('/beta')).toBe(true);
    expect(isPublicBetaPath('/api/beta/redeem')).toBe(true);
    expect(isPublicBetaPath('/sw.js')).toBe(true);
    expect(isPublicBetaPath('/manifest.json')).toBe(true);
    expect(isPublicBetaPath('/_next/static/chunk.js')).toBe(true);
    expect(isPublicBetaPath('/stacks')).toBe(false);
  });

  test('detects protected api routes and safe next paths', () => {
    expect(isApiPath('/api/ai/propose-action')).toBe(true);
    expect(isApiPath('/labs')).toBe(false);
    expect(safeBetaNextPath('/labs?view=timeline')).toBe('/labs?view=timeline');
    expect(safeBetaNextPath('https://evil.example')).toBe('/');
    expect(safeBetaNextPath('//evil.example')).toBe('/');
    expect(safeBetaNextPath('/beta')).toBe('/');
  });

  test('resolves signing secret from server-only env values', () => {
    expect(getBetaCookieSecret({ BETA_GATE_COOKIE_SECRET: ' explicit ' })).toBe('explicit');
    expect(getBetaCookieSecret({ SUPABASE_SERVICE_ROLE_KEY: 'service' })).toBe('service');
    expect(getBetaCookieSecret({ ANTHROPIC_API_KEY: 'anthropic' })).toBe('anthropic');
    expect(getBetaCookieSecret({})).toBe('');
  });
});
