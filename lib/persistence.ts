import { db as defaultDb, PERSISTENCE_SCHEMA_VERSION, type PeptideOSDatabase, type PersistedDose, type PersistedReconstitutionCalculation, type PersistedSchedule, type PersistedScheduleLog, type PersistedStack, type PersistedUserCompound, type PersistedVial, type SyncState } from './db';
import { normalizeStacks } from './schedules';
import { getPersistableUserCompounds, mergeCompoundLibrary } from './user-compounds';
import type { AppData, AppSettings, Compound, Dose, ReconstitutionCalculation, Schedule, ScheduleLog, Stack, Vial } from './types';

export interface PersistedUserData {
  vials: Vial[];
  doses: Dose[];
  stacks: Stack[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  reconstitutionCalculations: ReconstitutionCalculation[];
  userCompounds: Compound[];
  settings: AppSettings;
}

export interface UserDataExport {
  schemaVersion: number;
  exportedAt: string;
  data: PersistedUserData;
}

export class UserDataImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserDataImportError';
  }
}

function getDefaultSettings(defaults: AppData): AppSettings {
  return {
    hasSeenDisclaimer: defaults.hasSeenDisclaimer,
    hasCompletedOnboarding: defaults.hasCompletedOnboarding,
    userMode: defaults.userMode,
    biometricLock: defaults.biometricLock,
    darkMode: defaults.darkMode,
  };
}

