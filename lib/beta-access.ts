export const BETA_ACCESS_ENTITLEMENT = 'beta_access';

export type BetaAccessState = 'disabled' | 'loading' | 'signed-out' | 'locked' | 'granted' | 'error';

export interface BetaEntitlement {
  entitlement: string;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
}

export interface BetaRedemptionResult {
  ok: boolean;
  reason?: 'invalid_code' | 'inactive_code' | 'expired_code' | 'code_full' | 'invalid_request';
  entitlement?: string;
  alreadyRedeemed?: boolean;
  remainingRedemptions?: number;
  message?: string;
}

export function isBetaGateEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NEXT_PUBLIC_BETA_GATE_ENABLED === 'true';
}

export function normalizeInviteCode(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function hasActiveBetaAccess(entitlements: BetaEntitlement[], now = new Date()) {
  return entitlements.some((entitlement) => {
    if (entitlement.entitlement !== BETA_ACCESS_ENTITLEMENT || !entitlement.active) return false;
    if (new Date(entitlement.starts_at).getTime() > now.getTime()) return false;
    return !entitlement.ends_at || new Date(entitlement.ends_at).getTime() > now.getTime();
  });
}

export function betaRedemptionMessage(result: BetaRedemptionResult) {
  if (result.ok) return result.alreadyRedeemed ? 'Invite already redeemed. Access restored.' : 'Beta access unlocked.';

  switch (result.reason) {
    case 'invalid_code':
      return 'That invite code is not valid.';
    case 'inactive_code':
      return 'That invite code is no longer active.';
    case 'expired_code':
      return 'That invite code has expired.';
    case 'code_full':
      return 'That invite code has already been fully used.';
    case 'invalid_request':
      return 'Enter a valid invite code.';
    default:
      return result.message ?? 'Could not redeem that invite code.';
  }
}
