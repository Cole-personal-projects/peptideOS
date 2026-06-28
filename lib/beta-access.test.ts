import { describe, expect, test } from 'vitest';

import { betaRedemptionMessage, normalizeBetaEmail, normalizeInviteCode } from './beta-access';

describe('beta access helpers', () => {
  test('normalizes email and invite codes for redemption', () => {
    expect(normalizeBetaEmail('  COLE@example.COM  ')).toBe('cole@example.com');
    expect(normalizeInviteCode(' pos-abc 123 ')).toBe('POS-ABC123');
  });

  test('maps redemption outcomes to user-facing copy', () => {
    expect(betaRedemptionMessage({ ok: true })).toBe('Beta access confirmed.');
    expect(betaRedemptionMessage({ ok: true, alreadyRedeemed: true })).toBe('Beta access restored.');
    expect(betaRedemptionMessage({ ok: false, reason: 'invalid_code' })).toBe('That beta key is not valid.');
    expect(betaRedemptionMessage({ ok: false, reason: 'code_full' })).toBe(
      'That beta key has already been fully used.',
    );
    expect(betaRedemptionMessage({ ok: false, reason: 'invalid_request' })).toBe(
      'Enter a valid email and beta key.',
    );
  });
});
