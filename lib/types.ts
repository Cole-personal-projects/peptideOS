// PeptideOS Data Models

export type PeptideCategory = 'healing' | 'growth' | 'cognitive' | 'metabolic' | 'longevity' | 'aesthetic';
export type Route = 'subq' | 'im' | 'intranasal' | 'oral' | 'topical';
export type DoseUnit = 'mcg' | 'mg' | 'iu';
export type VialStatus = 'sealed' | 'active' | 'finished' | 'expired';
export type StackStatus = 'planned' | 'active' | 'completed' | 'paused';

export interface Citation {
  id: string;
  title: string;
  url: string;
  source: string;
  year: number;
}

export interface Peptide {
  id: string;
  name: string;
  category: PeptideCategory;
  defaultRoute: Route;
  halfLifeHours: number;
  beginnerSummary: string;
  researcherDetails: string;
  mechanism: string;
  protocols: string[];
  safety: string;
  storage: string;
  citations: Citation[];
}

export interface Vial {
  id: string;
  peptideId: string;
  vendor: string;
  lotNumber: string;
  mg: number;
  bacWaterMl: number;
  reconstitutedDate: string | null;
  expirationDate: string;
  status: VialStatus;
}

export interface Dose {
  id: string;
  peptideId: string;
  vialId: string;
  dateTime: string;
  doseValue: number;
  doseUnit: DoseUnit;
  route: Route;
  site: string;
  notes: string;
  completed: boolean;
}

export interface StackPeptide {
  peptideId: string;
  doseValue: number;
  doseUnit: DoseUnit;
  frequency: string;
  route: Route;
  timing: string;
}

export interface Stack {
  id: string;
  name: string;
  description: string;
  peptides: StackPeptide[];
  startDate: string;
  durationDays: number;
  status: StackStatus;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  privateNotes: string;
  peptidesPurchased: string[];
}

export interface PlannedDose {
  id: string;
  peptideId: string;
  stackId: string;
  doseValue: number;
  doseUnit: DoseUnit;
  route: Route;
  timing: string;
  completed: boolean;
}

export interface AppData {
  peptides: Peptide[];
  vials: Vial[];
  doses: Dose[];
  stacks: Stack[];
  vendors: Vendor[];
  hasSeenDisclaimer: boolean;
  biometricLock: boolean;
  darkMode: boolean;
}
