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
export type InventoryContainerType = 'lyophilized-vial' | 'multi-dose-vial' | 'prefilled-pen' | 'capsule-bottle' | 'other';
export type DosePresetIntent = 'loggingPreset' | 'labelUnit' | 'commonResearchRange' | 'recommendation';
export type VialStatus = 'sealed' | 'active' | 'finished' | 'expired';
export type StackStatus = 'planned' | 'active' | 'completed' | 'paused';
export type ScheduleStatus = 'active' | 'paused' | 'completed';
export type ScheduleLogStatus = 'pending' | 'taken' | 'skipped' | 'missed';
export type ScheduleFrequency = 'daily' | 'weekly' | 'interval' | 'cycle';
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

export interface CompoundPharmacokinetics {
  halfLifeHours: number;
  halfLifeSource: string;
  citationIds: string[];
  evidenceTier: ReferenceEvidenceTier;
  modelNotes: string;
}

export type ReferenceEvidenceTier =
  | 'identity-only'
  | 'preclinical'
  | 'early-human'
  | 'phase-2-published'
  | 'phase-3-topline'
  | 'phase-3-active'
  | 'approved-label';

export type ReferenceSourceQuality =
  | 'source-backed'
  | 'label-backed'
  | 'trial-registry'
  | 'community-reported'
  | 'uncited-emerging';

export interface ReferenceClinicalEvidence {
  design: string;
  population: string;
  finding: string;
  citationIds: string[];
  sourceQuality?: ReferenceSourceQuality;
  limitations?: string;
}

export interface ReferenceRegulatoryStatus {
  status: 'approved' | 'investigational' | 'research-use' | 'unknown';
  region: string;
  summary: string;
  citationIds: string[];
  sourceQuality?: ReferenceSourceQuality;
  limitations?: string;
}

export interface CompoundBiohackerBrief {
  headline: string;
  whyPeopleCare: string[];
  verifyBeforeUse: string[];
  trackInApp: string[];
  realityCheck: string;
}

export interface CompoundReferenceProfile {
  evidenceTier: ReferenceEvidenceTier;
  biohackerBrief: CompoundBiohackerBrief;
  reviewSummary: string;
  mechanismTargets: string[];
  clinicalEvidence: ReferenceClinicalEvidence[];
  safetySignals: string[];
  practicalNotes: string[];
  evidenceGaps: string[];
  regulatoryStatus: ReferenceRegulatoryStatus;
  peptideOSActions: string[];
}

export interface CompoundActionableProfile {
  headline: string;
  summary: string;
  evidenceLabel: string;
  statusLabel: string;
  mechanismClass: string;
  primaryActions: string[];
  verifyBeforeUse: string[];
  trackInApp: string[];
  inventoryGuidance: string[];
  transparencyFlags: string[];
  trackingDomains: string[];
  peppiPrompts: string[];
}

export interface CompoundLibraryClassification {
  categoryGroup: string;
  secondaryCategories: string[];
  protocolCategories: string[];
}

export interface CompoundInventoryProfile {
  containerTypes: InventoryContainerType[];
  defaultPackageUnit: 'vial' | 'kit';
  defaultVialCount: number;
  requiredFields: string[];
  optionalFields: string[];
}

export interface CompoundCalculatorProfile {
  reconstitutionCompatible: boolean;
  typicalVialAmounts: Array<{ value: number; unit: DoseUnit }>;
  typicalBacWaterMl: number[];
  syringeTypes: string[];
  notes: string[];
}

export interface CompoundProtocolDose {
  value: number;
  unit: DoseUnit;
  label: string;
}

export interface CompoundProtocolTitrationStep {
  doseValue: number;
  doseUnit: DoseUnit;
  durationWeeks: number;
}

export interface CompoundProtocolTemplate {
  id: string;
  name: string;
  category: string;
  difficulty: 'simple' | 'standard' | 'advanced' | 'custom';
  summary: string;
  compoundIds: string[];
  defaultCompoundId: string;
  doseChips: CompoundProtocolDose[];
  defaultDose: Omit<CompoundProtocolDose, 'label'>;
  schedule: ScheduleRecurrence;
  titration: CompoundProtocolTitrationStep[];
  warnings: string[];
  importantNotes: string[];
}

