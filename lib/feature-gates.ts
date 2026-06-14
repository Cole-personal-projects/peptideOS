export type FeatureTier = 'free' | 'pro';

export type FeatureId =
  | 'ai-assistant'
  | 'compound-catalog'
  | 'dose-calculator'
  | 'reconstitution-calculator';

export interface FeatureGate {
  feature: FeatureId;
  tier: FeatureTier;
  enforced: boolean;
}

const gates: Record<FeatureId, FeatureGate> = {
  'ai-assistant': { feature: 'ai-assistant', tier: 'pro', enforced: false },
  'compound-catalog': { feature: 'compound-catalog', tier: 'free', enforced: false },
  'dose-calculator': { feature: 'dose-calculator', tier: 'free', enforced: false },
  'reconstitution-calculator': { feature: 'reconstitution-calculator', tier: 'free', enforced: false },
};

export function getFeatureGate(feature: FeatureId): FeatureGate {
  return gates[feature];
}
