"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AppData, AppTheme, Compound, Peptide, Vial, Dose, InventoryBatch, LabImportAudit, LabReport, LabResult, ReconstitutionCalculation, ScheduleLog, SignalCheckIn, SiteCode, Stack, UserMode } from './types';
import { initialAppData } from './mock-data';
import { useAuth } from './auth-context';
import { createSupabaseAuthClient } from './auth';
import { createScopedPeptideOSDatabase, getPersistenceOwnerId } from './db';
import { createInventoryBatchForVials } from './inventory-batches';
import { completeOnboarding as completeOnboardingState } from './onboarding';
import { activateStackSchedules, normalizeStack, updateStackPeptideSchedule, updateStackPeptideScheduleTimes } from './schedules';
import type { SchedulePreset } from './schedules';
import {
  downloadUserData,
  exportUserData,
  exportUserDataForCloudSync,
  importUserData,
loadPersistedAppData,
resetPersistedAppData,
  restorePersistedUserData,
  savePersistedAppData,
  type PersistedUserData,
} from './persistence';
import { createUserCompound, softDeleteUserCompound, updateUserCompound, type UserCompoundDraft } from './user-compounds';
import { completeDueDose, skipDueDose } from './due-doses';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';
import { createSupabaseReferenceLibraryReader, getReleasedReferenceLibrary, type SupabaseReferenceLibraryClient } from './reference-library-source';
import { applyReleasedReferenceLibrarySnapshot } from './reference-library-state';
import { buildReferenceLibraryStatus, type ReferenceLibraryStatus } from './reference-library-status';
import { createSupabaseUserDataSyncAdapter, type SupabaseSyncClient } from './supabase-sync';
import { countPersistedUserRecords, shouldRestoreCloudData } from './cloud-sync-safety';

const bundledReferenceLibrarySnapshot = buildBundledReferenceSnapshot(referenceCompounds);
const bundledReferenceLibraryStatus: ReferenceLibraryStatus = {
  source: 'bundled-fallback',
  version: bundledReferenceLibrarySnapshot.libraryVersion,
  loadedAt: bundledReferenceLibrarySnapshot.exportedAt,
  fallbackReason: 'Supabase reference library is not configured.',
};

function omitDeletedRecords<T extends { deletedAt?: string | null }>(records: T[]) {
  return records.filter((record) => !record.deletedAt);
}

function getVisibleAppData(data: AppData): AppData {
  return {
    ...data,
    vials: omitDeletedRecords(data.vials),
    inventoryBatches: omitDeletedRecords(data.inventoryBatches),
    doses: omitDeletedRecords(data.doses),
    stacks: omitDeletedRecords(data.stacks),
    schedules: omitDeletedRecords(data.schedules),
    scheduleLogs: omitDeletedRecords(data.scheduleLogs),
    reconstitutionCalculations: omitDeletedRecords(data.reconstitutionCalculations),
    signalCheckIns: omitDeletedRecords(data.signalCheckIns),
    labReports: omitDeletedRecords(data.labReports),
    labResults: omitDeletedRecords(data.labResults),
    labImportAudits: omitDeletedRecords(data.labImportAudits),
    compounds: omitDeletedRecords(data.compounds),
  };
}

