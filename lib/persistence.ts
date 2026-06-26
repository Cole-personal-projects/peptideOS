import {
  db as defaultDb,
  LOCAL_PERSISTENCE_OWNER_ID,
  PERSISTENCE_SCHEMA_VERSION,
  type PeptideOSDatabase,
  type PersistedDose,
  type PersistedInventoryBatch,
  type PersistedLabImportAudit,
  type PersistedLabReport,
  type PersistedLabResult,
  type PersistedReconstitutionCalculation,
  type PersistedSchedule,
  type PersistedScheduleLog,
  type PersistedSignalCheckIn,
  type PersistedStack,
  type PersistedUserCompound,
  type PersistedVial,
  type SyncState,
} from './db';
import { ensureInventoryBatches } from './inventory-batches';
import { normalizeStacks } from './schedules';
import { getPersistableUserCompounds, mergeCompoundLibrary } from './user-compounds';
import type {
  AppData,
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

export interface PersistedUserData {
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
  userCompounds: Compound[];
  settings: AppSettings;
}

export interface UserDataExport {
  schemaVersion: number;
  exportedAt: string;
  data: PersistedUserData;
}

export interface UserDataImportPreview {
  schemaVersion: number;
  exportedAt: string;
  counts: {
    vials: number;
    inventoryBatches: number;
    doses: number;
    stacks: number;
    schedules: number;
    scheduleLogs: number;
    reconstitutionCalculations: number;
    signalCheckIns: number;
    labReports: number;
    labResults: number;
    labImportAudits: number;
    userCompounds: number;
  };
}

export interface PersistenceOptions {
  ownerId?: string;
}

export class UserDataImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserDataImportError';
  }
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  hasSeenDisclaimer: false,
  hasCompletedOnboarding: false,
userMode: 'beginner',
biometricLock: false,
darkMode: true,
theme: 'graphite-dark',
cloudSyncEnabled: false,
};

const HISTORICAL_DEMO_VIALS = [
  { id: 'vial-1', peptideId: 'bpc-157', lotNumber: 'BPC-2024-001' },
  { id: 'vial-2', peptideId: 'tb-500', lotNumber: 'TB5-2024-042' },
  { id: 'vial-3', peptideId: 'ipamorelin', lotNumber: 'IPA-2024-103' },
  { id: 'vial-4', peptideId: 'cjc-1295', lotNumber: 'CJC-2024-088' },
  { id: 'vial-5', peptideId: 'ghk-cu', lotNumber: 'GHK-2024-015' },
  { id: 'vial-6', peptideId: 'epitalon', lotNumber: 'EPI-2024-007' },
  { id: 'vial-7', peptideId: 'hgh', lotNumber: 'HGH-2024-010' },
];

const HISTORICAL_DEMO_STACK_NAMES = new Map([
  ['stack-1', 'Healing Protocol'],
  ['stack-2', 'Longevity + GH Protocol'],
  ['stack-3', 'Metabolic Reset'],
]);

const HISTORICAL_DEMO_DOSE_ID_PATTERNS = [
  /^dose-bpc-(?:am|pm)-\d+$/,
  /^dose-tb500-\d+$/,
  /^dose-ipa-\d+$/,
  /^dose-cjc-\d+$/,
  /^dose-today-(?:bpc-am|bpc-pm|ipa)$/,
];

function getDefaultSettings(defaults: AppData): AppSettings {
  return {
    hasSeenDisclaimer: defaults.hasSeenDisclaimer,
    hasCompletedOnboarding: defaults.hasCompletedOnboarding,
    userMode: defaults.userMode,
    biometricLock: defaults.biometricLock,
darkMode: defaults.darkMode,
theme: defaults.theme,
cloudSyncEnabled: defaults.cloudSyncEnabled ?? false,
};
}

function normalizeSettings(settings: Partial<AppSettings> | undefined, defaults: AppSettings): AppSettings {
  return {
    hasSeenDisclaimer: settings?.hasSeenDisclaimer ?? defaults.hasSeenDisclaimer,
    hasCompletedOnboarding: settings?.hasCompletedOnboarding ?? defaults.hasCompletedOnboarding,
    userMode: settings?.userMode ?? defaults.userMode,
biometricLock: settings?.biometricLock ?? defaults.biometricLock,
darkMode: settings?.darkMode ?? defaults.darkMode,
theme: settings?.theme ?? (settings?.darkMode ?? defaults.darkMode ? 'graphite-dark' : 'clinical-light'),
cloudSyncEnabled: settings?.cloudSyncEnabled ?? defaults.cloudSyncEnabled,
};
}

