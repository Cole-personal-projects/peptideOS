import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPeptideOSDatabase, type PeptideOSDatabase } from './db';
import {
  downloadUserData,
  exportUserData,
  importUserData,
  loadPersistedAppData,
  resetPersistedAppData,
  savePersistedAppData,
} from './persistence';
import { initialAppData } from './mock-data';
import type { AppData } from './types';

let db: PeptideOSDatabase;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

beforeEach(() => {
  db = createPeptideOSDatabase(`PeptideOSTest-${crypto.randomUUID()}`);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db.delete();
});

describe('Dexie persistence', () => {
  test('loads bundled defaults when local storage is empty', async () => {
    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.vials).toHaveLength(initialAppData.vials.length);
    expect(loaded.peptides).toHaveLength(initialAppData.peptides.length);
    expect(loaded.hasCompletedOnboarding).toBe(false);
  });

  test('saves and reloads user-owned data without persisting peptide reference data', async () => {
    const saved: AppData = {
      ...clone(initialAppData),
      peptides: [],
      vials: [
        {
          ...initialAppData.vials[0],
          id: 'vial-persisted',
          name: 'Persisted vial',
        },
      ],
      doses: [],
      stacks: [],
      schedules: [],
      scheduleLogs: [],
      hasSeenDisclaimer: true,
      hasCompletedOnboarding: true,
      userMode: 'researcher',
    };

    await savePersistedAppData(db, saved);
    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.peptides).toHaveLength(initialAppData.peptides.length);
    expect(loaded.vials).toHaveLength(1);
    expect(loaded.vials[0]?.name).toBe('Persisted vial');
    expect(loaded.hasCompletedOnboarding).toBe(true);
    expect(loaded.userMode).toBe('researcher');
    expect(loaded.stacks).toEqual([]);
  });

  test('saves and reloads schedules and schedule logs', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      stacks: [],
      schedules: [
        {
          id: 'schedule-persisted',
          stackId: 'stack-1',
          stackPeptideId: 'stack-1-item-bpc-157-0',
          peptideId: 'bpc-157',
          doseValue: 250,
          doseUnit: 'mcg',
          route: 'subq',
          recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
          startDate: '2026-05-23T00:00:00.000Z',
          endDate: '2026-06-01T00:00:00.000Z',
          status: 'active',
        },
      ],
      scheduleLogs: [
        {
          id: 'schedule-log-persisted',
          scheduleId: 'schedule-persisted',
          stackId: 'stack-1',
          stackPeptideId: 'stack-1-item-bpc-157-0',
          peptideId: 'bpc-157',
          dueAt: '2026-05-23T08:00:00.000Z',
          status: 'pending',
        },
      ],
    });

    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.schedules).toHaveLength(1);
    expect(loaded.schedules[0]?.recurrence).toEqual({ frequency: 'daily', timesOfDay: ['08:00'] });
    expect(loaded.scheduleLogs).toEqual([
      expect.objectContaining({
        id: 'schedule-log-persisted',
        scheduleId: 'schedule-persisted',
        status: 'pending',
      }),
    ]);
  });

  test('reset clears local user data and restores defaults', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [{ ...initialAppData.vials[0], id: 'vial-reset', name: 'Reset me' }],
      hasCompletedOnboarding: true,
      hasSeenDisclaimer: true,
    });

    const reset = await resetPersistedAppData(db, initialAppData);
    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(reset.hasCompletedOnboarding).toBe(false);
    expect(loaded.vials).toHaveLength(initialAppData.vials.length);
    expect(loaded.vials.some((vial) => vial.id === 'vial-reset')).toBe(false);
  });

  test('exports user-owned data with schema metadata', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [{ ...initialAppData.vials[0], id: 'vial-export', name: 'Exported vial' }],
      hasCompletedOnboarding: true,
    });

    const exported = await exportUserData(db, new Date('2026-05-23T00:00:00.000Z'));

    expect(exported.schemaVersion).toBe(2);
    expect(exported.exportedAt).toBe('2026-05-23T00:00:00.000Z');
    expect(exported.data.vials).toHaveLength(1);
    expect(exported.data.vials[0]?.name).toBe('Exported vial');
    expect(exported.data.settings.hasCompletedOnboarding).toBe(true);
    expect(exported.data.schedules).toEqual([]);
    expect(exported.data.scheduleLogs).toEqual([]);
    expect(exported.data).not.toHaveProperty('peptides');
  });

  test('export falls back to default settings when settings have not been saved', async () => {
    const exported = await exportUserData(db, new Date('2026-05-23T00:00:00.000Z'));

    expect(exported.data.settings).toEqual({
      hasSeenDisclaimer: false,
      hasCompletedOnboarding: false,
      userMode: 'beginner',
      biometricLock: false,
      darkMode: true,
    });
  });

  test('exports active schedules and omits deleted schedule rows', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      schedules: [
        {
          id: 'schedule-export-active',
          stackId: 'stack-1',
          stackPeptideId: 'stack-1-item-bpc-157-0',
          peptideId: 'bpc-157',
          doseValue: 250,
          doseUnit: 'mcg',
          route: 'subq',
          recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
          startDate: '2026-05-23T00:00:00.000Z',
          endDate: '2026-05-24T23:59:59.999Z',
          status: 'active',
        },
      ],
      scheduleLogs: [
        {
          id: 'schedule-log-export-active',
          scheduleId: 'schedule-export-active',
          stackId: 'stack-1',
          stackPeptideId: 'stack-1-item-bpc-157-0',
          peptideId: 'bpc-157',
          dueAt: '2026-05-23T08:00:00.000Z',
          status: 'pending',
        },
      ],
    });
    await db.schedules.put({
      id: 'schedule-export-deleted',
      stackId: 'stack-1',
      stackPeptideId: 'deleted-item',
      peptideId: 'bpc-157',
      doseValue: 250,
      doseUnit: 'mcg',
      route: 'subq',
      recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
      startDate: '2026-05-23T00:00:00.000Z',
      endDate: '2026-05-24T23:59:59.999Z',
      status: 'active',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z',
      deletedAt: '2026-05-23T01:00:00.000Z',
      syncState: 'dirty',
    });

    const exported = await exportUserData(db, new Date('2026-05-23T00:00:00.000Z'));

    expect(exported.data.schedules.map((schedule) => schedule.id)).toEqual(['schedule-export-active']);
    expect(exported.data.scheduleLogs.map((log) => log.id)).toEqual(['schedule-log-export-active']);
  });

  test('imports exported user data and reloads it with bundled reference peptides', async () => {
    const exported = {
      schemaVersion: 2,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [{ ...initialAppData.vials[0], id: 'vial-imported', name: 'Imported vial' }],
        doses: [],
        stacks: [
          {
            ...initialAppData.stacks[0],
            id: 'stack-imported',
            name: 'Imported stack',
            peptides: initialAppData.stacks[0].peptides.map(({ id: _id, ...peptide }) => peptide),
          },
        ],
        schedules: [],
        scheduleLogs: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'researcher' as const,
          biometricLock: false,
          darkMode: false,
        },
      },
    };

    const imported = await importUserData(db, initialAppData, JSON.stringify(exported), new Date('2026-05-24T00:00:00.000Z'));
    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(imported.vials).toEqual([expect.objectContaining({ id: 'vial-imported', name: 'Imported vial' })]);
    expect(loaded.peptides).toHaveLength(initialAppData.peptides.length);
    expect(loaded.vials).toEqual([expect.objectContaining({ id: 'vial-imported', name: 'Imported vial' })]);
    expect(loaded.stacks[0]).toEqual(expect.objectContaining({
      id: 'stack-imported',
      name: 'Imported stack',
    }));
    expect(loaded.stacks[0]?.peptides[0]).toEqual(expect.objectContaining({ id: 'stack-imported-item-bpc-157-0' }));
    expect(loaded.hasCompletedOnboarding).toBe(true);
    expect(loaded.userMode).toBe('researcher');
    expect(loaded.darkMode).toBe(false);
  });

  test('rejects invalid import JSON without overwriting current local data', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [{ ...initialAppData.vials[0], id: 'vial-keep', name: 'Keep me' }],
      hasCompletedOnboarding: true,
    });

    await expect(importUserData(db, initialAppData, '{not-json')).rejects.toThrow(/valid PeptideOS export/i);
    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.vials).toEqual([expect.objectContaining({ id: 'vial-keep', name: 'Keep me' })]);
    expect(loaded.hasCompletedOnboarding).toBe(true);
  });

  test('rejects unsupported import schema versions without overwriting current local data', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [{ ...initialAppData.vials[0], id: 'vial-schema-keep', name: 'Schema keep' }],
    });

    await expect(importUserData(db, initialAppData, JSON.stringify({
      schemaVersion: 999,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        settings: {
          hasSeenDisclaimer: false,
          hasCompletedOnboarding: false,
          userMode: 'beginner',
          biometricLock: false,
          darkMode: true,
        },
      },
    }))).rejects.toThrow(/unsupported/i);
    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.vials).toEqual([expect.objectContaining({ id: 'vial-schema-keep' })]);
  });

  test('download creates a dated JSON file and revokes the object URL', () => {
    const anchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    };
    const append = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:peptideos-export');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor),
      body: { append },
    });
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    downloadUserData({
      schemaVersion: 1,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        settings: {
          hasSeenDisclaimer: false,
          hasCompletedOnboarding: false,
          userMode: 'beginner',
          biometricLock: false,
          darkMode: true,
        },
      },
    });

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.href).toBe('blob:peptideos-export');
    expect(anchor.download).toBe('peptideos-export-2026-05-23.json');
    expect(append).toHaveBeenCalledWith(anchor);
    expect(anchor.click).toHaveBeenCalled();
    expect(anchor.remove).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:peptideos-export');
  });

  test('bad metadata falls back to bundled defaults without crashing', async () => {
    await db.metadata.put({ key: 'schemaVersion', value: 'not-a-number' });
    await db.vials.put({
      ...initialAppData.vials[0],
      id: 'vial-bad-metadata',
      name: 'Bad metadata vial',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z',
      deletedAt: null,
      syncState: 'dirty',
    });

    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.vials).toHaveLength(initialAppData.vials.length);
    expect(loaded.vials.some((vial) => vial.id === 'vial-bad-metadata')).toBe(false);
  });
});
