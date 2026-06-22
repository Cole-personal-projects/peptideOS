import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  Compound,
  Dose,
  InventoryBatch,
  LabImportAudit,
  LabReport,
  LabResult,
  ReconstitutionCalculation,
  Schedule,
  ScheduleLog,
  SignalCheckIn,
  Stack,
  Vial,
} from './types';

export const PERSISTENCE_SCHEMA_VERSION = 7;
export const DEFAULT_DATABASE_NAME = 'PeptideOS';
export const LOCAL_PERSISTENCE_OWNER_ID = 'local';

export type SyncState = 'local' | 'synced' | 'dirty';

export interface PersistedMetadata {
  key: string;
  value: unknown;
}

export interface PersistedAppSettings extends AppSettings {
  id: 'app-settings';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
}

type PersistedRecord<T> = T & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedVial = PersistedRecord<Vial>;
export type PersistedInventoryBatch = PersistedRecord<InventoryBatch>;
export type PersistedDose = PersistedRecord<Dose>;
export type PersistedStack = PersistedRecord<Stack>;
export type PersistedSchedule = PersistedRecord<Schedule>;
export type PersistedScheduleLog = PersistedRecord<ScheduleLog>;
export type PersistedUserCompound = PersistedRecord<Compound & { source: 'user' }>;
export type PersistedReconstitutionCalculation = PersistedRecord<ReconstitutionCalculation>;
export type PersistedSignalCheckIn = PersistedRecord<SignalCheckIn>;
export type PersistedLabReport = PersistedRecord<LabReport>;
export type PersistedLabResult = PersistedRecord<LabResult>;
export type PersistedLabImportAudit = PersistedRecord<LabImportAudit>;

export class PeptideOSDatabase extends Dexie {
  vials!: Table<PersistedVial, string>;
  inventoryBatches!: Table<PersistedInventoryBatch, string>;
  doses!: Table<PersistedDose, string>;
  stacks!: Table<PersistedStack, string>;
  schedules!: Table<PersistedSchedule, string>;
  scheduleLogs!: Table<PersistedScheduleLog, string>;
  userCompounds!: Table<PersistedUserCompound, string>;
  reconstitutionCalculations!: Table<PersistedReconstitutionCalculation, string>;
  signalCheckIns!: Table<PersistedSignalCheckIn, string>;
  labReports!: Table<PersistedLabReport, string>;
  labResults!: Table<PersistedLabResult, string>;
  labImportAudits!: Table<PersistedLabImportAudit, string>;
  settings!: Table<PersistedAppSettings, string>;
  metadata!: Table<PersistedMetadata, string>;

