export const BETA_ACCESS_ENTITLEMENT = 'beta_access';

export type BetaRedemptionReason =
  | 'invalid_code'
  | 'inactive_code'
  | 'expired_code'
  | 'code_full'
  | 'invalid_request'
  | 'server_error'
  | 'not_configured';

export interface BetaRedemptionResult {
  ok: boolean;
  reason?: BetaRedemptionReason;
  entitlement?: string;
  alreadyRedeemed?: boolean;
  remainingRedemptions?: number;
  message?: string;
}

export function normalizeInviteCode(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function normalizeBetaEmail(value: string) {
  return value.trim().toLowerCase();
}

export function betaRedemptionMessage(result: BetaRedemptionResult) {
  if (result.ok) return result.alreadyRedeemed ? 'Beta access restored.' : 'Beta access confirmed.';

  switch (result.reason) {
    case 'invalid_code':
      return 'That beta key is not valid.';
    case 'inactive_code':
      return 'That beta key is no longer active.';
    case 'expired_code':
      return 'That beta key has expired.';
    case 'code_full':
      return 'That beta key has already been fully used.';
    case 'invalid_request':
      return 'Enter a valid email and beta key.';
    case 'not_configured':
      return 'Beta access is not configured on this deployment.';
    case 'server_error':
      return 'Could not confirm beta access right now.';
    default:
      return result.message ?? 'Could not confirm beta access right now.';
  }
}
