import { NextRequest } from 'next/server';
import { afterEach, describe, expect, test } from 'vitest';

import { middleware } from './middleware';
import { BETA_SESSION_COOKIE, createBetaSessionCookie } from './lib/beta-session';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('beta middleware', () => {
  test('redirects protected pages without beta access', async () => {
    process.env.BETA_GATE_ENABLED = 'true';
    process.env.BETA_GATE_COOKIE_SECRET = 'secret';

    const response = await middleware(new NextRequest('https://peptide-os.net/labs?view=timeline'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://peptide-os.net/beta?next=%2Flabs%3Fview%3Dtimeline');
  });

  test('returns json 401 for protected api routes without beta access', async () => {
    process.env.BETA_GATE_ENABLED = 'true';
    process.env.BETA_GATE_COOKIE_SECRET = 'secret';

    const response = await middleware(new NextRequest('https://peptide-os.net/api/ai/propose-action'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Beta access required.' });
  });

  test('allows public beta and asset routes without beta access', async () => {
    process.env.BETA_GATE_ENABLED = 'true';
    process.env.BETA_GATE_COOKIE_SECRET = 'secret';

    const betaResponse = await middleware(new NextRequest('https://peptide-os.net/beta'));
    const redeemResponse = await middleware(new NextRequest('https://peptide-os.net/api/beta/redeem'));
    const assetResponse = await middleware(new NextRequest('https://peptide-os.net/sw.js'));

    expect(betaResponse.headers.get('x-middleware-next')).toBe('1');
    expect(redeemResponse.headers.get('x-middleware-next')).toBe('1');
    expect(assetResponse.headers.get('x-middleware-next')).toBe('1');
  });

  test('allows protected routes with a valid beta cookie', async () => {
    process.env.BETA_GATE_ENABLED = 'true';
    process.env.BETA_GATE_COOKIE_SECRET = 'secret';
    const cookie = await createBetaSessionCookie('cole@example.com', 'secret');

    const request = new NextRequest('https://peptide-os.net/');
    request.cookies.set(BETA_SESSION_COOKIE, cookie);
    const response = await middleware(request);

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  test('can be disabled for local browser smoke tests', async () => {
    process.env.BETA_GATE_ENABLED = 'false';

    const response = await middleware(new NextRequest('https://peptide-os.net/'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