function applyUserData(defaults: AppData, persisted: PersistedUserData): AppData {
  const settings = normalizeSettings(persisted.settings, getDefaultSettings(defaults));
  return ensureInventoryBatches({
    ...defaults,
    vials: persisted.vials,
    inventoryBatches: persisted.inventoryBatches,
    doses: persisted.doses,
    stacks: normalizeStacks(persisted.stacks),
    schedules: persisted.schedules,
    scheduleLogs: persisted.scheduleLogs,
    reconstitutionCalculations: persisted.reconstitutionCalculations,
    signalCheckIns: persisted.signalCheckIns,
    labReports: persisted.labReports,
    labResults: persisted.labResults,
    labImportAudits: persisted.labImportAudits,
    compounds: mergeCompoundLibrary(persisted.userCompounds),
    ...settings,
  });
}

function pruneHistoricalDemoUserData(persisted: PersistedUserData): { data: PersistedUserData; changed: boolean } {
  const demoVialIds = new Set(persisted.vials.filter((vial) => HISTORICAL_DEMO_VIALS.some((demo) => (
    vial.id === demo.id && vial.peptideId === demo.peptideId && vial.lotNumber === demo.lotNumber
  ))).map((vial) => vial.id));
  const demoStackIds = new Set(persisted.stacks.filter((stack) => HISTORICAL_DEMO_STACK_NAMES.get(stack.id) === stack.name).map((stack) => stack.id));
  const vials = persisted.vials.filter((vial) => !demoVialIds.has(vial.id));
  const remainingBatchIds = new Set(vials.map((vial) => vial.inventoryBatchId).filter(Boolean));
  const inventoryBatches = persisted.inventoryBatches.filter((batch) => remainingBatchIds.has(batch.id));
  const doses = persisted.doses.filter((dose) => !demoVialIds.has(dose.vialId) && !HISTORICAL_DEMO_DOSE_ID_PATTERNS.some((pattern) => pattern.test(dose.id)));
  const stacks = persisted.stacks.filter((stack) => !demoStackIds.has(stack.id));
  const schedules = persisted.schedules.filter((schedule) => !demoStackIds.has(schedule.stackId));
  const scheduleIds = new Set(schedules.map((schedule) => schedule.id));
  const scheduleLogs = persisted.scheduleLogs.filter((log) => scheduleIds.has(log.scheduleId) && !demoStackIds.has(log.stackId));
  const changed = vials.length !== persisted.vials.length
    || doses.length !== persisted.doses.length
    || stacks.length !== persisted.stacks.length
    || schedules.length !== persisted.schedules.length
    || scheduleLogs.length !== persisted.scheduleLogs.length;
  return {
    data: { ...persisted, vials, inventoryBatches, doses, stacks, schedules, scheduleLogs },
    changed,
  };
}

function stripPersistenceMetadata<T extends { createdAt?: string; updatedAt?: string; deletedAt?: string | null; syncState?: string }>(
  value: T,
): Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncState'> {
  const { createdAt: _createdAt, updatedAt: _updatedAt, deletedAt: _deletedAt, syncState: _syncState, ...rest } = value;
  return rest;
}

function isSyncState(value: unknown): value is SyncState {
  return value === 'local' || value === 'synced' || value === 'dirty';
}

function withPersistenceMetadata<T extends { id: string }>(value: T, now: string) {
  const persistedValue = value as T & { createdAt?: string; deletedAt?: string | null; syncState?: string };
  const syncState: SyncState = isSyncState(persistedValue.syncState) ? persistedValue.syncState : 'dirty';
  return {
    ...value,
    createdAt: persistedValue.createdAt ?? now,
    updatedAt: now,
    deletedAt: persistedValue.deletedAt ?? null,
    syncState,
  };
}

function stripPersistenceMetadataKeepDeletedAt<T extends { createdAt?: string; updatedAt?: string; deletedAt?: string | null; syncState?: string }>(
  value: T,
): Omit<T, 'createdAt' | 'updatedAt' | 'syncState'> {
  const { createdAt: _createdAt, updatedAt: _updatedAt, syncState: _syncState, ...rest } = value;
  return rest;
}