function createRecordId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) return `${prefix}-${randomId}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function tombstoneRecord<T extends { deletedAt?: string | null }>(record: T, deletedAt: string): T {
  return { ...record, deletedAt };
}

export interface CloudRetrievePreview {
  id: string;
  pulledRows: number;
  pulledAt: string | null;
  cloudRecordCount: number;
  localRecordCount: number;
  cloudHasMoreRecords: number;
  localHasMoreRecords: number;
}

interface PendingCloudRetrieve {
  preview: CloudRetrievePreview;
  cloudData: PersistedUserData;
  localData: PersistedUserData;
}

function buildCloudRetrievePreview(input: {
  id: string;
  pulledRows: number;
  pulledAt: string | null;
  cloudData: PersistedUserData;
  localData: PersistedUserData;
}): CloudRetrievePreview {
  const cloudRecordCount = countPersistedUserRecords(input.cloudData);
  const localRecordCount = countPersistedUserRecords(input.localData);
  return {
    id: input.id,
    pulledRows: input.pulledRows,
    pulledAt: input.pulledAt,
    cloudRecordCount,
    localRecordCount,
    cloudHasMoreRecords: Math.max(cloudRecordCount - localRecordCount, 0),
    localHasMoreRecords: Math.max(localRecordCount - cloudRecordCount, 0),
  };
}

interface AppContextType {
  data: AppData;
  referenceLibraryStatus: ReferenceLibraryStatus;
persistenceStatus: {
mode: 'local-only' | 'signed-in';
ownerId: string;
lastSavedAt: string | null;
cloudLastSavedAt: string | null;
    cloudLastRetrievedAt: string | null;
    cloudStatus: 'unavailable' | 'ready' | 'saving' | 'retrieving' | 'error';
    cloudMessage: string | null;
    cloudRetrievePreview: CloudRetrievePreview | null;
    canUndoCloudRetrieve: boolean;
  };
  // Peptides
  getPeptide: (id: string) => Peptide | undefined;
  // Compounds
  getCompound: (id: string) => Compound | undefined;
  addUserCompound: (compound: UserCompoundDraft) => void;
  updateUserCompound: (id: string, updates: Partial<UserCompoundDraft>) => void;
  deleteUserCompound: (id: string) => void;
  // Vials
  getVial: (id: string) => Vial | undefined;
  addVial: (vial: Omit<Vial, 'id'>, options?: AddInventoryBatchOptions) => void;
  addVials: (vials: Array<Omit<Vial, 'id'>>, options?: AddInventoryBatchOptions) => void;
  updateVial: (id: string, updates: Partial<Vial>) => void;
  updateInventoryBatch: (id: string, updates: InventoryBatchUpdate) => void;
  deleteInventoryItem: (id: string) => Promise<void>;
  // Doses
  getDose: (id: string) => Dose | undefined;
  addDose: (dose: Omit<Dose, 'id'>) => void;
  updateDose: (id: string, updates: Partial<Dose>) => void;
  getTodaysDoses: () => Dose[];
  getTodaysScheduleLogs: () => ScheduleLog[];
  getRecentDoses: (limit: number) => Dose[];
  getDosesByDate: (date: Date) => Dose[];
  getStreak: () => number;
  // Reconstitution
  addReconstitutionCalculation: (calculation: ReconstitutionCalculation) => void;
  deleteReconstitutionCalculation: (id: string) => void;
  // Signals
  addSignalCheckIn: (checkIn: Omit<SignalCheckIn, 'id'>) => void;
  // Labs
  addLabImport: (input: { report: LabReport; results: LabResult[]; audit: LabImportAudit }) => Promise<void>;
  deleteLabReport: (reportId: string) => void;
  // Stacks
  getStack: (id: string) => Stack | undefined;
  addStack: (stack: Omit<Stack, 'id'>) => string;
  updateStack: (id: string, updates: Partial<Stack>) => void;
  deleteStack: (id: string) => Promise<void>;
  activateStack: (id: string) => void;
  updateStackItemSchedule: (stackId: string, stackPeptideId: string, preset: SchedulePreset) => void;
  updateStackItemScheduleTimes: (stackId: string, stackPeptideId: string, timesOfDay: string[]) => void;
  getScheduleLogsForStack: (stackId: string) => ScheduleLog[];
  completeScheduleLog: (logId: string, completion: { vialId: string; site: SiteCode | ''; notes: string }) => Promise<void>;
  skipScheduleLog: (logId: string) => Promise<void>;
  getActiveStacks: () => Stack[];
  // Settings
  setHasSeenDisclaimer: (seen: boolean) => void;
  completeOnboarding: (userMode?: UserMode) => Promise<void>;
setUserMode: (userMode: UserMode) => void;
setTheme: (theme: AppTheme) => void;
setDarkMode: (enabled: boolean) => void;
toggleDarkMode: () => void;
toggleBiometricLock: () => void;
setCloudSyncEnabled: (enabled: boolean) => Promise<void>;
exportAllData: () => Promise<void>;
importAllData: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
  saveToCloud: () => Promise<void>;
  previewCloudRetrieve: () => Promise<void>;
  confirmCloudRetrieve: () => Promise<void>;
  cancelCloudRetrievePreview: () => void;
  undoLastCloudRetrieve: () => Promise<void>;
  retrieveFromCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AddInventoryBatchOptions {
  createdFrom?: InventoryBatch['createdFrom'];
  packageUnit?: InventoryBatch['packageUnit'];
  packageQuantity?: number;
}

interface InventoryBatchUpdate {
  name?: string;
  dateAdded?: string;
  expirationDate?: string;
  source?: string;
  lotNumber?: string;
  mg?: number;
  totalAmount?: Vial['totalAmount'];
}

export function AppProvider({ children }: { children: ReactNode }) {
const { config: authConfig, status: authStatus, user: authUser } = useAuth();
const persistenceOwnerId = getPersistenceOwnerId(authStatus === 'signed-in' ? authUser : null);
const persistenceDb = useMemo(() => createScopedPeptideOSDatabase(persistenceOwnerId), [persistenceOwnerId]);
const cloudSyncAdapter = useMemo(() => {
const client = createSupabaseAuthClient(authConfig);
return client ? createSupabaseUserDataSyncAdapter(client as unknown as SupabaseSyncClient) : null;
}, [authConfig]);
const referenceLibraryReader = useMemo(() => {
    const client = createSupabaseAuthClient(authConfig);
    return client ? createSupabaseReferenceLibraryReader(client as unknown as SupabaseReferenceLibraryClient) : null;
  }, [authConfig]);
const [data, setData] = useState<AppData>(initialAppData);
const visibleData = useMemo(() => getVisibleAppData(data), [data]);
const [referenceLibraryStatus, setReferenceLibraryStatus] = useState<ReferenceLibraryStatus>(bundledReferenceLibraryStatus);
const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
const [cloudLastSavedAt, setCloudLastSavedAt] = useState<string | null>(null);
const [cloudLastRetrievedAt, setCloudLastRetrievedAt] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'unavailable' | 'ready' | 'saving' | 'retrieving' | 'error'>('unavailable');
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [pendingCloudRetrieve, setPendingCloudRetrieve] = useState<PendingCloudRetrieve | null>(null);
  const [canUndoCloudRetrieve, setCanUndoCloudRetrieve] = useState(false);
  const [persistenceError, setPersistenceError] = useState<{ ownerId: string; message: string } | null>(null);
  const [hydrateAttempt, setHydrateAttempt] = useState(0);
  const [hydratedOwnerId, setHydratedOwnerId] = useState<string | null>(null);
  const hydrated = authStatus !== 'loading' && hydratedOwnerId === persistenceOwnerId;
  const saveSequence = useRef(0);
const persistenceQueue = useRef(Promise.resolve());
const dataRef = useRef(data);
  const loadedReferenceLibraryKey = useRef<string | null>(null);
  const autoCloudRetrieveKey = useRef<string | null>(null);
  const skipNextCloudPush = useRef(false);
  const lastCloudRestoreBackup = useRef<PersistedUserData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

useEffect(() => {
return () => {
persistenceDb.close();
};
}, [persistenceDb]);

  useEffect(() => {
    if (authStatus === 'loading') return;

    let active = true;

    loadPersistedAppData(persistenceDb, initialAppData, { ownerId: persistenceOwnerId })
      .then((persistedData) => {
        if (!active) return;
        setPersistenceError(null);
        dataRef.current = persistedData;
        setData(persistedData);
return persistenceDb.metadata.get('lastSavedAt');
})
      .then((metadata) => {
        if (!active) return;
        setLastSavedAt(typeof metadata?.value === 'string' ? metadata.value : null);
        setHydratedOwnerId(persistenceOwnerId);
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'PeptideOS could not read local data.';
        console.error('Failed to hydrate PeptideOS data', error);
        setPersistenceError({ ownerId: persistenceOwnerId, message });
      });

    return () => {
      active = false;
    };
  }, [authStatus, hydrateAttempt, persistenceDb, persistenceOwnerId]);

  useEffect(() => {
    if (!hydrated || !referenceLibraryReader || !authConfig.url) return;

    const libraryKey = `${persistenceOwnerId}:${authConfig.url}`;
    if (loadedReferenceLibraryKey.current === libraryKey) return;
    loadedReferenceLibraryKey.current = libraryKey;

    let active = true;

    getReleasedReferenceLibrary(referenceLibraryReader, {
      fallbackSnapshot: bundledReferenceLibrarySnapshot,
      exportedFrom: authConfig.url,
    }).then((library) => {
      if (!active) return;

      setReferenceLibraryStatus(buildReferenceLibraryStatus(library, new Date().toISOString()));
      if (library.source !== 'supabase') return;

      setData((previousData) => {
        const nextData = applyReleasedReferenceLibrarySnapshot(previousData, library.snapshot);
        dataRef.current = nextData;
        return nextData;
      });
    }).catch((error) => {
      setReferenceLibraryStatus({
        source: 'bundled-fallback',
        version: bundledReferenceLibrarySnapshot.libraryVersion,
        loadedAt: new Date().toISOString(),
        fallbackReason: error instanceof Error ? error.message : 'Reference library release could not be loaded.',
      });
      console.error('Failed to load released PeptideOS reference library', error);
    });

    return () => {
      active = false;
    };
  }, [authConfig.url, hydrated, persistenceOwnerId, referenceLibraryReader]);

  const enqueuePersistenceOperation = useCallback(<T,>(operation: () => Promise<T>) => {
    const queuedOperation = persistenceQueue.current.then(operation, operation);
    persistenceQueue.current = queuedOperation.then(() => undefined, () => undefined);
    return queuedOperation;
  }, []);

  const setAndPersistData = useCallback(async (updater: (previousData: AppData) => AppData) => {
const nextData = updater(dataRef.current);
dataRef.current = nextData;
setData(nextData);

if (hydrated) {
const sequence = ++saveSequence.current;
const savedAt = new Date();
await enqueuePersistenceOperation(() => savePersistedAppData(persistenceDb, nextData, savedAt, { ownerId: persistenceOwnerId })).then(() => {
if (sequence === saveSequence.current) {
setLastSavedAt(savedAt.toISOString());
}
}).catch((error) => {
if (sequence === saveSequence.current) {
console.error('Failed to persist PeptideOS data', error);
}
});

if (skipNextCloudPush.current) {
skipNextCloudPush.current = false;
} else if (nextData.cloudSyncEnabled && authStatus === 'signed-in' && authUser && cloudSyncAdapter) {
try {
const exported = await exportUserDataForCloudSync(persistenceDb);
const result = await cloudSyncAdapter.pushUserData({
userId: authUser.id,
data: exported,
syncedAt: savedAt,
});
setCloudLastSavedAt(savedAt.toISOString());
setCloudStatus('ready');
setCloudMessage(`Synced ${result.pushedRows} records to cloud.`);
} catch (error) {
setCloudStatus('error');
setCloudMessage(error instanceof Error ? error.message : 'Cloud auto-sync failed.');
}
}
}
}, [authStatus, authUser, cloudSyncAdapter, enqueuePersistenceOperation, hydrated, persistenceDb, persistenceOwnerId]);

// Peptides
  const getPeptide = useCallback((id: string) => {
    return data.peptides.find(p => p.id === id);
  }, [data.peptides]);

  const getCompound = useCallback((id: string) => {
    return data.compounds.find(compound => compound.id === id);
  }, [data.compounds]);

  const addUserCompound = useCallback((compound: UserCompoundDraft) => {
    void setAndPersistData(prev => ({
      ...prev,
      compounds: [...prev.compounds, createUserCompound(compound)],
    }));
  }, [setAndPersistData]);

  const updateCustomCompound = useCallback((id: string, updates: Partial<UserCompoundDraft>) => {
    void setAndPersistData(prev => ({
      ...prev,
      compounds: prev.compounds.map(compound => compound.id === id ? updateUserCompound(compound, updates) : compound),
    }));
  }, [setAndPersistData]);

  const deleteUserCompound = useCallback((id: string) => {
    void setAndPersistData(prev => ({
      ...prev,
      compounds: prev.compounds.map(compound => compound.id === id ? softDeleteUserCompound(compound) : compound),
    }));
  }, [setAndPersistData]);

  // Vials
  const getVial = useCallback((id: string) => {
    return data.vials.find(v => v.id === id);
  }, [data.vials]);

  const addVial = useCallback((vial: Omit<Vial, 'id'>, options: AddInventoryBatchOptions = {}) => {
    const batchId = createRecordId('batch');
    const newVial: Vial = { ...vial, id: createRecordId('vial'), inventoryBatchId: batchId };
    const batch = createInventoryBatchForVials(batchId, [newVial], options.createdFrom ?? 'manual', {
      packageUnit: options.packageUnit,
      packageQuantity: options.packageQuantity,
    });
    void setAndPersistData(prev => ({
      ...prev,
      vials: [...prev.vials, newVial],
      inventoryBatches: batch ? [...prev.inventoryBatches, batch] : prev.inventoryBatches,
    }));
  }, [setAndPersistData]);

  const addVials = useCallback((vials: Array<Omit<Vial, 'id'>>, options: AddInventoryBatchOptions = {}) => {
    const batchId = createRecordId('batch');
    const newVials: Vial[] = vials.map((vial, index) => ({
      ...vial,
      id: createRecordId(`vial-${index}`),
      inventoryBatchId: batchId,
    }));
    const batch = createInventoryBatchForVials(batchId, newVials, options.createdFrom ?? 'manual', {
      packageUnit: options.packageUnit,
      packageQuantity: options.packageQuantity,
    });
    void setAndPersistData(prev => ({
      ...prev,
      vials: [...prev.vials, ...newVials],
      inventoryBatches: batch ? [...prev.inventoryBatches, batch] : prev.inventoryBatches,
    }));
  }, [setAndPersistData]);

  const updateVial = useCallback((id: string, updates: Partial<Vial>) => {
    void setAndPersistData(prev => ({
      ...prev,
      vials: prev.vials.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  }, [setAndPersistData]);

  const updateInventoryBatch = useCallback((id: string, updates: InventoryBatchUpdate) => {
    void setAndPersistData(prev => {
      const batchVials = prev.vials.filter((vial) => vial.inventoryBatchId === id);
      const vialCount = batchVials.length;

      return {
        ...prev,
        inventoryBatches: prev.inventoryBatches.map((batch) => (
          batch.id === id
            ? {
                ...batch,
                ...(updates.name !== undefined ? { name: updates.name } : {}),
                ...(updates.dateAdded !== undefined ? { dateAdded: updates.dateAdded } : {}),
                ...(updates.source !== undefined ? { source: updates.source } : {}),
                ...(updates.lotNumber !== undefined ? { lotNumber: updates.lotNumber } : {}),
                ...(updates.mg !== undefined ? { mg: updates.mg } : {}),
                ...(updates.totalAmount !== undefined ? { totalAmount: updates.totalAmount } : {}),
              }
            : batch
        )),
        vials: prev.vials.map((vial) => {
          if (vial.inventoryBatchId !== id) return vial;
          const batchIndex = batchVials.findIndex((candidate) => candidate.id === vial.id);
          const batchName = updates.name?.trim();

          return {
            ...vial,
            ...(batchName && vialCount > 1 ? { name: `${batchName} vial ${batchIndex + 1} of ${vialCount}` } : {}),
            ...(updates.dateAdded !== undefined ? { dateAdded: updates.dateAdded } : {}),
            ...(updates.expirationDate !== undefined ? { expirationDate: updates.expirationDate } : {}),
            ...(updates.source !== undefined ? { source: updates.source } : {}),
            ...(updates.lotNumber !== undefined ? { lotNumber: updates.lotNumber } : {}),
            ...(updates.mg !== undefined ? { mg: updates.mg } : {}),
            ...(updates.totalAmount !== undefined ? { totalAmount: updates.totalAmount } : {}),
          };
        }),
      };
    });
  }, [setAndPersistData]);

  const deleteInventoryItem = useCallback((id: string) => {
    return setAndPersistData(prev => {
      const targetVial = prev.vials.find((vial) => vial.id === id);
      if (!targetVial) return prev;

      const vialIdsToDelete = new Set(
        prev.vials
          .filter((vial) => (
            targetVial.inventoryBatchId
              ? vial.inventoryBatchId === targetVial.inventoryBatchId
              : vial.id === targetVial.id
          ))
          .map((vial) => vial.id),
      );
      const deletedAt = new Date().toISOString();
      const batchIdsToDelete = new Set(
        prev.inventoryBatches
          .filter((batch) => targetVial.inventoryBatchId === batch.id)
          .map((batch) => batch.id),
      );

      return {
        ...prev,
        vials: prev.vials.map((vial) => vialIdsToDelete.has(vial.id) ? tombstoneRecord(vial, deletedAt) : vial),
        inventoryBatches: prev.inventoryBatches.map((batch) => batchIdsToDelete.has(batch.id) ? tombstoneRecord(batch, deletedAt) : batch),
        doses: prev.doses.map((dose) => vialIdsToDelete.has(dose.vialId) ? tombstoneRecord(dose, deletedAt) : dose),
      };
    });
  }, [setAndPersistData]);

  // Doses
  const getDose = useCallback((id: string) => {
    return data.doses.find(d => d.id === id);
  }, [data.doses]);

  const addDose = useCallback((dose: Omit<Dose, 'id'>) => {
    const newDose: Dose = { ...dose, id: createRecordId('dose') };
    void setAndPersistData(prev => ({ ...prev, doses: [...prev.doses, newDose] }));
  }, [setAndPersistData]);

  const updateDose = useCallback((id: string, updates: Partial<Dose>) => {
    void setAndPersistData(prev => ({
      ...prev,
      doses: prev.doses.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  }, [setAndPersistData]);

  const getTodaysDoses = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return data.doses.filter(d => {
      const doseDate = new Date(d.dateTime);
      return doseDate >= today && doseDate < tomorrow;
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [data.doses]);

  const getTodaysScheduleLogs = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return data.scheduleLogs.filter((log) => {
      const dueDate = new Date(log.dueAt);
      return dueDate >= today && dueDate < tomorrow;
    }).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [data.scheduleLogs]);

  const getRecentDoses = useCallback((limit: number) => {
    return [...data.doses]
      .filter(d => d.completed)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .slice(0, limit);
  }, [data.doses]);

  const getDosesByDate = useCallback((date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    return data.doses.filter(d => {
      const doseDate = new Date(d.dateTime);
      return doseDate >= start && doseDate < end;
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [data.doses]);

  const getStreak = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check if today has completed doses, if not start from yesterday
    const todaysDoses = data.doses.filter(d => {
      const doseDate = new Date(d.dateTime);
      doseDate.setHours(0, 0, 0, 0);
      return doseDate.getTime() === today.getTime() && d.completed;
    });
    
    if (todaysDoses.length === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const dayDoses = data.doses.filter(d => {
        const doseDate = new Date(d.dateTime);
        doseDate.setHours(0, 0, 0, 0);
        return doseDate.getTime() === checkDate.getTime() && d.completed;
      });
      
      if (dayDoses.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }, [data.doses]);

  const addReconstitutionCalculation = useCallback((calculation: ReconstitutionCalculation) => {
    void setAndPersistData(prev => ({
      ...prev,
      reconstitutionCalculations: [calculation, ...prev.reconstitutionCalculations],
    }));
  }, [setAndPersistData]);

  const deleteReconstitutionCalculation = useCallback((id: string) => {
    void setAndPersistData(prev => ({
      ...prev,
      reconstitutionCalculations: prev.reconstitutionCalculations.map((calculation) =>
        calculation.id === id ? tombstoneRecord(calculation, new Date().toISOString()) : calculation
      ),
    }));
  }, [setAndPersistData]);

  const addSignalCheckIn = useCallback((checkIn: Omit<SignalCheckIn, 'id'>) => {
    const newCheckIn: SignalCheckIn = { ...checkIn, id: createRecordId('signal') };
    void setAndPersistData(prev => ({
      ...prev,
      signalCheckIns: [newCheckIn, ...prev.signalCheckIns],
    }));
  }, [setAndPersistData]);

  const addLabImport = useCallback((input: { report: LabReport; results: LabResult[]; audit: LabImportAudit }) => {
    return setAndPersistData(prev => ({
      ...prev,
      labReports: [input.report, ...prev.labReports.filter((report) => report.id !== input.report.id)],
      labResults: [
        ...input.results,
        ...prev.labResults.filter((result) => result.reportId !== input.report.id),
      ],
      labImportAudits: [
        input.audit,
        ...prev.labImportAudits.filter((audit) => audit.reportId !== input.report.id),
      ],
    }));
  }, [setAndPersistData]);

  const deleteLabReport = useCallback((reportId: string) => {
    void setAndPersistData(prev => {
      const deletedAt = new Date().toISOString();
      return {
        ...prev,
        labReports: prev.labReports.map((report) =>
          report.id === reportId ? tombstoneRecord(report, deletedAt) : report
        ),
        labResults: prev.labResults.map((result) =>
          result.reportId === reportId ? tombstoneRecord(result, deletedAt) : result
        ),
        labImportAudits: prev.labImportAudits.map((audit) =>
          audit.reportId === reportId ? tombstoneRecord(audit, deletedAt) : audit
        ),
      };
    });
  }, [setAndPersistData]);

  // Stacks
 const getStack = useCallback((id: string) => {
 return visibleData.stacks.find(s => s.id === id);
 }, [visibleData.stacks]);

  const addStack = useCallback((stack: Omit<Stack, 'id'>) => {
    const id = createRecordId('stack');
    const newStack: Stack = normalizeStack({ ...stack, id });
    void setAndPersistData(prev => ({ ...prev, stacks: [...prev.stacks, newStack] }));
    return id;
  }, [setAndPersistData]);

  const updateStack = useCallback((id: string, updates: Partial<Stack>) => {
    void setAndPersistData(prev => ({
      ...prev,
      stacks: prev.stacks.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, [setAndPersistData]);

 const deleteStack = useCallback((id: string) => {
 return setAndPersistData(prev => {
 const deletedAt = new Date().toISOString();
 const scheduleIdsToDelete = new Set(
 prev.schedules
 .filter((schedule) => schedule.stackId === id)
          .map((schedule) => schedule.id),
      );
      const scheduleLogIdsToDelete = new Set(
        prev.scheduleLogs
          .filter((log) => log.stackId === id || scheduleIdsToDelete.has(log.scheduleId))
          .map((log) => log.id),
      );

 return {
 ...prev,
 stacks: prev.stacks.map((stack) => stack.id === id ? { ...stack, deletedAt } : stack),
 schedules: prev.schedules.map((schedule) =>
 schedule.stackId === id ? { ...schedule, deletedAt } : schedule
 ),
 scheduleLogs: prev.scheduleLogs.map((log) =>
 log.stackId === id || scheduleIdsToDelete.has(log.scheduleId) ? { ...log, deletedAt } : log
 ),
 doses: prev.doses.map((dose) =>
 dose.scheduleLogId && scheduleLogIdsToDelete.has(dose.scheduleLogId) ? { ...dose, deletedAt } : dose
 ),
 };
 });
 }, [setAndPersistData]);

  const activateStack = useCallback((id: string) => {
    void setAndPersistData(prev => {
      const stack = prev.stacks.find((candidate) => candidate.id === id);
      if (!stack || stack.peptides.length === 0) return prev;

      const activated = activateStackSchedules({
        stack,
        existingSchedules: prev.schedules,
        existingScheduleLogs: prev.scheduleLogs,
      });

      return {
        ...prev,
        stacks: prev.stacks.map((candidate) => candidate.id === id ? activated.stack : candidate),
        schedules: activated.schedules,
        scheduleLogs: activated.scheduleLogs,
      };
    });
  }, [setAndPersistData]);

  const updateStackItemSchedule = useCallback((stackId: string, stackPeptideId: string, preset: SchedulePreset) => {
    void setAndPersistData(prev => {
      const stack = prev.stacks.find((candidate) => candidate.id === stackId);
      if (!stack) return prev;

      const updated = updateStackPeptideSchedule({
        stack,
        stackPeptideId,
        preset,
        existingSchedules: prev.schedules,
        existingScheduleLogs: prev.scheduleLogs,
      });

      return {
        ...prev,
        stacks: prev.stacks.map((candidate) => candidate.id === stackId ? updated.stack : candidate),
        schedules: updated.schedules,
        scheduleLogs: updated.scheduleLogs,
      };
    });
  }, [setAndPersistData]);

  const updateStackItemScheduleTimes = useCallback((stackId: string, stackPeptideId: string, timesOfDay: string[]) => {
    void setAndPersistData(prev => {
      const stack = prev.stacks.find((candidate) => candidate.id === stackId);
      if (!stack) return prev;

      const updated = updateStackPeptideScheduleTimes({
        stack,
        stackPeptideId,
        timesOfDay,
        existingSchedules: prev.schedules,
        existingScheduleLogs: prev.scheduleLogs,
      });

      return {
        ...prev,
        stacks: prev.stacks.map((candidate) => candidate.id === stackId ? updated.stack : candidate),
        schedules: updated.schedules,
        scheduleLogs: updated.scheduleLogs,
      };
    });
  }, [setAndPersistData]);

  const getScheduleLogsForStack = useCallback((stackId: string) => {
    return data.scheduleLogs
      .filter((log) => log.stackId === stackId)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [data.scheduleLogs]);

  const completeScheduleLog = useCallback((logId: string, completion: { vialId: string; site: SiteCode | ''; notes: string }) => {
    return setAndPersistData(prev => completeDueDose(prev, logId, completion));
  }, [setAndPersistData]);

  const skipScheduleLog = useCallback(async (logId: string) => {
    const previousData = dataRef.current;
    const nextData = skipDueDose(previousData, logId);
    if (nextData === previousData) return;

if (hydrated) {
const sequence = ++saveSequence.current;
const savedAt = new Date();
await enqueuePersistenceOperation(() => savePersistedAppData(persistenceDb, nextData, savedAt, { ownerId: persistenceOwnerId })).then(() => {
if (sequence === saveSequence.current) {
setLastSavedAt(savedAt.toISOString());
}
}).catch((error) => {
if (sequence === saveSequence.current) {
console.error('Failed to persist PeptideOS data', error);
}
      });
    }

    dataRef.current = nextData;
    setData(nextData);
  }, [enqueuePersistenceOperation, hydrated, persistenceDb, persistenceOwnerId]);

const getActiveStacks = useCallback(() => {
return visibleData.stacks.filter(s => s.status === 'active');
}, [visibleData.stacks]);

  // Settings
  const setHasSeenDisclaimer = useCallback((seen: boolean) => {
    void setAndPersistData(prev => ({ ...prev, hasSeenDisclaimer: seen }));
  }, [setAndPersistData]);

  const completeOnboarding = useCallback((userMode?: UserMode) => {
    return setAndPersistData(prev => completeOnboardingState(prev, userMode));
  }, [setAndPersistData]);

const setUserMode = useCallback((userMode: UserMode) => {
void setAndPersistData(prev => ({ ...prev, userMode }));
}, [setAndPersistData]);

const setTheme = useCallback((theme: AppTheme) => {
void setAndPersistData(prev => ({ ...prev, theme, darkMode: theme !== 'clinical-light' && theme !== 'warm-minimal' }));
}, [setAndPersistData]);

const setDarkMode = useCallback((enabled: boolean) => {
void setAndPersistData(prev => ({ ...prev, darkMode: enabled, theme: enabled ? 'graphite-dark' : 'clinical-light' }));
}, [setAndPersistData]);

const toggleDarkMode = useCallback(() => {
void setAndPersistData(prev => {
const darkMode = !prev.darkMode;
return { ...prev, darkMode, theme: darkMode ? 'graphite-dark' : 'clinical-light' };
});
}, [setAndPersistData]);

  const toggleBiometricLock = useCallback(() => {
    void setAndPersistData(prev => ({ ...prev, biometricLock: !prev.biometricLock }));
  }, [setAndPersistData]);

  const exportAllData = useCallback(async () => {
    await persistenceQueue.current;
    const exported = await exportUserData(persistenceDb);
    downloadUserData(exported);
  }, [persistenceDb]);

  const importAllData = useCallback(async (file: File) => {
    const contents = await file.text();
    saveSequence.current++;
const importedData = await enqueuePersistenceOperation(() => importUserData(persistenceDb, initialAppData, contents, new Date(), { ownerId: persistenceOwnerId }));
dataRef.current = importedData;
setData(importedData);
const metadata = await persistenceDb.metadata.get('lastSavedAt');
setLastSavedAt(typeof metadata?.value === 'string' ? metadata.value : new Date().toISOString());
}, [enqueuePersistenceOperation, persistenceDb, persistenceOwnerId]);

const clearAllData = useCallback(async () => {
saveSequence.current++;
const resetData = await enqueuePersistenceOperation(() => resetPersistedAppData(persistenceDb, initialAppData));
dataRef.current = resetData;
setData(resetData);
setLastSavedAt(null);
}, [enqueuePersistenceOperation, persistenceDb]);

  const saveToCloud = useCallback(async () => {
if (authStatus !== 'signed-in' || !authUser || !cloudSyncAdapter) {
setCloudStatus('unavailable');
setCloudMessage('Sign in with cloud sync configured before saving to cloud.');
return;
}

setCloudStatus('saving');
setCloudMessage(null);
try {
await persistenceQueue.current;
const exported = await exportUserDataForCloudSync(persistenceDb);
const syncedAt = new Date();
const result = await cloudSyncAdapter.pushUserData({
userId: authUser.id,
data: exported,
syncedAt,
});
setCloudLastSavedAt(syncedAt.toISOString());
setCloudStatus('ready');
setCloudMessage(`Saved ${result.pushedRows} records to cloud.`);
} catch (error) {
setCloudStatus('error');
setCloudMessage(error instanceof Error ? error.message : 'Cloud save failed.');
    }
  }, [authStatus, authUser, cloudSyncAdapter, persistenceDb]);

  const restoreCloudData = useCallback(async (
    cloudData: PersistedUserData,
    restoredAt: Date,
  ) => {
    saveSequence.current++;
    const persistedCloudSyncEnabled = dataRef.current.cloudSyncEnabled;
    const restoredPersistedData = {
      ...cloudData,
      settings: {
        ...cloudData.settings,
        cloudSyncEnabled: persistedCloudSyncEnabled,
      },
    };
    const restoredData = await enqueuePersistenceOperation(() => restorePersistedUserData(
      persistenceDb,
      initialAppData,
      restoredPersistedData,
      restoredAt,
      { ownerId: persistenceOwnerId },
    ));
    dataRef.current = restoredData;
    setData(restoredData);
    setLastSavedAt(restoredAt.toISOString());
    setCloudLastRetrievedAt(restoredAt.toISOString());
  }, [enqueuePersistenceOperation, persistenceDb, persistenceOwnerId]);

  const retrieveFromCloud = useCallback(async (options?: { automatic?: boolean }) => {
if (authStatus !== 'signed-in' || !authUser || !cloudSyncAdapter) {
setCloudStatus('unavailable');
setCloudMessage('Sign in with cloud sync configured before retrieving cloud data.');
return;
}

setCloudStatus('retrieving');
setCloudMessage(null);
try {
const result = await cloudSyncAdapter.pullUserData({ userId: authUser.id });
if (result.pulledRows === 0) {
setCloudStatus('ready');
setCloudMessage('No cloud records found for this account. Local data was not changed.');
return;
}

const exportedLocalData = await exportUserDataForCloudSync(persistenceDb);
const restoreDecision = shouldRestoreCloudData({
automatic: options?.automatic ?? false,
cloudData: result.data,
cloudPulledAt: result.pulledAt,
localData: exportedLocalData,
localLastSavedAt: lastSavedAt,
});
if (!restoreDecision.restore) {
setCloudLastRetrievedAt(result.pulledAt ?? new Date().toISOString());
setCloudStatus('ready');
setCloudMessage('Cloud copy is not newer than this device. Local data was kept.');
return;
}

      await restoreCloudData(result.data, new Date());
      setCloudStatus('ready');
      setCloudMessage(`Retrieved ${result.pulledRows} records from cloud.`);
} catch (error) {
setCloudStatus('error');
setCloudMessage(error instanceof Error ? error.message : 'Cloud retrieve failed.');
}
  }, [authStatus, authUser, cloudSyncAdapter, lastSavedAt, persistenceDb, restoreCloudData]);

  const previewCloudRetrieve = useCallback(async () => {
    if (authStatus !== 'signed-in' || !authUser || !cloudSyncAdapter) {
      setCloudStatus('unavailable');
      setCloudMessage('Sign in with cloud sync configured before retrieving cloud data.');
      return;
    }

    setCloudStatus('retrieving');
    setCloudMessage(null);
    setPendingCloudRetrieve(null);
    try {
      await persistenceQueue.current;
      const result = await cloudSyncAdapter.pullUserData({ userId: authUser.id });
      if (result.pulledRows === 0) {
        setCloudStatus('ready');
        setCloudMessage('No cloud records found for account. Local data was not changed.');
        return;
      }

      const localData = await exportUserDataForCloudSync(persistenceDb);
      const preview = buildCloudRetrievePreview({
        id: createRecordId('cloud-preview'),
        pulledRows: result.pulledRows,
        pulledAt: result.pulledAt,
        cloudData: result.data,
        localData,
      });
      setPendingCloudRetrieve({ preview, cloudData: result.data, localData });
      setCloudStatus('ready');
      setCloudMessage('Review the cloud retrieve preview before replacing this device.');
    } catch (error) {
      setCloudStatus('error');
      setCloudMessage(error instanceof Error ? error.message : 'Cloud retrieve preview failed.');
    }
  }, [authStatus, authUser, cloudSyncAdapter, persistenceDb]);

  const cancelCloudRetrievePreview = useCallback(() => {
    setPendingCloudRetrieve(null);
    setCloudStatus('ready');
    setCloudMessage('Cloud retrieve canceled. Local data was kept.');
  }, []);

  const confirmCloudRetrieve = useCallback(async () => {
    if (!pendingCloudRetrieve) return;

    setCloudStatus('retrieving');
    setCloudMessage(null);
    try {
      await persistenceQueue.current;
      const backup = await exportUserData(persistenceDb);
      downloadUserData(backup);
      lastCloudRestoreBackup.current = pendingCloudRetrieve.localData;
      await restoreCloudData(pendingCloudRetrieve.cloudData, new Date());
      setCanUndoCloudRetrieve(true);
      setPendingCloudRetrieve(null);
      setCloudStatus('ready');
      setCloudMessage(`Retrieved ${pendingCloudRetrieve.preview.pulledRows} cloud records. A local backup was downloaded first.`);
    } catch (error) {
      setCloudStatus('error');
      setCloudMessage(error instanceof Error ? error.message : 'Cloud retrieve failed.');
    }
  }, [pendingCloudRetrieve, persistenceDb, restoreCloudData]);

  const undoLastCloudRetrieve = useCallback(async () => {
    if (!lastCloudRestoreBackup.current) {
      setCloudStatus('ready');
      setCloudMessage('No cloud retrieve backup is available to undo.');
      return;
    }

    setCloudStatus('retrieving');
    setCloudMessage(null);
    try {
      await restoreCloudData(lastCloudRestoreBackup.current, new Date());
      lastCloudRestoreBackup.current = null;
      setCanUndoCloudRetrieve(false);
      setPendingCloudRetrieve(null);
      setCloudStatus('ready');
      setCloudMessage('Restored the local data from before the last cloud retrieve.');
    } catch (error) {
      setCloudStatus('error');
      setCloudMessage(error instanceof Error ? error.message : 'Could not undo cloud retrieve.');
    }
  }, [restoreCloudData]);

const setCloudSyncEnabled = useCallback(async (enabled: boolean) => {
if (enabled && authStatus !== 'signed-in') {
setCloudStatus('unavailable');
setCloudMessage('Sign in before turning on Cloud mode.');
return;
}

if (enabled) {
skipNextCloudPush.current = true;
}
await setAndPersistData((prev) => ({ ...prev, cloudSyncEnabled: enabled }));
if (!enabled) {
setCloudStatus('ready');
setCloudMessage('Cloud mode is off. Data stays on this device until you manually save to cloud.');
return;
}

const localData = await exportUserDataForCloudSync(persistenceDb);
if (countPersistedUserRecords(localData) > 0) {
await saveToCloud();
return;
}

await retrieveFromCloud({ automatic: true });
await saveToCloud();
}, [authStatus, persistenceDb, retrieveFromCloud, saveToCloud, setAndPersistData]);

useEffect(() => {
if (!hydrated || authStatus !== 'signed-in' || !authUser || !data.cloudSyncEnabled || !cloudSyncAdapter) return;
const syncKey = `${authUser.id}:${persistenceOwnerId}`;
if (autoCloudRetrieveKey.current === syncKey) return;
autoCloudRetrieveKey.current = syncKey;
void retrieveFromCloud({ automatic: true });
}, [authStatus, authUser, cloudSyncAdapter, data.cloudSyncEnabled, hydrated, persistenceOwnerId, retrieveFromCloud]);

  const activePersistenceError = persistenceError?.ownerId === persistenceOwnerId ? persistenceError.message : null;

  if (activePersistenceError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5 text-foreground">
        <section className="w-full max-w-sm rounded-[22px] border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Local data unavailable</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight">PeptideOS could not read this device.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your saved data has not been overwritten. Retry after checking storage permissions or private browsing mode.
          </p>
          <p className="mt-3 rounded-[14px] bg-secondary p-3 text-xs text-muted-foreground">{activePersistenceError}</p>
          <button
            className="mt-4 h-11 w-full rounded-[14px] bg-primary text-sm font-black text-primary-foreground"
            type="button"
            onClick={() => {
              setPersistenceError(null);
              setHydrateAttempt((attempt) => attempt + 1);
            }}
          >
            Retry local data
          </button>
        </section>
      </main>
    );
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5 text-foreground">
        <section className="w-full max-w-sm rounded-[22px] border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">PeptideOS</p>
          <div className="mt-5 h-3 w-28 rounded-full bg-secondary" />
          <div className="mt-3 h-3 w-44 rounded-full bg-secondary" />
          <div className="mt-6 h-12 rounded-[16px] bg-secondary" />
        </section>
      </main>
    );
  }

const effectiveCloudStatus = authStatus === 'signed-in' && cloudSyncAdapter
? (cloudStatus === 'unavailable' ? 'ready' : cloudStatus)
: 'unavailable';
const effectiveCloudMessage = authStatus === 'signed-in' && !cloudSyncAdapter
? 'Cloud sync is not configured for this build.'
: authStatus === 'signed-in' ? cloudMessage : null;

return (
    <AppContext.Provider value={{
      data: visibleData,
      referenceLibraryStatus,
persistenceStatus: {
mode: authStatus === 'signed-in' ? 'signed-in' : 'local-only',
ownerId: persistenceOwnerId,
lastSavedAt,
cloudLastSavedAt,
        cloudLastRetrievedAt,
        cloudStatus: effectiveCloudStatus,
        cloudMessage: effectiveCloudMessage,
        cloudRetrievePreview: pendingCloudRetrieve?.preview ?? null,
        canUndoCloudRetrieve,
      },
      getPeptide,
      getCompound,
      addUserCompound,
      updateUserCompound: updateCustomCompound,
      deleteUserCompound,
      getVial,
      addVial,
      addVials,
      updateVial,
      updateInventoryBatch,
      deleteInventoryItem,
      getDose,
      addDose,
      updateDose,
      getTodaysDoses,
      getTodaysScheduleLogs,
      getRecentDoses,
      getDosesByDate,
      getStreak,
      addReconstitutionCalculation,
      deleteReconstitutionCalculation,
      addSignalCheckIn,
      addLabImport,
      deleteLabReport,
      getStack,
      addStack,
      updateStack,
      deleteStack,
      activateStack,
      updateStackItemSchedule,
      updateStackItemScheduleTimes,
      getScheduleLogsForStack,
      completeScheduleLog,
      skipScheduleLog,
      getActiveStacks,
setHasSeenDisclaimer,
completeOnboarding,
setUserMode,
setTheme,
setDarkMode,
toggleDarkMode,
toggleBiometricLock,
setCloudSyncEnabled,
exportAllData,
importAllData,
        clearAllData,
        saveToCloud,
        previewCloudRetrieve,
        confirmCloudRetrieve,
        cancelCloudRetrievePreview,
        undoLastCloudRetrieve,
        retrieveFromCloud
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
