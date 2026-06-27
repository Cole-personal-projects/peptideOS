import { describe, expect, test } from 'vitest';

import {
  BETA_ACCESS_ENTITLEMENT,
  betaRedemptionMessage,
  hasActiveBetaAccess,
  isBetaGateEnabled,
  normalizeInviteCode,
  type BetaEntitlement,
} from './beta-access';

describe('beta access', () => {
  test('is explicitly enabled by public environment flag', () => {
    expect(isBetaGateEnabled({})).toBe(false);
    expect(isBetaGateEnabled({ NEXT_PUBLIC_BETA_GATE_ENABLED: 'false' })).toBe(false);
    expect(isBetaGateEnabled({ NEXT_PUBLIC_BETA_GATE_ENABLED: 'true' })).toBe(true);
  });

  test('normalizes invite codes for stable redemption UX', () => {
    expect(normalizeInviteCode('  pep beta 2026  ')).toBe('PEPBETA2026');
expect(normalizeInviteCode('pep-beta-2026')).toBe('PEP-BETA-2026');
});

test('detects active beta entitlement inside validity window', () => {
    const now = new Date('2026-06-26T12:00:00.000Z');
    const active: BetaEntitlement = {
      entitlement: BETA_ACCESS_ENTITLEMENT,
      active: true,
      starts_at: '2026-06-01T00:00:00.000Z',
      ends_at: null,
    };
    const expired: BetaEntitlement = { ...active, ends_at: '2026-06-01T00:00:00.000Z' };
    const future: BetaEntitlement = { ...active, starts_at: '2026-07-01T00:00:00.000Z' };
    const inactive: BetaEntitlement = { ...active, active: false };
    const wrongEntitlement: BetaEntitlement = { ...active, entitlement: 'premium' };

    expect(hasActiveBetaAccess([active], now)).toBe(true);
    expect(hasActiveBetaAccess([expired], now)).toBe(false);
    expect(hasActiveBetaAccess([future], now)).toBe(false);
    expect(hasActiveBetaAccess([inactive], now)).toBe(false);
    expect(hasActiveBetaAccess([wrongEntitlement], now)).toBe(false);
  });

  test('formats redemption outcomes without leaking implementation detail', () => {
    expect(betaRedemptionMessage({ ok: true })).toBe('Beta access unlocked.');
    expect(betaRedemptionMessage({ ok: true, alreadyRedeemed: true })).toBe('Invite already redeemed. Access restored.');
    expect(betaRedemptionMessage({ ok: false, reason: 'code_full' })).toBe('That invite code has already been fully used.');
    expect(betaRedemptionMessage({ ok: false, message: 'Server unavailable.' })).toBe('Server unavailable.');
  });
});
