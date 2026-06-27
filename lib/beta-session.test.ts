import { describe, expect, test } from 'vitest';

import { createBetaSessionCookie, verifyBetaSessionCookie } from './beta-session';

describe('beta session cookie', () => {
  test('creates and verifies signed beta access sessions', () => {
    const now = new Date('2026-06-26T12:00:00.000Z');
    const cookie = createBetaSessionCookie(' Tester@Example.com ', 'secret', now);

    expect(verifyBetaSessionCookie(cookie, 'secret', now)).toMatchObject({
      email: 'tester@example.com',
      entitlement: 'beta_access',
    });
  });

  test('rejects tampered, expired, or wrong-secret sessions', () => {
    const now = new Date('2026-06-26T12:00:00.000Z');
    const cookie = createBetaSessionCookie('tester@example.com', 'secret', now);
    const expiredNow = new Date('2027-01-01T12:00:00.000Z');

    expect(verifyBetaSessionCookie(cookie.replace('a', 'b'), 'secret', now)).toBeNull();
    expect(verifyBetaSessionCookie(cookie, 'wrong-secret', now)).toBeNull();
    expect(verifyBetaSessionCookie(cookie, 'secret', expiredNow)).toBeNull();
    expect(verifyBetaSessionCookie(undefined, 'secret', now)).toBeNull();
  });
});