  constructor(databaseName = DEFAULT_DATABASE_NAME) {
    super(databaseName);

    this.version(1).stores({
      vials: 'id, peptideId, status, updatedAt, syncState, deletedAt',
      doses: 'id, peptideId, vialId, dateTime, completed, updatedAt, syncState, deletedAt',
      stacks: 'id, status, updatedAt, syncState, deletedAt',
      settings: 'id, updatedAt, syncState',
      metadata: 'key',
    });

    this.version(2).stores({
      vials: 'id, peptideId, status, updatedAt, syncState, deletedAt',
      doses: 'id, peptideId, vialId, scheduleLogId, dateTime, completed, updatedAt, syncState, deletedAt',
      stacks: 'id, status, updatedAt, syncState, deletedAt',
      schedules: 'id, stackId, stackPeptideId, peptideId, status, updatedAt, syncState, deletedAt',
      scheduleLogs: 'id, scheduleId, stackId, stackPeptideId, peptideId, dueAt, status, doseId, updatedAt, syncState, deletedAt',
      settings: 'id, updatedAt, syncState',
      metadata: 'key',
    });

    this.version(4).stores({
      vials: 'id, peptideId, status, updatedAt, syncState, deletedAt',
      doses: 'id, peptideId, vialId, scheduleLogId, dateTime, completed, updatedAt, syncState, deletedAt',
      stacks: 'id, status, updatedAt, syncState, deletedAt',
      schedules: 'id, stackId, stackPeptideId, peptideId, status, updatedAt, syncState, deletedAt',
      scheduleLogs: 'id, scheduleId, stackId, stackPeptideId, peptideId, dueAt, status, doseId, updatedAt, syncState, deletedAt',
      userCompounds: 'id, compoundType, category, updatedAt, syncState, deletedAt',
      reconstitutionCalculations: 'id, compoundId, savedAt, updatedAt, syncState, deletedAt',
      settings: 'id, updatedAt, syncState',
      metadata: 'key',
    });

    this.version(5).stores({
      vials: 'id, peptideId, status, updatedAt, syncState, deletedAt',
      doses: 'id, peptideId, vialId, scheduleLogId, dateTime, completed, updatedAt, syncState, deletedAt',
      stacks: 'id, status, updatedAt, syncState, deletedAt',
      schedules: 'id, stackId, stackPeptideId, peptideId, status, updatedAt, syncState, deletedAt',
      scheduleLogs: 'id, scheduleId, stackId, stackPeptideId, peptideId, dueAt, status, doseId, updatedAt, syncState, deletedAt',
      userCompounds: 'id, compoundType, category, updatedAt, syncState, deletedAt',
      reconstitutionCalculations: 'id, compoundId, savedAt, updatedAt, syncState, deletedAt',
      signalCheckIns: 'id, checkedAt, updatedAt, syncState, deletedAt',
      settings: 'id, updatedAt, syncState',
      metadata: 'key',
    });

    this.version(6).stores({
      vials: 'id, peptideId, status, updatedAt, syncState, deletedAt',
      inventoryBatches: 'id, peptideId, dateAdded, expirationDate, updatedAt, syncState, deletedAt',
      doses: 'id, peptideId, vialId, scheduleLogId, dateTime, completed, updatedAt, syncState, deletedAt',
      stacks: 'id, status, updatedAt, syncState, deletedAt',
      schedules: 'id, stackId, stackPeptideId, peptideId, status, updatedAt, syncState, deletedAt',
      scheduleLogs: 'id, scheduleId, stackId, stackPeptideId, peptideId, dueAt, status, doseId, updatedAt, syncState, deletedAt',
      userCompounds: 'id, compoundType, category, updatedAt, syncState, deletedAt',
      reconstitutionCalculations: 'id, compoundId, savedAt, updatedAt, syncState, deletedAt',
      signalCheckIns: 'id, checkedAt, updatedAt, syncState, deletedAt',
      settings: 'id, updatedAt, syncState',
      metadata: 'key',
    });

    this.version(7).stores({
      vials: 'id, peptideId, status, updatedAt, syncState, deletedAt',
      inventoryBatches: 'id, peptideId, dateAdded, expirationDate, updatedAt, syncState, deletedAt',
      doses: 'id, peptideId, vialId, scheduleLogId, dateTime, completed, updatedAt, syncState, deletedAt',
      stacks: 'id, status, updatedAt, syncState, deletedAt',
      schedules: 'id, stackId, stackPeptideId, peptideId, status, updatedAt, syncState, deletedAt',
      scheduleLogs: 'id, scheduleId, stackId, stackPeptideId, peptideId, dueAt, status, doseId, updatedAt, syncState, deletedAt',
      userCompounds: 'id, compoundType, category, updatedAt, syncState, deletedAt',
      reconstitutionCalculations: 'id, compoundId, savedAt, updatedAt, syncState, deletedAt',
      signalCheckIns: 'id, checkedAt, updatedAt, syncState, deletedAt',
      labReports: 'id, drawDate, uniqueImportKey, updatedAt, syncState, deletedAt',
      labResults: 'id, reportId, normalizedKey, testName, updatedAt, syncState, deletedAt',
      labImportAudits: 'id, reportId, method, importedAt, updatedAt, syncState, deletedAt',
      settings: 'id, updatedAt, syncState',
      metadata: 'key',
    });
  }
}

export function createPeptideOSDatabase(databaseName = DEFAULT_DATABASE_NAME) {
  return new PeptideOSDatabase(databaseName);
}

export function getPersistenceOwnerId(user?: { id?: string | null } | null) {
  const userId = user?.id?.trim();
  return userId ? `user:${userId}` : LOCAL_PERSISTENCE_OWNER_ID;
}

export function getScopedDatabaseName(ownerId = LOCAL_PERSISTENCE_OWNER_ID) {
  if (ownerId === LOCAL_PERSISTENCE_OWNER_ID) return DEFAULT_DATABASE_NAME;
  return `${DEFAULT_DATABASE_NAME}:${encodeURIComponent(ownerId)}`;
}

export function createScopedPeptideOSDatabase(ownerId = LOCAL_PERSISTENCE_OWNER_ID) {
  return createPeptideOSDatabase(getScopedDatabaseName(ownerId));
}

export const db = createPeptideOSDatabase();
