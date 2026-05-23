// PeptideOS Data Models

export type PeptideCategory = 'healing' | 'growth' | 'cognitive' | 'metabolic' | 'longevity' | 'aesthetic';
export type Route = 'subq' | 'im' | 'intranasal' | 'oral' | 'topical';
export type DoseUnit = 'mcg' | 'mg' | 'iu';
export type VialStatus = 'sealed' | 'active' | 'finished' | 'expired';
export type StackStatus = 'planned' | 'active' | 'completed' | 'paused';
export type UserMode = 'beginner' | 'researcher';
export type SiteCode =
  | 'abdomen-upper-left'
  | 'abdomen-upper-right'
  | 'abdomen-mid-left'
  | 'abdomen-mid-right'
  | 'abdomen-lower-left'
  | 'abdomen-lower-right'
  | 'flank-left'
  | 'flank-right'
  | 'thigh-front-upper-left'
  | 'thigh-front-upper-right'
  | 'thigh-front-mid-left'
  | 'thigh-front-mid-right'
  | 'thigh-outer-left'
  | 'thigh-outer-right'
  | 'delt-anterior-left'
  | 'delt-anterior-right'
  | 'delt-lateral-left'
  | 'delt-lateral-right'
  | 'delt-posterior-left'
  | 'delt-posterior-right'
  | 'glute-upper-outer-left'
  | 'glute-upper-outer-right'
  | 'lower-back-left'
  | 'lower-back-right';

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
  name: string;
  peptideId: string;
  dateAdded: string;
  source: string;
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
  site: SiteCode | '';
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
  hasSeenDisclaimer: boolean;
  hasCompletedOnboarding: boolean;
  userMode: UserMode;
  biometricLock: boolean;
  darkMode: boolean;
}

export interface AppSettings {
  hasSeenDisclaimer: boolean;
  hasCompletedOnboarding: boolean;
  userMode: UserMode;
  biometricLock: boolean;
  darkMode: boolean;
}