async function hasValidSchemaMetadata(database: PeptideOSDatabase) {
  const schemaVersion = await database.metadata.get('schemaVersion');
  return typeof schemaVersion?.value === 'number'
    && schemaVersion.value >= 1
    && schemaVersion.value <= PERSISTENCE_SCHEMA_VERSION;
}

async function isPersisted(database: PeptideOSDatabase) {
  const persisted = await database.metadata.get('persisted');
  return persisted?.value === true;
}

function getPersistenceOwner(options?: PersistenceOptions) {
  return options?.ownerId?.trim() || LOCAL_PERSISTENCE_OWNER_ID;
}

async function ensureMetadata(database: PeptideOSDatabase, now: string, options?: PersistenceOptions) {
  let deviceId = await database.metadata.get('deviceId');
  if (!deviceId) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `device-${Date.now()}`;
    deviceId = { key: 'deviceId', value: id };
  }
  await database.metadata.bulkPut([
    { key: 'schemaVersion', value: PERSISTENCE_SCHEMA_VERSION },
    { key: 'persisted', value: true },
    { key: 'ownerId', value: getPersistenceOwner(options) },
    { key: 'lastSavedAt', value: now },
    deviceId,
  ]);
}

export async function loadPersistedAppData(
  database: PeptideOSDatabase = defaultDb,
  defaults: AppData,
  options?: PersistenceOptions,
): Promise<AppData> {
  if (!(await hasValidSchemaMetadata(database)) || !(await isPersisted(database))) return defaults;

  const [
    vials,
    inventoryBatches,
    doses,
    stacks,
    schedules,
    scheduleLogs,
    reconstitutionCalculations,
    signalCheckIns,
    labReports,
    labResults,
    labImportAudits,
    userCompounds,
    settings,
  ] = await Promise.all([
    database.vials.toArray(),
    database.inventoryBatches.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
    database.reconstitutionCalculations.toArray(),
    database.signalCheckIns.toArray(),
    database.labReports.toArray(),
    database.labResults.toArray(),
    database.labImportAudits.toArray(),
    database.userCompounds.toArray(),
    database.settings.get('app-settings'),
  ]);

  if (!settings) return defaults;

  const persistedUserData: PersistedUserData = {
    vials: vials.map(stripPersistenceMetadataKeepDeletedAt) as Vial[],
    inventoryBatches: inventoryBatches.map(stripPersistenceMetadataKeepDeletedAt) as InventoryBatch[],
    doses: doses.map(stripPersistenceMetadataKeepDeletedAt) as Dose[],
    stacks: stacks.map(stripPersistenceMetadataKeepDeletedAt) as Stack[],
    schedules: schedules.map(stripPersistenceMetadataKeepDeletedAt) as Schedule[],
    scheduleLogs: scheduleLogs.map(stripPersistenceMetadataKeepDeletedAt) as ScheduleLog[],
    reconstitutionCalculations: reconstitutionCalculations.map(stripPersistenceMetadataKeepDeletedAt) as ReconstitutionCalculation[],
    signalCheckIns: signalCheckIns.map(stripPersistenceMetadataKeepDeletedAt) as SignalCheckIn[],
    labReports: labReports.map(stripPersistenceMetadataKeepDeletedAt) as LabReport[],
    labResults: labResults.map(stripPersistenceMetadataKeepDeletedAt) as LabResult[],
    labImportAudits: labImportAudits.map(stripPersistenceMetadataKeepDeletedAt) as LabImportAudit[],
    userCompounds: userCompounds.filter((compound) => !compound.deletedAt) as unknown as Compound[],
    settings: stripPersistenceMetadata(settings) as AppSettings,
  };

  const pruned = pruneHistoricalDemoUserData(persistedUserData);
  const loaded = applyUserData(defaults, pruned.data);
  if (pruned.changed) {
    await savePersistedAppData(database, loaded, new Date(), options);
  }
  return loaded;
}

