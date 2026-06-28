import { describe, expect, test } from 'vitest';

import { createBetaSessionCookie, verifyBetaSessionCookie } from './beta-session';

describe('beta session cookie', () => {
  test('creates and verifies signed beta sessions', async () => {
    const cookie = await createBetaSessionCookie('COLE@example.com', 'secret', new Date('2026-06-28T00:00:00Z'));
    const session = await verifyBetaSessionCookie(cookie, 'secret', new Date('2026-06-29T00:00:00Z'));

    expect(session).toMatchObject({
      email: 'cole@example.com',
      entitlement: 'beta_access',
    });
  });

  test('rejects tampered, expired, and wrong-secret sessions', async () => {
    const cookie = await createBetaSessionCookie('cole@example.com', 'secret', new Date('2026-06-28T00:00:00Z'));

    await expect(verifyBetaSessionCookie(`${cookie}x`, 'secret', new Date('2026-06-29T00:00:00Z'))).resolves.toBeNull();
    await expect(verifyBetaSessionCookie(cookie, 'wrong', new Date('2026-06-29T00:00:00Z'))).resolves.toBeNull();
    await expect(verifyBetaSessionCookie(cookie, 'secret', new Date('2027-06-29T00:00:00Z'))).resolves.toBeNull();
  });
});