function applyUserData(defaults: AppData, persisted: PersistedUserData): AppData {
  return {
    ...defaults,
    vials: persisted.vials,
    doses: persisted.doses,
    stacks: normalizeStacks(persisted.stacks),
    schedules: persisted.schedules,
    scheduleLogs: persisted.scheduleLogs,
    reconstitutionCalculations: persisted.reconstitutionCalculations,
    compounds: mergeCompoundLibrary(persisted.userCompounds),
    ...persisted.settings,
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

async function ensureMetadata(database: PeptideOSDatabase, now: string) {
  let deviceId = await database.metadata.get('deviceId');

  if (!deviceId) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}`;
    deviceId = { key: 'deviceId', value: id };
  }

  await database.metadata.bulkPut([
    { key: 'schemaVersion', value: PERSISTENCE_SCHEMA_VERSION },
    { key: 'persisted', value: true },
    { key: 'lastSavedAt', value: now },
    deviceId,
  ]);
}

export async function loadPersistedAppData(database: PeptideOSDatabase = defaultDb, defaults: AppData): Promise<AppData> {
  if (!(await hasValidSchemaMetadata(database)) || !(await isPersisted(database))) {
    return defaults;
  }

  const [vials, doses, stacks, schedules, scheduleLogs, reconstitutionCalculations, userCompounds, settings] = await Promise.all([
    database.vials.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
    database.reconstitutionCalculations.toArray(),
    database.userCompounds.toArray(),
    database.settings.get('app-settings'),
  ]);

  if (!settings) {
    return defaults;
  }

  return applyUserData(defaults, {
    vials: vials.filter((vial) => !vial.deletedAt).map((vial) => stripPersistenceMetadata(vial) as Vial),
    doses: doses.filter((dose) => !dose.deletedAt).map((dose) => stripPersistenceMetadata(dose) as Dose),
    stacks: stacks.filter((stack) => !stack.deletedAt).map((stack) => stripPersistenceMetadata(stack) as Stack),
    schedules: schedules.filter((schedule) => !schedule.deletedAt).map((schedule) => stripPersistenceMetadata(schedule) as Schedule),
    scheduleLogs: scheduleLogs.filter((log) => !log.deletedAt).map((log) => stripPersistenceMetadata(log) as ScheduleLog),
    reconstitutionCalculations: reconstitutionCalculations
      .filter((calculation) => !calculation.deletedAt)
      .map((calculation) => stripPersistenceMetadata(calculation) as ReconstitutionCalculation),
    userCompounds: userCompounds as Compound[],
    settings: stripPersistenceMetadata(settings) as AppSettings,
  });
}

export async function savePersistedAppData(database: PeptideOSDatabase = defaultDb, data: AppData, savedAt = new Date()) {
  const now = savedAt.toISOString();
  const settings = withPersistenceMetadata({ id: 'app-settings' as const, ...getDefaultSettings(data) }, now);
  const vials = data.vials.map((vial) => withPersistenceMetadata(vial, now) as PersistedVial);
  const doses = data.doses.map((dose) => withPersistenceMetadata(dose, now) as PersistedDose);
  const stacks = normalizeStacks(data.stacks).map((stack) => withPersistenceMetadata(stack, now) as PersistedStack);
  const schedules = data.schedules.map((schedule) => withPersistenceMetadata(schedule, now) as PersistedSchedule);
  const scheduleLogs = data.scheduleLogs.map((log) => withPersistenceMetadata(log, now) as PersistedScheduleLog);
  const reconstitutionCalculations = data.reconstitutionCalculations.map((calculation) => withPersistenceMetadata(calculation, now) as PersistedReconstitutionCalculation);
  const userCompounds = getPersistableUserCompounds(data.compounds).map((compound) => withPersistenceMetadata({
    ...compound,
    source: 'user' as const,
  }, now) as PersistedUserCompound);

  await database.transaction('rw', [database.vials, database.doses, database.stacks, database.schedules, database.scheduleLogs, database.reconstitutionCalculations, database.userCompounds, database.settings, database.metadata], async () => {
    await Promise.all([
      database.vials.clear(),
      database.doses.clear(),
      database.stacks.clear(),
      database.schedules.clear(),
      database.scheduleLogs.clear(),
      database.reconstitutionCalculations.clear(),
      database.userCompounds.clear(),
      database.settings.clear(),
    ]);

    await Promise.all([
      database.vials.bulkPut(vials),
      database.doses.bulkPut(doses),
      database.stacks.bulkPut(stacks),
      database.schedules.bulkPut(schedules),
      database.scheduleLogs.bulkPut(scheduleLogs),
      database.reconstitutionCalculations.bulkPut(reconstitutionCalculations),
      database.userCompounds.bulkPut(userCompounds),
      database.settings.put(settings),
      ensureMetadata(database, now),
    ]);
  });
}

export async function resetPersistedAppData(database: PeptideOSDatabase = defaultDb, defaults: AppData): Promise<AppData> {
  await database.transaction('rw', [database.vials, database.doses, database.stacks, database.schedules, database.scheduleLogs, database.reconstitutionCalculations, database.userCompounds, database.settings, database.metadata], async () => {
    await Promise.all([
      database.vials.clear(),
      database.doses.clear(),
      database.stacks.clear(),
      database.schedules.clear(),
      database.scheduleLogs.clear(),
      database.reconstitutionCalculations.clear(),
      database.userCompounds.clear(),
      database.settings.clear(),
      database.metadata.clear(),
    ]);
  });

  return defaults;
}

export async function exportUserData(database: PeptideOSDatabase = defaultDb, exportedAt = new Date()): Promise<UserDataExport> {
  const fallbackSettings: AppSettings = {
    hasSeenDisclaimer: false,
    hasCompletedOnboarding: false,
    userMode: 'beginner',
    biometricLock: false,
    darkMode: true,
  };
  const [vials, doses, stacks, schedules, scheduleLogs, reconstitutionCalculations, userCompounds, settings] = await Promise.all([
    database.vials.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
    database.reconstitutionCalculations.toArray(),
    database.userCompounds.toArray(),
    database.settings.get('app-settings'),
  ]);

  return {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      vials: vials.filter((vial) => !vial.deletedAt).map((vial) => stripPersistenceMetadata(vial) as Vial),
      doses: doses.filter((dose) => !dose.deletedAt).map((dose) => stripPersistenceMetadata(dose) as Dose),
      stacks: stacks.filter((stack) => !stack.deletedAt).map((stack) => stripPersistenceMetadata(stack) as Stack),
      schedules: schedules.filter((schedule) => !schedule.deletedAt).map((schedule) => stripPersistenceMetadata(schedule) as Schedule),
      scheduleLogs: scheduleLogs.filter((log) => !log.deletedAt).map((log) => stripPersistenceMetadata(log) as ScheduleLog),
      reconstitutionCalculations: reconstitutionCalculations
        .filter((calculation) => !calculation.deletedAt)
        .map((calculation) => stripPersistenceMetadata(calculation) as ReconstitutionCalculation),
      userCompounds: userCompounds.filter((compound) => !compound.deletedAt) as Compound[],
      settings: settings ? stripPersistenceMetadata(settings) as AppSettings : fallbackSettings,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new UserDataImportError(`Import is missing ${label}.`);
  }
}

function parseUserDataExport(input: string): UserDataExport {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input) as unknown;
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
  if ('reconstitutionCalculations' in data && data.reconstitutionCalculations !== undefined) {
    assertArray(data.reconstitutionCalculations, 'reconstitutionCalculations');
  }
  if ('userCompounds' in data && data.userCompounds !== undefined) {
    assertArray(data.userCompounds, 'userCompounds');
  }

  if (!isRecord(data.settings)) {
    throw new UserDataImportError('Import is missing settings.');
  }

  return {
    schemaVersion: parsed.schemaVersion,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    data: {
      vials: data.vials as Vial[],
      doses: data.doses as Dose[],
      stacks: data.stacks as Stack[],
      schedules: data.schedules as Schedule[],
      scheduleLogs: data.scheduleLogs as ScheduleLog[],
      reconstitutionCalculations: 'reconstitutionCalculations' in data && Array.isArray(data.reconstitutionCalculations)
        ? data.reconstitutionCalculations as ReconstitutionCalculation[]
        : [],
      userCompounds: 'userCompounds' in data && Array.isArray(data.userCompounds)
        ? data.userCompounds as Compound[]
        : [],
      settings: data.settings as unknown as AppSettings,
    },
  };
}

export async function importUserData(
  database: PeptideOSDatabase = defaultDb,
  defaults: AppData,
  input: string,
  importedAt = new Date(),
): Promise<AppData> {
  const imported = parseUserDataExport(input);
  const nextData = applyUserData(defaults, imported.data);

  await savePersistedAppData(database, nextData, importedAt);

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