export async function savePersistedAppData(
  database: PeptideOSDatabase = defaultDb,
  data: AppData,
  savedAt = new Date(),
  options?: PersistenceOptions,
) {
  const now = savedAt.toISOString();
  const normalizedData = ensureInventoryBatches(data);
  const settings = withPersistenceMetadata({ id: 'app-settings' as const, ...getDefaultSettings(normalizedData) }, now);
  const vials = normalizedData.vials.map((vial) => withPersistenceMetadata(vial, now) as PersistedVial);
  const inventoryBatches = normalizedData.inventoryBatches.map((batch) => withPersistenceMetadata(batch, now) as PersistedInventoryBatch);
  const doses = normalizedData.doses.map((dose) => withPersistenceMetadata(dose, now) as PersistedDose);
  const stacks = normalizeStacks(normalizedData.stacks).map((stack) => withPersistenceMetadata(stack, now) as PersistedStack);
  const schedules = normalizedData.schedules.map((schedule) => withPersistenceMetadata(schedule, now) as PersistedSchedule);
  const scheduleLogs = normalizedData.scheduleLogs.map((log) => withPersistenceMetadata(log, now) as PersistedScheduleLog);
  const reconstitutionCalculations = normalizedData.reconstitutionCalculations.map((calculation) => withPersistenceMetadata(calculation, now) as PersistedReconstitutionCalculation);
  const signalCheckIns = normalizedData.signalCheckIns.map((checkIn) => withPersistenceMetadata(checkIn, now) as PersistedSignalCheckIn);
  const labReports = normalizedData.labReports.map((report) => withPersistenceMetadata(report, now) as PersistedLabReport);
  const labResults = normalizedData.labResults.map((result) => withPersistenceMetadata(result, now) as PersistedLabResult);
  const labImportAudits = normalizedData.labImportAudits.map((audit) => withPersistenceMetadata(audit, now) as PersistedLabImportAudit);
  const userCompounds = getPersistableUserCompounds(normalizedData.compounds).map((compound) => withPersistenceMetadata({
    ...compound,
    source: 'user' as const,
  }, now) as PersistedUserCompound);

  await database.transaction('rw', [
    database.vials,
    database.inventoryBatches,
    database.doses,
    database.stacks,
    database.schedules,
    database.scheduleLogs,
    database.reconstitutionCalculations,
    database.signalCheckIns,
    database.labReports,
    database.labResults,
    database.labImportAudits,
    database.userCompounds,
    database.settings,
    database.metadata,
  ], async () => {
    await Promise.all([
      database.vials.clear(),
      database.inventoryBatches.clear(),
      database.doses.clear(),
      database.stacks.clear(),
      database.schedules.clear(),
      database.scheduleLogs.clear(),
      database.reconstitutionCalculations.clear(),
      database.signalCheckIns.clear(),
      database.labReports.clear(),
      database.labResults.clear(),
      database.labImportAudits.clear(),
      database.userCompounds.clear(),
      database.settings.clear(),
    ]);
    await Promise.all([
      database.vials.bulkPut(vials),
      database.inventoryBatches.bulkPut(inventoryBatches),
      database.doses.bulkPut(doses),
      database.stacks.bulkPut(stacks),
      database.schedules.bulkPut(schedules),
      database.scheduleLogs.bulkPut(scheduleLogs),
      database.reconstitutionCalculations.bulkPut(reconstitutionCalculations),
      database.signalCheckIns.bulkPut(signalCheckIns),
      database.labReports.bulkPut(labReports),
      database.labResults.bulkPut(labResults),
      database.labImportAudits.bulkPut(labImportAudits),
      database.userCompounds.bulkPut(userCompounds),
      database.settings.put(settings),
      ensureMetadata(database, now, options),
    ]);
  });
}

export async function resetPersistedAppData(database: PeptideOSDatabase = defaultDb, defaults: AppData): Promise<AppData> {
  await database.transaction('rw', [
    database.vials,
    database.inventoryBatches,
    database.doses,
    database.stacks,
    database.schedules,
    database.scheduleLogs,
    database.reconstitutionCalculations,
    database.signalCheckIns,
    database.labReports,
    database.labResults,
    database.labImportAudits,
    database.userCompounds,
    database.settings,
    database.metadata,
  ], async () => {
    await Promise.all([
      database.vials.clear(),
      database.inventoryBatches.clear(),
      database.doses.clear(),
      database.stacks.clear(),
      database.schedules.clear(),
      database.scheduleLogs.clear(),
      database.reconstitutionCalculations.clear(),
      database.signalCheckIns.clear(),
      database.labReports.clear(),
      database.labResults.clear(),
      database.labImportAudits.clear(),
      database.userCompounds.clear(),
      database.settings.clear(),
      database.metadata.clear(),
    ]);
  });
  return defaults;
}