export interface CompoundPeppiAction {
  id: string;
  type:
    | 'build_protocol_preview'
    | 'create_inventory_from_label'
    | 'calculate_reconstitution'
    | 'summarize_tracking'
    | 'answer_compound_question';
  label: string;
  requiresConfirmation: boolean;
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
  pharmacokinetics?: CompoundPharmacokinetics;
  beginnerSummary: string;
  researcherDetails: string;
  mechanism?: string;
  safety: string;
  storage: string;
  citations: Citation[];
  referenceProfile?: CompoundReferenceProfile;
  actionableProfile?: CompoundActionableProfile;
  libraryClassification?: CompoundLibraryClassification;
  inventoryProfile?: CompoundInventoryProfile;
  calculatorProfile?: CompoundCalculatorProfile;
  protocolTemplates?: CompoundProtocolTemplate[];
  peppiActions?: CompoundPeppiAction[];
  source: CompoundSource;
  curationStatus: CurationStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  syncState?: 'local' | 'synced' | 'dirty';
}

export interface Vial {
  id: string;
  inventoryBatchId?: string;
  name: string;
  peptideId: string;
  containerType?: InventoryContainerType;
  dateAdded: string;
  source: string;
  lotNumber: string;
  mg: number;
  totalAmount?: {
    value: number;
    unit: DoseUnit;
  };
  concentration?: {
    value: number;
    unit: ConcentrationUnit;
  };
  volumeMl?: number;
  bacWaterMl: number;
  reconstitutedDate: string | null;
  expirationDate: string;
  status: VialStatus;
}

export interface InventoryBatch {
  id: string;
  name: string;
  peptideId: string;
  containerType?: InventoryContainerType;
  dateAdded: string;
  source: string;
  lotNumber: string;
  mg: number;
  totalAmount?: {
    value: number;
    unit: DoseUnit;
  };
  packageUnit?: 'vial' | 'kit';
  packageQuantity?: number;
  vialCount: number;
  createdFrom: 'manual' | 'assistant' | 'import' | 'legacy';
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
  deletedAt?: string | null;
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
  deletedAt?: string | null;
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
  intervalDays?: number;
  cycleOnDays?: number;
  cycleOffDays?: number;
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
  deletedAt?: string | null;
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
  missedAt?: string;
  deletedAt?: string | null;
}

export interface ReconstitutionCalculation {
  id: string;
  compoundName: string;
  compoundId: string;
  vialSize: number;
  vialUnit: 'mg' | 'iu';
  bacWaterMl: number;
  doseValue: number;
  doseUnit: DoseUnit;
  drawUnits: number;
  drawMl: number;
  concentration: string;
  dosesPerVial: number;
  savedAt: string;
}

export interface SignalCheckIn {
  id: string;
  checkedAt: string;
  energy: number;
  sleepHours: number;
  notes: string;
}

export type LabImportMethod = 'manual' | 'csv' | 'text' | 'pdf' | 'photo';
export type LabResultFlag = 'low' | 'high' | 'normal' | 'critical' | 'unknown';

export interface LabReferenceRange {
  text: string;
  low?: number;
  high?: number;
}

export interface LabReport {
  id: string;
  drawDate: string;
  resultedDate?: string;
  sourceLabel?: string;
  panelName?: string;
  linkedStackId?: string;
  sourceMethod?: LabImportMethod;
  uniqueImportKey: string;
  notes: string;
  createdAt: string;
}

export interface LabResult {
  id: string;
  reportId: string;
  testName: string;
  normalizedKey: string;
  assayMethod?: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange?: LabReferenceRange;
  flag: LabResultFlag;
  panelName?: string;
}

export interface LabImportAudit {
  id: string;
  reportId: string;
  method: LabImportMethod;
  importedAt: string;
  parserConfidence: number;
  unresolvedRows: string[];
  duplicateStatus: 'new' | 'possible-duplicate';
}

export interface AppData {
  peptides: Peptide[];
  compounds: Compound[];
  vials: Vial[];
  inventoryBatches: InventoryBatch[];
  doses: Dose[];
  stacks: Stack[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  reconstitutionCalculations: ReconstitutionCalculation[];
  signalCheckIns: SignalCheckIn[];
  labReports: LabReport[];
  labResults: LabResult[];
  labImportAudits: LabImportAudit[];
  hasSeenDisclaimer: boolean;
  hasCompletedOnboarding: boolean;
  userMode: UserMode;
biometricLock: boolean;
darkMode: boolean;
cloudSyncEnabled?: boolean;
}

export interface AppSettings {
hasSeenDisclaimer: boolean;
hasCompletedOnboarding: boolean;
userMode: UserMode;
biometricLock: boolean;
darkMode: boolean;
cloudSyncEnabled?: boolean;
}
