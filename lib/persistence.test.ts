import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPeptideOSDatabase, type PeptideOSDatabase } from './db';
import {
  downloadUserData,
  exportUserData,
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

    expect(exported.schemaVersion).toBe(1);
    expect(exported.exportedAt).toBe('2026-05-23T00:00:00.000Z');
    expect(exported.data.vials).toHaveLength(1);
    expect(exported.data.vials[0]?.name).toBe('Exported vial');
    expect(exported.data.settings.hasCompletedOnboarding).toBe(true);
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