export async function exportUserData(database: PeptideOSDatabase = defaultDb, exportedAt = new Date()): Promise<UserDataExport> {
  const fallbackSettings = DEFAULT_APP_SETTINGS;
  const [
    vials,
    inventoryBatches,
    doses,
    stacks,
    schedules,
    scheduleLogs,
    reconstitutionCalculations,
    signalCheckIns,
    labReports,
    labResults,
    labImportAudits,
    userCompounds,
    settings,
  ] = await Promise.all([
    database.vials.toArray(),
    database.inventoryBatches.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
    database.reconstitutionCalculations.toArray(),
    database.signalCheckIns.toArray(),
    database.labReports.toArray(),
    database.labResults.toArray(),
    database.labImportAudits.toArray(),
    database.userCompounds.toArray(),
    database.settings.get('app-settings'),
  ]);

  return {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      vials: active(vials) as Vial[],
      inventoryBatches: active(inventoryBatches) as InventoryBatch[],
      doses: active(doses) as Dose[],
      stacks: active(stacks) as Stack[],
      schedules: active(schedules) as Schedule[],
      scheduleLogs: active(scheduleLogs) as ScheduleLog[],
      reconstitutionCalculations: active(reconstitutionCalculations) as ReconstitutionCalculation[],
      signalCheckIns: active(signalCheckIns) as SignalCheckIn[],
      labReports: active(labReports) as LabReport[],
      labResults: active(labResults) as LabResult[],
      labImportAudits: active(labImportAudits) as LabImportAudit[],
      userCompounds: active(userCompounds) as Compound[],
      settings: normalizeSettings(settings ? stripPersistenceMetadata(settings) as AppSettings : undefined, fallbackSettings),
    },
  };
}

export async function exportUserDataForCloudSync(database: PeptideOSDatabase = defaultDb): Promise<PersistedUserData> {
  const fallbackSettings = DEFAULT_APP_SETTINGS;
  const [
    vials,
    inventoryBatches,
    doses,
    stacks,
    schedules,
    scheduleLogs,
    reconstitutionCalculations,
    signalCheckIns,
    labReports,
    labResults,
    labImportAudits,
    userCompounds,
    settings,
  ] = await Promise.all([
    database.vials.toArray(),
    database.inventoryBatches.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
    database.reconstitutionCalculations.toArray(),
    database.signalCheckIns.toArray(),
    database.labReports.toArray(),
    database.labResults.toArray(),
    database.labImportAudits.toArray(),
    database.userCompounds.toArray(),
    database.settings.get('app-settings'),
  ]);

  return {
    vials: vials.map(stripPersistenceMetadataKeepDeletedAt) as Vial[],
    inventoryBatches: inventoryBatches.map(stripPersistenceMetadataKeepDeletedAt) as InventoryBatch[],
    doses: doses.map(stripPersistenceMetadataKeepDeletedAt) as Dose[],
    stacks: stacks.map(stripPersistenceMetadataKeepDeletedAt) as Stack[],
    schedules: schedules.map(stripPersistenceMetadataKeepDeletedAt) as Schedule[],
    scheduleLogs: scheduleLogs.map(stripPersistenceMetadataKeepDeletedAt) as ScheduleLog[],
    reconstitutionCalculations: reconstitutionCalculations.map(stripPersistenceMetadataKeepDeletedAt) as ReconstitutionCalculation[],
    signalCheckIns: signalCheckIns.map(stripPersistenceMetadataKeepDeletedAt) as SignalCheckIn[],
    labReports: labReports.map(stripPersistenceMetadataKeepDeletedAt) as LabReport[],
    labResults: labResults.map(stripPersistenceMetadataKeepDeletedAt) as LabResult[],
    labImportAudits: labImportAudits.map(stripPersistenceMetadataKeepDeletedAt) as LabImportAudit[],
    userCompounds: userCompounds.map(stripPersistenceMetadataKeepDeletedAt) as Compound[],
    settings: normalizeSettings(settings ? stripPersistenceMetadata(settings) : fallbackSettings, fallbackSettings),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertArray(value: unknown, label: string) {
  if (!Array.isArray(value)) throw new UserDataImportError(`Import missing ${label}.`);
}

function parseUserDataExport(input: string): UserDataExport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new UserDataImportError('Select a valid PeptideOS export JSON file.');
  }
  if (!isRecord(parsed) || !isRecord(parsed.data)) {
    throw new UserDataImportError('Select a valid PeptideOS export JSON file.');
  }
  if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion < 1 || parsed.schemaVersion > PERSISTENCE_SCHEMA_VERSION) {
    throw new UserDataImportError('This PeptideOS export uses an unsupported schema version.');
  }

  const data = parsed.data;
  assertArray(data.vials, 'vials');
  assertArray(data.doses, 'doses');
  assertArray(data.stacks, 'stacks');
  assertArray(data.schedules, 'schedules');
  assertArray(data.scheduleLogs, 'scheduleLogs');
  optionalArray(data, 'inventoryBatches');
  optionalArray(data, 'reconstitutionCalculations');
  optionalArray(data, 'signalCheckIns');
  optionalArray(data, 'labReports');
  optionalArray(data, 'labResults');
  optionalArray(data, 'labImportAudits');
  optionalArray(data, 'userCompounds');
  if (!isRecord(data.settings)) throw new UserDataImportError('Import missing settings.');

  return {
    schemaVersion: parsed.schemaVersion,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    data: {
      vials: data.vials as Vial[],
      inventoryBatches: Array.isArray(data.inventoryBatches) ? data.inventoryBatches as InventoryBatch[] : [],
      doses: data.doses as Dose[],
      stacks: data.stacks as Stack[],
      schedules: data.schedules as Schedule[],
      scheduleLogs: data.scheduleLogs as ScheduleLog[],
      reconstitutionCalculations: Array.isArray(data.reconstitutionCalculations) ? data.reconstitutionCalculations as ReconstitutionCalculation[] : [],
      signalCheckIns: Array.isArray(data.signalCheckIns) ? data.signalCheckIns as SignalCheckIn[] : [],
      labReports: Array.isArray(data.labReports) ? data.labReports as LabReport[] : [],
      labResults: Array.isArray(data.labResults) ? data.labResults as LabResult[] : [],
      labImportAudits: Array.isArray(data.labImportAudits) ? data.labImportAudits as LabImportAudit[] : [],
      userCompounds: Array.isArray(data.userCompounds) ? data.userCompounds as Compound[] : [],
      settings: normalizeSettings(data.settings as Partial<AppSettings> | undefined, DEFAULT_APP_SETTINGS),
    },
  };
}

