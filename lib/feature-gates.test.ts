import { describe, expect, test } from 'vitest';
import { getFeatureGate } from './feature-gates';

describe('feature gates', () => {
  test('gates AI assistant features behind the pro tier', () => {
    expect(getFeatureGate('ai-assistant')).toEqual({
      feature: 'ai-assistant',
      tier: 'pro',
      enforced: false,
    });
  });

  test('keeps catalog and calculators free', () => {
    expect(getFeatureGate('compound-catalog').tier).toBe('free');
    expect(getFeatureGate('dose-calculator').tier).toBe('free');
    expect(getFeatureGate('reconstitution-calculator').tier).toBe('free');
  });
});
