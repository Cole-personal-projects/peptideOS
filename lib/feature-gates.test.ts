import { describe, expect, test } from 'vitest';
import { getFeatureGate, isFeatureEnabled } from './feature-gates';

describe('feature gates', () => {
  test('gates Peppi features behind the pro tier', () => {
    expect(getFeatureGate('ai-assistant')).toEqual({
      feature: 'ai-assistant',
      tier: 'pro',
      enforced: false,
      enabled: true,
    });
  });

  test('keeps catalog and calculators free', () => {
    expect(getFeatureGate('compound-catalog').tier).toBe('free');
    expect(getFeatureGate('dose-calculator').tier).toBe('free');
    expect(getFeatureGate('reconstitution-calculator').tier).toBe('free');
  });

  test('keeps biometric lock hidden unless explicitly enabled', () => {
    expect(getFeatureGate('biometric-lock')).toEqual({
      feature: 'biometric-lock',
      tier: 'free',
      enforced: false,
      enabled: false,
    });
    expect(isFeatureEnabled('biometric-lock')).toBe(false);
  });
});
