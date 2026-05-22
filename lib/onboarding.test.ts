import { describe, expect, test } from 'vitest';
import { completeOnboarding } from './onboarding';
import type { AppData } from './types';

const baseData: AppData = {
  peptides: [],
  vials: [],
  doses: [],
  stacks: [],
  hasSeenDisclaimer: false,
  hasCompletedOnboarding: false,
  userMode: 'beginner',
  biometricLock: false,
  darkMode: true,
};

describe('onboarding state', () => {
  test('quick accept completes onboarding in beginner mode', () => {
    expect(completeOnboarding(baseData)).toMatchObject({
      hasSeenDisclaimer: true,
      hasCompletedOnboarding: true,
      userMode: 'beginner',
    });
  });

  test('setup completion preserves selected researcher mode', () => {
    expect(completeOnboarding(baseData, 'researcher')).toMatchObject({
      hasSeenDisclaimer: true,
      hasCompletedOnboarding: true,
      userMode: 'researcher',
    });
  });
});
