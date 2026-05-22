"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppData, Peptide, Vial, Dose, Stack, UserMode } from './types';
import { initialAppData } from './mock-data';
import { completeOnboarding as completeOnboardingState } from './onboarding';

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
  getRecentDoses: (limit: number) => Dose[];
  getDosesByDate: (date: Date) => Dose[];
  getStreak: () => number;
  // Stacks
  getStack: (id: string) => Stack | undefined;
  addStack: (stack: Omit<Stack, 'id'>) => void;
  updateStack: (id: string, updates: Partial<Stack>) => void;
  getActiveStacks: () => Stack[];
  // Settings
  setHasSeenDisclaimer: (seen: boolean) => void;
  completeOnboarding: (userMode?: UserMode) => void;
  toggleDarkMode: () => void;
  toggleBiometricLock: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialAppData);

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
    setData(prev => ({ ...prev, vials: [...prev.vials, newVial] }));
  }, []);

  const updateVial = useCallback((id: string, updates: Partial<Vial>) => {
    setData(prev => ({
      ...prev,
      vials: prev.vials.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  }, []);

  // Doses
  const getDose = useCallback((id: string) => {
    return data.doses.find(d => d.id === id);
  }, [data.doses]);

  const addDose = useCallback((dose: Omit<Dose, 'id'>) => {
    const newDose: Dose = { ...dose, id: `dose-${Date.now()}` };
    setData(prev => ({ ...prev, doses: [...prev.doses, newDose] }));
  }, []);

  const updateDose = useCallback((id: string, updates: Partial<Dose>) => {
    setData(prev => ({
      ...prev,
      doses: prev.doses.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  }, []);

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
    const newStack: Stack = { ...stack, id: `stack-${Date.now()}` };
    setData(prev => ({ ...prev, stacks: [...prev.stacks, newStack] }));
  }, []);

  const updateStack = useCallback((id: string, updates: Partial<Stack>) => {
    setData(prev => ({
      ...prev,
      stacks: prev.stacks.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, []);

  const getActiveStacks = useCallback(() => {
    return data.stacks.filter(s => s.status === 'active');
  }, [data.stacks]);

  // Settings
  const setHasSeenDisclaimer = useCallback((seen: boolean) => {
    setData(prev => ({ ...prev, hasSeenDisclaimer: seen }));
  }, []);

  const completeOnboarding = useCallback((userMode?: UserMode) => {
    setData(prev => completeOnboardingState(prev, userMode));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setData(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const toggleBiometricLock = useCallback(() => {
    setData(prev => ({ ...prev, biometricLock: !prev.biometricLock }));
  }, []);

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
      getRecentDoses,
      getDosesByDate,
      getStreak,
      getStack,
      addStack,
      updateStack,
      getActiveStacks,
      setHasSeenDisclaimer,
      completeOnboarding,
      toggleDarkMode,
      toggleBiometricLock
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
