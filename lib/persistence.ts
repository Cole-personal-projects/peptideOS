import { db as defaultDb, PERSISTENCE_SCHEMA_VERSION, type PeptideOSDatabase, type PersistedDose, type PersistedSchedule, type PersistedScheduleLog, type PersistedStack, type PersistedVial } from './db';
import { normalizeStacks } from './schedules';
import type { AppData, AppSettings, Dose, Schedule, ScheduleLog, Stack, Vial } from './types';

export interface PersistedUserData {
  vials: Vial[];
  doses: Dose[];
  stacks: Stack[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  settings: AppSettings;
}

export interface UserDataExport {
  schemaVersion: number;
  exportedAt: string;
  data: PersistedUserData;
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
    ...persisted.settings,
  };
}

function stripPersistenceMetadata<T extends { createdAt?: string; updatedAt?: string; deletedAt?: string | null; syncState?: string }>(
  value: T,
): Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncState'> {
  const { createdAt: _createdAt, updatedAt: _updatedAt, deletedAt: _deletedAt, syncState: _syncState, ...rest } = value;
  return rest;
}

function withPersistenceMetadata<T extends { id: string }>(value: T, now: string) {
  return {
    ...value,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncState: 'dirty' as const,
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

  const [vials, doses, stacks, schedules, scheduleLogs, settings] = await Promise.all([
    database.vials.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
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

  await database.transaction('rw', [database.vials, database.doses, database.stacks, database.schedules, database.scheduleLogs, database.settings, database.metadata], async () => {
    await Promise.all([
      database.vials.clear(),
      database.doses.clear(),
      database.stacks.clear(),
      database.schedules.clear(),
      database.scheduleLogs.clear(),
      database.settings.clear(),
    ]);

    await Promise.all([
      database.vials.bulkPut(vials),
      database.doses.bulkPut(doses),
      database.stacks.bulkPut(stacks),
      database.schedules.bulkPut(schedules),
      database.scheduleLogs.bulkPut(scheduleLogs),
      database.settings.put(settings),
      ensureMetadata(database, now),
    ]);
  });
}

export async function resetPersistedAppData(database: PeptideOSDatabase = defaultDb, defaults: AppData): Promise<AppData> {
  await database.transaction('rw', [database.vials, database.doses, database.stacks, database.schedules, database.scheduleLogs, database.settings, database.metadata], async () => {
    await Promise.all([
      database.vials.clear(),
      database.doses.clear(),
      database.stacks.clear(),
      database.schedules.clear(),
      database.scheduleLogs.clear(),
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
  const [vials, doses, stacks, schedules, scheduleLogs, settings] = await Promise.all([
    database.vials.toArray(),
    database.doses.toArray(),
    database.stacks.toArray(),
    database.schedules.toArray(),
    database.scheduleLogs.toArray(),
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
      settings: settings ? stripPersistenceMetadata(settings) as AppSettings : fallbackSettings,
    },
  };
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
