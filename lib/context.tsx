"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AppData, Compound, Peptide, Vial, Dose, InventoryBatch, LabImportAudit, LabReport, LabResult, ReconstitutionCalculation, ScheduleLog, SignalCheckIn, SiteCode, Stack, UserMode } from './types';
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
importUserData,
loadPersistedAppData,
resetPersistedAppData,
restorePersistedUserData,
savePersistedAppData,
} from './persistence';
import { createUserCompound, softDeleteUserCompound, updateUserCompound, type UserCompoundDraft } from './user-compounds';
import { completeDueDose, skipDueDose } from './due-doses';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';
import { createSupabaseReferenceLibraryReader, getReleasedReferenceLibrary, type SupabaseReferenceLibraryClient } from './reference-library-source';
import { applyReleasedReferenceLibrarySnapshot } from './reference-library-state';
import { buildReferenceLibraryStatus, type ReferenceLibraryStatus } from './reference-library-status';
import { createSupabaseUserDataSyncAdapter, type SupabaseSyncClient } from './supabase-sync';

const bundledReferenceLibrarySnapshot = buildBundledReferenceSnapshot(referenceCompounds);
const bundledReferenceLibraryStatus: ReferenceLibraryStatus = {
  source: 'bundled-fallback',
  version: bundledReferenceLibrarySnapshot.libraryVersion,
  loadedAt: bundledReferenceLibrarySnapshot.exportedAt,
  fallbackReason: 'Supabase reference library is not configured.',
};

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
  addLabImport: (input: { report: LabReport; results: LabResult[]; audit: LabImportAudit }) => void;
  deleteLabReport: (reportId: string) => void;
  // Stacks
  getStack: (id: string) => Stack | undefined;
  addStack: (stack: Omit<Stack, 'id'>) => void;
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
setDarkMode: (enabled: boolean) => void;
toggleDarkMode: () => void;
toggleBiometricLock: () => void;
setCloudSyncEnabled: (enabled: boolean) => Promise<void>;
exportAllData: () => Promise<void>;
importAllData: (file: File) => Promise<void>;
clearAllData: () => Promise<void>;
saveToCloud: () => Promise<void>;
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
const [referenceLibraryStatus, setReferenceLibraryStatus] = useState<ReferenceLibraryStatus>(bundledReferenceLibraryStatus);
const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
const [cloudLastSavedAt, setCloudLastSavedAt] = useState<string | null>(null);
const [cloudLastRetrievedAt, setCloudLastRetrievedAt] = useState<string | null>(null);
const [cloudStatus, setCloudStatus] = useState<'unavailable' | 'ready' | 'saving' | 'retrieving' | 'error'>('unavailable');
const [cloudMessage, setCloudMessage] = useState<string | null>(null);
const [hydratedOwnerId, setHydratedOwnerId] = useState<string | null>(null);
  const hydrated = authStatus !== 'loading' && hydratedOwnerId === persistenceOwnerId;
  const saveSequence = useRef(0);
