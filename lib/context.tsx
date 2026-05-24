"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { AppData, Peptide, Vial, Dose, ScheduleLog, SiteCode, Stack, UserMode } from './types';
import { initialAppData } from './mock-data';
import { completeOnboarding as completeOnboardingState } from './onboarding';
import { activateStackSchedules, normalizeStack, updateStackPeptideSchedule } from './schedules';
import type { SchedulePreset } from './schedules';
import {
  downloadUserData,
  exportUserData,
  importUserData,
  loadPersistedAppData,
  resetPersistedAppData,
  savePersistedAppData,
} from './persistence';

interface AppContextType {
  data: AppData;
  // Peptides
  getPeptide: (id: string) => Peptide | undefined;
  // Vials
  getVial: (id: string) => Vial | undefined;
  addVial: (vial: Omit<Vial, 'id'>) => void;
  updateVial: (id: string, updates: Partial<Vial>) => void;
  // Doses
  getDose: (id: string) => Dose | undefined;
  addDose: (dose: Omit<Dose, 'id'>) => void;
  updateDose: (id: string, updates: Partial<Dose>) => void;
  getTodaysDoses: () => Dose[];
  getTodaysScheduleLogs: () => ScheduleLog[];
  getRecentDoses: (limit: number) => Dose[];
  getDosesByDate: (date: Date) => Dose[];
  getStreak: () => number;
  // Stacks
  getStack: (id: string) => Stack | undefined;
  addStack: (stack: Omit<Stack, 'id'>) => void;
  updateStack: (id: string, updates: Partial<Stack>) => void;
  activateStack: (id: string) => void;
  updateStackItemSchedule: (stackId: string, stackPeptideId: string, preset: SchedulePreset) => void;
  getScheduleLogsForStack: (stackId: string) => ScheduleLog[];
  completeScheduleLog: (logId: string, completion: { vialId: string; site: SiteCode | ''; notes: string }) => Promise<void>;
  skipScheduleLog: (logId: string) => Promise<void>;
  getActiveStacks: () => Stack[];
  // Settings
  setHasSeenDisclaimer: (seen: boolean) => void;
  completeOnboarding: (userMode?: UserMode) => Promise<void>;
  toggleDarkMode: () => void;
  toggleBiometricLock: () => void;
  exportAllData: () => Promise<void>;
  importAllData: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialAppData);
  const [hydrated, setHydrated] = useState(false);
  const saveSequence = useRef(0);
  const persistenceQueue = useRef(Promise.resolve());
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let active = true;

    loadPersistedAppData(undefined, initialAppData)
      .then((persistedData) => {
        if (!active) return;
        setData(persistedData);
      })
      .finally(() => {
        if (!active) return;
        setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const enqueuePersistenceOperation = useCallback(<T,>(operation: () => Promise<T>) => {
    const queuedOperation = persistenceQueue.current.then(operation, operation);
    persistenceQueue.current = queuedOperation.then(() => undefined, () => undefined);
    return queuedOperation;
  }, []);

  const setAndPersistData = useCallback(async (updater: (previousData: AppData) => AppData) => {
    const nextData = updater(dataRef.current);
    dataRef.current = nextData;

    if (hydrated) {
      const sequence = ++saveSequence.current;
      await enqueuePersistenceOperation(() => savePersistedAppData(undefined, nextData)).catch((error) => {
        if (sequence === saveSequence.current) {
          console.error('Failed to persist PeptideOS data', error);
        }
      });
    }

    setData(nextData);
  }, [enqueuePersistenceOperation, hydrated]);

  // Peptides
  const getPeptide = useCallback((id: string) => {
    return data.peptides.find(p => p.id === id);
  }, [data.peptides]);

  // Vials
  const getVial = useCallback((id: string) => {
    return data.vials.find(v => v.id === id);
  }, [data.vials]);

  const addVial = useCallback((vial: Omit<Vial, 'id'>) => {
    const newVial: Vial = { ...vial, id: `vial-${Date.now()}` };
    void setAndPersistData(prev => ({ ...prev, vials: [...prev.vials, newVial] }));
  }, [setAndPersistData]);

  const updateVial = useCallback((id: string, updates: Partial<Vial>) => {
    void setAndPersistData(prev => ({
      ...prev,
      vials: prev.vials.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
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

  const getScheduleLogsForStack = useCallback((stackId: string) => {
    return data.scheduleLogs
      .filter((log) => log.stackId === stackId)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [data.scheduleLogs]);

  const completeScheduleLog = useCallback((logId: string, completion: { vialId: string; site: SiteCode | ''; notes: string }) => {
    return setAndPersistData(prev => {
      const log = prev.scheduleLogs.find((candidate) => candidate.id === logId);
      const schedule = log ? prev.schedules.find((candidate) => candidate.id === log.scheduleId) : undefined;
      if (!log || !schedule || log.status !== 'pending') return prev;

      const completedAt = new Date().toISOString();
      const newDose: Dose = {
        id: `dose-${Date.now()}`,
        scheduleLogId: log.id,
        peptideId: schedule.peptideId,
        vialId: completion.vialId,
        dateTime: completedAt,
        doseValue: schedule.doseValue,
        doseUnit: schedule.doseUnit,
        route: schedule.route,
        site: completion.site,
        notes: completion.notes,
        completed: true,
      };

      return {
        ...prev,
        doses: [...prev.doses, newDose],
        scheduleLogs: prev.scheduleLogs.map((candidate) => candidate.id === logId
          ? { ...candidate, status: 'taken', doseId: newDose.id, takenAt: completedAt }
          : candidate),
      };
    });
  }, [setAndPersistData]);

  const skipScheduleLog = useCallback((logId: string) => {
    return setAndPersistData(prev => ({
      ...prev,
      scheduleLogs: prev.scheduleLogs.map((log) => log.id === logId && log.status === 'pending'
        ? { ...log, status: 'skipped', skippedAt: new Date().toISOString() }
        : log),
    }));
  }, [setAndPersistData]);

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

  const toggleDarkMode = useCallback(() => {
    void setAndPersistData(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, [setAndPersistData]);

  const toggleBiometricLock = useCallback(() => {
    void setAndPersistData(prev => ({ ...prev, biometricLock: !prev.biometricLock }));
  }, [setAndPersistData]);

  const exportAllData = useCallback(async () => {
    await persistenceQueue.current;
    const exported = await exportUserData();
    downloadUserData(exported);
  }, []);

  const importAllData = useCallback(async (file: File) => {
    const contents = await file.text();
    saveSequence.current++;
    const importedData = await enqueuePersistenceOperation(() => importUserData(undefined, initialAppData, contents));
    dataRef.current = importedData;
    setData(importedData);
  }, [enqueuePersistenceOperation]);

  const clearAllData = useCallback(async () => {
    saveSequence.current++;
    const resetData = await enqueuePersistenceOperation(() => resetPersistedAppData(undefined, initialAppData));
    setData(resetData);
  }, [enqueuePersistenceOperation]);

  if (!hydrated) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      data,
      getPeptide,
      getVial,
      addVial,
      updateVial,
      getDose,
      addDose,
      updateDose,
      getTodaysDoses,
      getTodaysScheduleLogs,
      getRecentDoses,
      getDosesByDate,
      getStreak,
      getStack,
      addStack,
      updateStack,
      activateStack,
      updateStackItemSchedule,
      getScheduleLogsForStack,
      completeScheduleLog,
      skipScheduleLog,
      getActiveStacks,
      setHasSeenDisclaimer,
      completeOnboarding,
      toggleDarkMode,
      toggleBiometricLock,
      exportAllData,
      importAllData,
      clearAllData
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
