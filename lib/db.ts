import Dexie, { type Table } from 'dexie';
import type { AppSettings, Compound, Dose, InventoryBatch, ReconstitutionCalculation, Schedule, ScheduleLog, SignalCheckIn, Stack, Vial } from './types';

export const PERSISTENCE_SCHEMA_VERSION = 6;
export const DEFAULT_DATABASE_NAME = 'PeptideOS';

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

export type PersistedVial = Vial & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedInventoryBatch = InventoryBatch & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedDose = Dose & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedStack = Stack & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedSchedule = Schedule & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedScheduleLog = ScheduleLog & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedUserCompound = Compound & {
  source: 'user';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedReconstitutionCalculation = ReconstitutionCalculation & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

export type PersistedSignalCheckIn = SignalCheckIn & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
};

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

    this.version(PERSISTENCE_SCHEMA_VERSION).stores({
      vials: 'id, inventoryBatchId, peptideId, status, updatedAt, syncState, deletedAt',
      inventoryBatches: 'id, peptideId, dateAdded, lotNumber, updatedAt, syncState, deletedAt',
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
  }
}

export function createPeptideOSDatabase(databaseName = DEFAULT_DATABASE_NAME) {
  return new PeptideOSDatabase(databaseName);
}

export const db = createPeptideOSDatabase();