const persistenceQueue = useRef(Promise.resolve());
const dataRef = useRef(data);
const loadedReferenceLibraryKey = useRef<string | null>(null);
const autoCloudRetrieveKey = useRef<string | null>(null);
const skipNextCloudPush = useRef(false);

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
dataRef.current = persistedData;
setData(persistedData);
return persistenceDb.metadata.get('lastSavedAt');
})
.then((metadata) => {
if (!active) return;
setLastSavedAt(typeof metadata?.value === 'string' ? metadata.value : null);
})
.finally(() => {
        if (!active) return;
        setHydratedOwnerId(persistenceOwnerId);
      });

    return () => {
      active = false;
    };
  }, [authStatus, persistenceDb, persistenceOwnerId]);

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
const exported = await exportUserData(persistenceDb);
const result = await cloudSyncAdapter.pushUserData({
userId: authUser.id,
data: exported.data,
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
    const createdAt = Date.now();
    const batchId = `batch-${createdAt}`;
    const newVial: Vial = { ...vial, id: `vial-${createdAt}`, inventoryBatchId: batchId };
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
    const createdAt = Date.now();
    const batchId = `batch-${createdAt}`;
    const newVials: Vial[] = vials.map((vial, index) => ({
      ...vial,
      id: `vial-${createdAt}-${index}`,
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
      const vials = prev.vials.filter((vial) => !vialIdsToDelete.has(vial.id));
      const remainingBatchIds = new Set(vials.map((vial) => vial.inventoryBatchId).filter(Boolean));

      return {
        ...prev,
        vials,
        inventoryBatches: prev.inventoryBatches.filter((batch) => remainingBatchIds.has(batch.id)),
        doses: prev.doses.filter((dose) => !vialIdsToDelete.has(dose.vialId)),
      };
    });
  }, [setAndPersistData]);

  // Doses
  const getDose = useCallback((id: string) => {
    return data.doses.find(d => d.id === id);
  }, [data.doses]);

  const addDose = useCallback((dose: Omit<Dose, 'id'>) => {
    const newDose: Dose = { ...dose, id: `dose-${Date.now()}` };
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
      reconstitutionCalculations: prev.reconstitutionCalculations.filter((calculation) => calculation.id !== id),
    }));
  }, [setAndPersistData]);

  const addSignalCheckIn = useCallback((checkIn: Omit<SignalCheckIn, 'id'>) => {
    const newCheckIn: SignalCheckIn = { ...checkIn, id: `signal-${Date.now()}` };
    void setAndPersistData(prev => ({
      ...prev,
      signalCheckIns: [newCheckIn, ...prev.signalCheckIns],
    }));
  }, [setAndPersistData]);

  const addLabImport = useCallback((input: { report: LabReport; results: LabResult[]; audit: LabImportAudit }) => {
    void setAndPersistData(prev => ({
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
    void setAndPersistData(prev => ({
      ...prev,
      labReports: prev.labReports.filter((report) => report.id !== reportId),
      labResults: prev.labResults.filter((result) => result.reportId !== reportId),
      labImportAudits: prev.labImportAudits.filter((audit) => audit.reportId !== reportId),
    }));
  }, [setAndPersistData]);

  // Stacks
  const getStack = useCallback((id: string) => {
    return data.stacks.find(s => s.id === id);
  }, [data.stacks]);

  const addStack = useCallback((stack: Omit<Stack, 'id'>) => {
    const id = `stack-${Date.now()}`;
    const newStack: Stack = normalizeStack({ ...stack, id });
    void setAndPersistData(prev => ({ ...prev, stacks: [...prev.stacks, newStack] }));
  }, [setAndPersistData]);

  const updateStack = useCallback((id: string, updates: Partial<Stack>) => {
    void setAndPersistData(prev => ({
      ...prev,
      stacks: prev.stacks.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, [setAndPersistData]);

  const deleteStack = useCallback((id: string) => {
    return setAndPersistData(prev => {
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
        stacks: prev.stacks.filter((stack) => stack.id !== id),
        schedules: prev.schedules.filter((schedule) => schedule.stackId !== id),
        scheduleLogs: prev.scheduleLogs.filter((log) => (
          log.stackId !== id && !scheduleIdsToDelete.has(log.scheduleId)
        )),
        doses: prev.doses.filter((dose) => (
          !dose.scheduleLogId || !scheduleLogIdsToDelete.has(dose.scheduleLogId)
        )),
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
    return data.stacks.filter(s => s.status === 'active');
  }, [data.stacks]);

  // Settings
  const setHasSeenDisclaimer = useCallback((seen: boolean) => {
    void setAndPersistData(prev => ({ ...prev, hasSeenDisclaimer: seen }));
  }, [setAndPersistData]);

const completeOnboarding = useCallback((userMode?: UserMode) => {
return setAndPersistData(prev => completeOnboardingState(prev, userMode));
}, [setAndPersistData]);

const setDarkMode = useCallback((enabled: boolean) => {
void setAndPersistData(prev => ({ ...prev, darkMode: enabled }));
}, [setAndPersistData]);

const toggleDarkMode = useCallback(() => {
void setAndPersistData(prev => ({ ...prev, darkMode: !prev.darkMode }));
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
const exported = await exportUserData(persistenceDb);
const syncedAt = new Date();
const result = await cloudSyncAdapter.pushUserData({
userId: authUser.id,
data: exported.data,
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

const retrieveFromCloud = useCallback(async () => {
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

const restoredAt = new Date();
saveSequence.current++;
const persistedCloudSyncEnabled = dataRef.current.cloudSyncEnabled;
const restoredPersistedData = {
...result.data,
settings: {
...result.data.settings,
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
setCloudStatus('ready');
setCloudMessage(`Retrieved ${result.pulledRows} records from cloud.`);
} catch (error) {
setCloudStatus('error');
setCloudMessage(error instanceof Error ? error.message : 'Cloud retrieve failed.');
}
}, [authStatus, authUser, cloudSyncAdapter, enqueuePersistenceOperation, persistenceDb, persistenceOwnerId]);

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

await retrieveFromCloud();
await saveToCloud();
}, [authStatus, retrieveFromCloud, saveToCloud, setAndPersistData]);

useEffect(() => {
if (!hydrated || authStatus !== 'signed-in' || !authUser || !data.cloudSyncEnabled || !cloudSyncAdapter) return;
const syncKey = `${authUser.id}:${persistenceOwnerId}`;
if (autoCloudRetrieveKey.current === syncKey) return;
autoCloudRetrieveKey.current = syncKey;
void retrieveFromCloud();
}, [authStatus, authUser, cloudSyncAdapter, data.cloudSyncEnabled, hydrated, persistenceOwnerId, retrieveFromCloud]);

if (!hydrated) {
return null;
}

const effectiveCloudStatus = authStatus === 'signed-in' && cloudSyncAdapter
? (cloudStatus === 'unavailable' ? 'ready' : cloudStatus)
: 'unavailable';
const effectiveCloudMessage = authStatus === 'signed-in' && !cloudSyncAdapter
? 'Cloud sync is not configured for this build.'
: authStatus === 'signed-in' ? cloudMessage : null;

return (
    <AppContext.Provider value={{
      data,
      referenceLibraryStatus,
persistenceStatus: {
mode: authStatus === 'signed-in' ? 'signed-in' : 'local-only',
ownerId: persistenceOwnerId,
lastSavedAt,
cloudLastSavedAt,
cloudLastRetrievedAt,
cloudStatus: effectiveCloudStatus,
cloudMessage: effectiveCloudMessage,
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
setDarkMode,
toggleDarkMode,
toggleBiometricLock,
setCloudSyncEnabled,
exportAllData,
importAllData,
clearAllData,
saveToCloud,
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
