import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createPeptideOSDatabase,
  createScopedPeptideOSDatabase,
  getPersistenceOwnerId,
  type PeptideOSDatabase,
} from './db';
import {
  downloadUserData,
  exportUserData,
  importUserData,
  loadPersistedAppData,
  resetPersistedAppData,
  savePersistedAppData,
  validateUserDataExport,
} from './persistence';
import { initialAppData, mockDoses, mockStacks, mockVials } from './mock-data';
import { referenceCompounds } from './reference-compounds';
import type { AppData, Compound } from './types';

let db: PeptideOSDatabase;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const customCompound: Compound = {
  id: 'custom-compound',
  name: 'Custom Compound',
  aliases: ['Custom alias'],
  compoundType: 'peptide',
  category: 'custom',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [2],
  },
  beginnerSummary: 'User-entered compound.',
  researcherDetails: 'User-entered compound details.',
  safety: 'User-entered safety notes.',
  storage: 'User-entered storage notes.',
  citations: [],
  source: 'user',
  curationStatus: 'draft',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
  deletedAt: null,
  syncState: 'dirty',
};

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
    expect(loaded.compounds).toHaveLength(referenceCompounds.length);
    expect(loaded.hasCompletedOnboarding).toBe(false);
  });

  test('saves and reloads user-owned data without persisting peptide reference data', async () => {
    const saved: AppData = {
      ...clone(initialAppData),
      peptides: [],
      compounds: [],
      vials: [
        {
          ...mockVials[0],
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
    expect(loaded.compounds).toHaveLength(referenceCompounds.length);
    expect(loaded.vials).toHaveLength(1);
    expect(loaded.vials[0]?.name).toBe('Persisted vial');
    expect(loaded.hasCompletedOnboarding).toBe(true);
    expect(loaded.userMode).toBe('researcher');
    expect(loaded.stacks).toEqual([]);
  });

  test('keeps local-only and signed-in persistence profiles isolated', async () => {
    const localDb = createScopedPeptideOSDatabase();
    const signedInDb = createScopedPeptideOSDatabase(getPersistenceOwnerId({ id: 'amy-user-id' }));

    try {
      await savePersistedAppData(localDb, {
        ...clone(initialAppData),
        vials: [{ ...mockVials[0], id: 'vial-local', name: 'Local-only vial' }],
      });
      await savePersistedAppData(signedInDb, {
        ...clone(initialAppData),
        vials: [{ ...mockVials[0], id: 'vial-amy', name: 'Amy cloud profile vial' }],
      });

      const localLoaded = await loadPersistedAppData(localDb, initialAppData);
      const signedInLoaded = await loadPersistedAppData(signedInDb, initialAppData);

      expect(localLoaded.vials).toEqual([expect.objectContaining({ id: 'vial-local' })]);
      expect(signedInLoaded.vials).toEqual([expect.objectContaining({ id: 'vial-amy' })]);
    } finally {
      await localDb.delete();
      await signedInDb.delete();
    }
  });

  test('records the persistence owner on scoped saves', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [{ ...mockVials[0], id: 'vial-owner-metadata', name: 'Owner metadata vial' }],
    }, new Date('2026-06-16T00:00:00.000Z'), { ownerId: 'user:amy-user-id' });

    await expect(db.metadata.get('ownerId')).resolves.toEqual({
      key: 'ownerId',
      value: 'user:amy-user-id',
    });
  });

  test('saves and reloads inventory batches linked to physical vials', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [
        {
          ...mockVials[0],
          id: 'vial-batch-1',
          name: 'KPV kit vial 1 of 10',
          peptideId: 'kpv',
          inventoryBatchId: 'batch-kpv-kit',
          totalAmount: { value: 10, unit: 'mg' },
          lotNumber: 'KPV-001',
        },
        {
          ...mockVials[0],
          id: 'vial-batch-2',
          name: 'KPV kit vial 2 of 10',
          peptideId: 'kpv',
          inventoryBatchId: 'batch-kpv-kit',
          totalAmount: { value: 10, unit: 'mg' },
          lotNumber: 'KPV-001',
        },
      ],
      inventoryBatches: [
        {
          id: 'batch-kpv-kit',
          name: 'KPV kit',
          peptideId: 'kpv',
          containerType: 'lyophilized-vial',
          dateAdded: '2026-06-15',
          source: 'Source A',
          lotNumber: 'KPV-001',
          mg: 10,
          totalAmount: { value: 10, unit: 'mg' },
          packageUnit: 'kit',
          packageQuantity: 1,
          vialCount: 2,
          createdFrom: 'manual',
        },
      ],
    });

    const loaded = await loadPersistedAppData(db, initialAppData);
    const exported = await exportUserData(db, new Date('2026-06-15T00:00:00.000Z'));

    expect(loaded.inventoryBatches).toEqual([
      expect.objectContaining({ id: 'batch-kpv-kit', vialCount: 2 }),
    ]);
    expect(loaded.vials.map((vial) => vial.inventoryBatchId)).toEqual(['batch-kpv-kit', 'batch-kpv-kit']);
    expect(exported.schemaVersion).toBe(7);
    expect(exported.data.inventoryBatches).toEqual([
      expect.objectContaining({ id: 'batch-kpv-kit', vialCount: 2 }),
    ]);
  });

  test('prunes historical bundled demo data from older persisted databases while keeping user records', async () => {
    const now = '2026-06-14T00:00:00.000Z';
    const userVial = {
      ...mockVials[0],
      id: 'vial-user-entered',
      name: 'User entered KPV vial',
      peptideId: 'kpv',
      lotNumber: 'USER-KPV-001',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'dirty' as const,
    };
    const userDose = {
      ...mockDoses[0]!,
      id: 'dose-user-entered',
      peptideId: 'kpv',
      vialId: userVial.id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'dirty' as const,
    };
    const userStack = {
      ...mockStacks[0]!,
      id: 'stack-user-entered',
      name: 'User entered stack',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'dirty' as const,
    };

    await db.vials.bulkPut([
      ...mockVials.map((vial) => ({
        ...vial,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty' as const,
      })),
      userVial,
    ]);
    await db.doses.bulkPut([
      ...mockDoses.map((dose) => ({
        ...dose,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty' as const,
      })),
      userDose,
    ]);
    await db.stacks.bulkPut([
      ...mockStacks.map((stack) => ({
        ...stack,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty' as const,
      })),
      userStack,
    ]);
    await db.schedules.bulkPut([
      {
        id: 'schedule-demo',
        stackId: 'stack-1',
        stackPeptideId: 'stack-1-item-bpc-157-0',
        peptideId: 'bpc-157',
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
        startDate: now,
        endDate: '2026-06-21T00:00:00.000Z',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty',
      },
      {
        id: 'schedule-user',
        stackId: userStack.id,
        stackPeptideId: 'stack-user-entered-item-kpv-0',
        peptideId: 'kpv',
        doseValue: 1,
        doseUnit: 'mg',
        route: 'subq',
        recurrence: { frequency: 'daily', timesOfDay: ['09:00'] },
        startDate: now,
        endDate: '2026-06-21T00:00:00.000Z',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty',
      },
    ]);
    await db.scheduleLogs.bulkPut([
      {
        id: 'schedule-log-demo',
        scheduleId: 'schedule-demo',
        stackId: 'stack-1',
        stackPeptideId: 'stack-1-item-bpc-157-0',
        peptideId: 'bpc-157',
        dueAt: now,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty',
      },
      {
        id: 'schedule-log-user',
        scheduleId: 'schedule-user',
        stackId: userStack.id,
        stackPeptideId: 'stack-user-entered-item-kpv-0',
        peptideId: 'kpv',
        dueAt: now,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncState: 'dirty',
      },
    ]);
    await db.settings.put({
      id: 'app-settings',
      hasSeenDisclaimer: true,
      hasCompletedOnboarding: true,
      userMode: 'beginner',
      biometricLock: false,
      darkMode: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'dirty',
    });
    await db.metadata.bulkPut([
      { key: 'schemaVersion', value: 4 },
      { key: 'persisted', value: true },
    ]);

    const loaded = await loadPersistedAppData(db, initialAppData);
    const reloaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.vials).toEqual([expect.objectContaining({ id: userVial.id })]);
    expect(loaded.doses).toEqual([expect.objectContaining({ id: userDose.id })]);
    expect(loaded.stacks).toEqual([expect.objectContaining({ id: userStack.id })]);
    expect(loaded.schedules).toEqual([expect.objectContaining({ id: 'schedule-user' })]);
    expect(loaded.scheduleLogs).toEqual([expect.objectContaining({ id: 'schedule-log-user' })]);
    expect(loaded.hasCompletedOnboarding).toBe(true);
    expect(reloaded.vials).toEqual([expect.objectContaining({ id: userVial.id })]);
  });

  test('saves and reloads user compounds merged with bundled reference compounds', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      compounds: [...referenceCompounds, customCompound],
    });

    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.compounds.map((compound) => compound.id)).toEqual(expect.arrayContaining([
      'hgh-somatropin',
      'testosterone-cypionate',
      'custom-compound',
    ]));
    expect(loaded.compounds.find((compound) => compound.id === 'hgh-somatropin')?.source).toBe('bundled');
    expect(loaded.compounds.find((compound) => compound.id === 'custom-compound')).toEqual(expect.objectContaining({
      source: 'user',
      syncState: 'dirty',
    }));
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

  test('saves and reloads saved reconstitution calculations', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      reconstitutionCalculations: [
        {
          id: 'reconstitution-calc-persisted',
          compoundName: 'BPC-157',
          compoundId: 'bpc-157',
          vialSize: 5,
          vialUnit: 'mg',
          bacWaterMl: 2,
          doseValue: 250,
          doseUnit: 'mcg',
          drawUnits: 10,
          drawMl: 0.1,
          concentration: '2.5 mg/mL',
          dosesPerVial: 20,
          savedAt: '2026-05-23T00:00:00.000Z',
        },
      ],
    });

    const loaded = await loadPersistedAppData(db, initialAppData);

    expect(loaded.reconstitutionCalculations).toEqual([
      expect.objectContaining({
        id: 'reconstitution-calc-persisted',
        compoundId: 'bpc-157',
        drawUnits: 10,
      }),
    ]);
  });

  test('reset clears local user data and restores defaults', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      vials: [{ ...mockVials[0], id: 'vial-reset', name: 'Reset me' }],
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
      vials: [{ ...mockVials[0], id: 'vial-export', name: 'Exported vial' }],
      reconstitutionCalculations: [
        {
          id: 'reconstitution-calc-export',
          compoundName: 'BPC-157',
          compoundId: 'bpc-157',
          vialSize: 5,
          vialUnit: 'mg',
          bacWaterMl: 2,
          doseValue: 250,
          doseUnit: 'mcg',
          drawUnits: 10,
          drawMl: 0.1,
          concentration: '2.5 mg/mL',
          dosesPerVial: 20,
          savedAt: '2026-05-23T00:00:00.000Z',
        },
      ],
      hasCompletedOnboarding: true,
    });

    const exported = await exportUserData(db, new Date('2026-05-23T00:00:00.000Z'));

    expect(exported.schemaVersion).toBe(7);
    expect(exported.exportedAt).toBe('2026-05-23T00:00:00.000Z');
    expect(exported.data.vials).toHaveLength(1);
    expect(exported.data.vials[0]?.name).toBe('Exported vial');
    expect(exported.data.settings.hasCompletedOnboarding).toBe(true);
    expect(exported.data.schedules).toEqual([]);
    expect(exported.data.scheduleLogs).toEqual([]);
    expect(exported.data.reconstitutionCalculations).toEqual([
      expect.objectContaining({
        id: 'reconstitution-calc-export',
        compoundId: 'bpc-157',
        drawUnits: 10,
      }),
    ]);
    expect(exported.data.signalCheckIns).toEqual([]);
    expect(exported.data.userCompounds).toEqual([]);
    expect(exported.data).not.toHaveProperty('peptides');
    expect(exported.data).not.toHaveProperty('compounds');
  });

  test('exports user compounds without bundled reference compounds', async () => {
    await savePersistedAppData(db, {
      ...clone(initialAppData),
      compounds: [...referenceCompounds, customCompound],
    });

    const exported = await exportUserData(db, new Date('2026-05-23T00:00:00.000Z'));

    expect(exported.data.userCompounds).toEqual([expect.objectContaining({
      id: 'custom-compound',
      source: 'user',
    })]);
    expect(exported.data.userCompounds.some((compound) => compound.source === 'bundled')).toBe(false);
  });

  test('export falls back to default settings when settings have not been saved', async () => {
    const exported = await exportUserData(db, new Date('2026-05-23T00:00:00.000Z'));

    expect(exported.data.settings).toEqual({
      hasSeenDisclaimer: false,
      hasCompletedOnboarding: false,
      userMode: 'beginner',
      biometricLock: false,
      darkMode: true,
      cloudSyncEnabled: false,
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
        vials: [{ ...mockVials[0], id: 'vial-imported', name: 'Imported vial' }],
        doses: [],
        stacks: [
          {
            ...mockStacks[0],
            id: 'stack-imported',
            name: 'Imported stack',
            peptides: mockStacks[0]!.peptides.map(({ id: _id, ...peptide }) => peptide),
          },
        ],
        schedules: [],
        scheduleLogs: [],
        userCompounds: [customCompound],
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
    expect(loaded.compounds).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'hgh-somatropin', source: 'bundled' }),
      expect.objectContaining({ id: 'custom-compound', source: 'user' }),
    ]));
    expect(loaded.vials).toEqual([expect.objectContaining({ id: 'vial-imported', name: 'Imported vial' })]);
    expect(loaded.reconstitutionCalculations).toEqual([]);
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
      vials: [{ ...mockVials[0], id: 'vial-keep', name: 'Keep me' }],
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
      vials: [{ ...mockVials[0], id: 'vial-schema-keep', name: 'Schema keep' }],
    });

    await expect(importUserData(db, initialAppData, JSON.stringify({
      schemaVersion: 999,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
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
      ...mockVials[0],
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

  test('validates import preview metadata and entity counts before restore', () => {
    const preview = validateUserDataExport(JSON.stringify({
      schemaVersion: 7,
      exportedAt: '2026-06-21T12:00:00.000Z',
      data: {
        vials: [mockVials[0]],
        inventoryBatches: [],
        doses: [mockDoses[0]],
        stacks: [mockStacks[0]],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
        signalCheckIns: [],
        labReports: [],
        labResults: [],
        labImportAudits: [],
        userCompounds: [customCompound],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'researcher',
          biometricLock: false,
          darkMode: true,
        },
      },
    }));

    expect(preview).toEqual({
      schemaVersion: 7,
      exportedAt: '2026-06-21T12:00:00.000Z',
      counts: {
        vials: 1,
        inventoryBatches: 0,
        doses: 1,
        stacks: 1,
        schedules: 0,
        scheduleLogs: 0,
        reconstitutionCalculations: 0,
        signalCheckIns: 0,
        labReports: 0,
        labResults: 0,
        labImportAudits: 0,
        userCompounds: 1,
      },
    });
  });

  test('imports older v2 exports with no user compounds', async () => {
    const imported = await importUserData(db, initialAppData, JSON.stringify({
      schemaVersion: 2,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'beginner',
          biometricLock: false,
          darkMode: true,
        },
      },
    }));

    expect(imported.compounds).toEqual(referenceCompounds);
    expect(imported.reconstitutionCalculations).toEqual([]);
    expect(imported.hasCompletedOnboarding).toBe(true);
  });
});
