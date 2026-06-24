import { describe, expect, test } from 'vitest';
import { countPersistedUserRecords, shouldRestoreCloudData } from './cloud-sync-safety';
import type { PersistedUserData } from './persistence';

const settings = {
  hasSeenDisclaimer: true,
  hasCompletedOnboarding: true,
  userMode: 'researcher' as const,
  biometricLock: false,
  darkMode: false,
  cloudSyncEnabled: true,
};

const emptyData: PersistedUserData = {
  vials: [],
  inventoryBatches: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
  reconstitutionCalculations: [],
  signalCheckIns: [],
  labReports: [],
  labResults: [],
  labImportAudits: [],
  userCompounds: [],
  settings,
};

const localInventoryData: PersistedUserData = {
  ...emptyData,
  vials: [
    {
      id: 'vial-local',
      name: 'Local inventory vial',
      peptideId: 'ghk-cu',
      containerType: 'lyophilized-vial',
      dateAdded: '2026-06-24',
      source: '',
      lotNumber: '',
      mg: 50,
      totalAmount: { value: 50, unit: 'mg' },
      bacWaterMl: 0,
      reconstitutedDate: null,
      expirationDate: '',
      status: 'sealed',
    },
  ],
};

describe('cloud sync safety decisions', () => {
  test('counts persisted user records outside settings', () => {
    expect(countPersistedUserRecords(emptyData)).toBe(0);
    expect(countPersistedUserRecords(localInventoryData)).toBe(1);
  });

  test('allows automatic cloud restore for an empty local device', () => {
    expect(shouldRestoreCloudData({
      automatic: true,
      cloudData: localInventoryData,
      cloudPulledAt: '2026-06-24T12:00:00.000Z',
      localData: emptyData,
      localLastSavedAt: null,
    })).toEqual({ restore: true, reason: 'empty-local' });
  });

  test('allows automatic cloud restore when cloud is newer than local data', () => {
    expect(shouldRestoreCloudData({
      automatic: true,
      cloudData: localInventoryData,
      cloudPulledAt: '2026-06-24T12:00:00.000Z',
      localData: localInventoryData,
      localLastSavedAt: '2026-06-24T11:59:00.000Z',
    })).toEqual({ restore: true, reason: 'newer-cloud' });
  });

  test('preserves local user records when automatic cloud data is stale', () => {
    expect(shouldRestoreCloudData({
      automatic: true,
      cloudData: emptyData,
      cloudPulledAt: '2026-06-24T11:00:00.000Z',
      localData: localInventoryData,
      localLastSavedAt: '2026-06-24T12:00:00.000Z',
    })).toEqual({ restore: false, reason: 'preserve-local' });
  });

  test('allows explicit manual retrieve even when cloud is older', () => {
    expect(shouldRestoreCloudData({
      automatic: false,
      cloudData: emptyData,
      cloudPulledAt: '2026-06-24T11:00:00.000Z',
      localData: localInventoryData,
      localLastSavedAt: '2026-06-24T12:00:00.000Z',
    })).toEqual({ restore: true, reason: 'manual-retrieve' });
  });
});
