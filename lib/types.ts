// PeptideOS Data Models

export type PeptideCategory = 'healing' | 'growth' | 'cognitive' | 'metabolic' | 'longevity' | 'aesthetic';
export type CompoundType = 'peptide' | 'hormone' | 'glp-1' | 'small-molecule' | 'biologic' | 'supplement' | 'other';
export type CompoundCategory =
  | 'healing'
  | 'growth-hormone'
  | 'metabolic'
  | 'longevity'
  | 'cognitive'
  | 'skin-hair'
  | 'immune'
  | 'sleep'
  | 'sexual-reproductive'
  | 'hormone-endocrine'
  | 'custom';
export type Route = 'subq' | 'im' | 'intranasal' | 'oral' | 'topical';
export type DoseUnit = 'mcg' | 'mg' | 'iu';
export type CompoundSource = 'bundled' | 'user';
export type CurationStatus = 'candidate' | 'draft' | 'reviewed';
export type ConcentrationMode = 'reconstituted' | 'concentration' | 'prefilled' | 'none';
export type ConcentrationUnit = 'mg/ml' | 'iu/ml';
export type DosePresetIntent = 'loggingPreset' | 'labelUnit' | 'commonResearchRange' | 'recommendation';
export type VialStatus = 'sealed' | 'active' | 'finished' | 'expired';
export type StackStatus = 'planned' | 'active' | 'completed' | 'paused';
export type ScheduleStatus = 'active' | 'paused' | 'completed';
export type ScheduleLogStatus = 'pending' | 'taken' | 'skipped' | 'missed';
export type ScheduleFrequency = 'daily' | 'weekly';
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

export interface CompoundDosePreset {
  label: string;
  value: number;
  unit: DoseUnit;
  intent: DosePresetIntent;
  sourceNote: string;
  citationIds: string[];
}

export interface CompoundVialPreset {
  label: string;
  totalAmount?: {
    value: number;
    unit: DoseUnit;
  };
  concentration?: {
    value: number;
    unit: ConcentrationUnit;
  };
  volumeMl?: number;
  sourceNote: string;
  citationIds: string[];
}

export interface CompoundReconstitutionDefaults {
  typicalVialAmounts: Array<{ value: number; unit: DoseUnit }>;
  typicalBacWaterMl: number[];
}

export interface CompoundConversion {
  iuPerMg?: number;
  mgPerIU?: number;
  conversionUnavailableReason?: string;
  notes?: string;
}

export interface Compound {
  id: string;
  name: string;
  aliases: string[];
  compoundType: CompoundType;
  category: CompoundCategory;
  defaultRoute: Route;
  supportedRoutes: Route[];
  defaultDoseUnit: DoseUnit;
  concentrationMode: ConcentrationMode;
  dosePresets: CompoundDosePreset[];
  vialPresets: CompoundVialPreset[];
  reconstitutionDefaults?: CompoundReconstitutionDefaults;
  conversion?: CompoundConversion;
  beginnerSummary: string;
  researcherDetails: string;
  mechanism?: string;
  safety: string;
  storage: string;
  citations: Citation[];
  source: CompoundSource;
  curationStatus: CurationStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncState?: 'local' | 'synced' | 'dirty';
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
  scheduleLogId?: string;
  dateTime: string;
  doseValue: number;
  doseUnit: DoseUnit;
  route: Route;
  site: SiteCode | '';
  notes: string;
  completed: boolean;
}

export interface StackPeptide {
  id?: string;
  peptideId: string;
  doseValue: number;
  doseUnit: DoseUnit;
  frequency: string;
  route: Route;
  timing: string;
  schedule?: ScheduleRecurrence;
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

export interface ScheduleRecurrence {
  frequency: ScheduleFrequency;
  timesOfDay: string[];
  weekdays?: number[];
}

export interface Schedule {
  id: string;
  stackId: string;
  stackPeptideId: string;
  peptideId: string;
  doseValue: number;
  doseUnit: DoseUnit;
  route: Route;
  recurrence: ScheduleRecurrence;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
}

export interface ScheduleLog {
  id: string;
  scheduleId: string;
  stackId: string;
  stackPeptideId: string;
  peptideId: string;
  dueAt: string;
  status: ScheduleLogStatus;
  doseId?: string;
  takenAt?: string;
  skippedAt?: string;
}

export interface AppData {
  peptides: Peptide[];
  vials: Vial[];
  doses: Dose[];
  stacks: Stack[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
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