export function validateUserDataExport(input: string): UserDataImportPreview {
  const parsed = parseUserDataExport(input);
  return {
    schemaVersion: parsed.schemaVersion,
    exportedAt: parsed.exportedAt,
    counts: {
      vials: parsed.data.vials.length,
      inventoryBatches: parsed.data.inventoryBatches.length,
      doses: parsed.data.doses.length,
      stacks: parsed.data.stacks.length,
      schedules: parsed.data.schedules.length,
      scheduleLogs: parsed.data.scheduleLogs.length,
      reconstitutionCalculations: parsed.data.reconstitutionCalculations.length,
      signalCheckIns: parsed.data.signalCheckIns.length,
      labReports: parsed.data.labReports.length,
      labResults: parsed.data.labResults.length,
      labImportAudits: parsed.data.labImportAudits.length,
      userCompounds: parsed.data.userCompounds.length,
    },
  };
}

export async function importUserData(
  database: PeptideOSDatabase = defaultDb,
  defaults: AppData,
  input: string,
  importedAt = new Date(),
  options?: PersistenceOptions,
): Promise<AppData> {
  const imported = parseUserDataExport(input);
  const nextData = applyUserData(defaults, imported.data);
  await savePersistedAppData(database, nextData, importedAt, options);
  return nextData;
}

export async function restorePersistedUserData(
  database: PeptideOSDatabase = defaultDb,
  defaults: AppData,
  persisted: PersistedUserData,
  restoredAt = new Date(),
  options?: PersistenceOptions,
): Promise<AppData> {
  const nextData = applyUserData(defaults, persisted);
  await savePersistedAppData(database, nextData, restoredAt, options);
  return nextData;
}

export function downloadUserData(exported: UserDataExport) {
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `peptideos-export-${exported.exportedAt.slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function active<T extends { deletedAt?: string | null }>(records: T[]) {
  return records.filter((record) => !record.deletedAt).map((record) => stripPersistenceMetadata(record));
}

function optionalArray(data: Record<string, unknown>, key: string) {
  if (key in data && data[key] !== undefined) assertArray(data[key], key);
}
