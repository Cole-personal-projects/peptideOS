import { describe, expect, test } from 'vitest';
import { comparePersistedUserDataCounts, countPersistedUserRecords, shouldRestoreCloudData } from './cloud-sync-safety';
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

  test('compares local and cloud record counts by collection', () => {
    const comparison = comparePersistedUserDataCounts({
      localData: localInventoryData,
      cloudData: {
        ...emptyData,
        stacks: [
          {
            id: 'stack-cloud',
            name: 'Cloud protocol',
            description: '',
            peptides: [],
            startDate: '2026-06-24',
            durationDays: 30,
            status: 'active',
            notes: '',
          },
        ],
        labReports: [
          {
            id: 'lab-cloud',
            drawDate: '2026-06-24',
            uniqueImportKey: 'cloud-lab',
            notes: '',
            createdAt: '2026-06-24T12:00:00.000Z',
          },
        ],
      },
    });

    expect(comparison.find((item) => item.key === 'vials')).toEqual({
      key: 'vials',
      label: 'Inventory containers',
      localCount: 1,
      cloudCount: 0,
      delta: -1,
    });
    expect(comparison.find((item) => item.key === 'stacks')).toEqual({
      key: 'stacks',
      label: 'Protocols',
      localCount: 0,
      cloudCount: 1,
      delta: 1,
    });
    expect(comparison.find((item) => item.key === 'labReports')).toEqual({
      key: 'labReports',
      label: 'Lab reports',
      localCount: 0,
      cloudCount: 1,
      delta: 1,
    });
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
