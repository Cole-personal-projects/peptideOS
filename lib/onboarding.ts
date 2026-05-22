import type { AppData, UserMode } from './types';

export function completeOnboarding(data: AppData, userMode: UserMode = 'beginner'): AppData {
  return {
    ...data,
    hasSeenDisclaimer: true,
    hasCompletedOnboarding: true,
    userMode,
  };
}
