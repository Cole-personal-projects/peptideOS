export type FeatureTier = 'free' | 'pro';

export type FeatureId =
  | 'ai-assistant'
  | 'biometric-lock'
  | 'compound-catalog'
  | 'dose-calculator'
  | 'reconstitution-calculator';

export interface FeatureGate {
  feature: FeatureId;
  tier: FeatureTier;
  enforced: boolean;
  enabled: boolean;
}

const gates: Record<FeatureId, FeatureGate> = {
  'ai-assistant': { feature: 'ai-assistant', tier: 'pro', enforced: false, enabled: true },
  'biometric-lock': {
    feature: 'biometric-lock',
    tier: 'free',
    enforced: false,
    enabled: process.env.NEXT_PUBLIC_ENABLE_BIOMETRIC_LOCK === 'true',
  },
  'compound-catalog': { feature: 'compound-catalog', tier: 'free', enforced: false, enabled: true },
  'dose-calculator': { feature: 'dose-calculator', tier: 'free', enforced: false, enabled: true },
  'reconstitution-calculator': { feature: 'reconstitution-calculator', tier: 'free', enforced: false, enabled: true },
};

export function getFeatureGate(feature: FeatureId): FeatureGate {
  return gates[feature];
}

export function isFeatureEnabled(feature: FeatureId): boolean {
  return getFeatureGate(feature).enabled;
}
