import { PERSISTENCE_SCHEMA_VERSION } from './db';
import type { PersistedUserData } from './persistence';
import type { AppSettings, Compound, Dose, InventoryBatch, ReconstitutionCalculation, Schedule, ScheduleLog, SignalCheckIn, Stack, Vial } from './types';

export type SupabaseSyncCollection =
  | 'vials'
  | 'inventory_batches'
  | 'doses'
  | 'stacks'
  | 'schedules'
  | 'schedule_logs'
  | 'reconstitution_calculations'
  | 'signal_check_ins'
  | 'user_compounds'
  | 'settings';

export interface SupabaseSyncRow {
  user_id: string;
  collection: SupabaseSyncCollection;
  record_id: string;
  payload: Record<string, unknown>;
  updated_at: string;
  deleted_at: string | null;
  schema_version: number;
}

export interface BuildSupabaseSyncRowsInput {
  userId: string;
  data: PersistedUserData;
  syncedAt?: Date;
}

export interface SupabaseUserDataSyncAdapter {
  pushUserData: (input: BuildSupabaseSyncRowsInput) => Promise<{ pushedRows: number }>;
}

interface SupabaseSyncTableClient {
  upsert: (
    rows: SupabaseSyncRow[],
    options: { onConflict: 'user_id,collection,record_id' },
  ) => Promise<{ error: { message: string } | null }>;
}

interface SupabaseSyncClient {
  from: (table: 'app_user_sync_records') => SupabaseSyncTableClient;
}

type SyncRecord = { id: string; deletedAt?: string | null };

const defaultSettings: AppSettings = {
  hasSeenDisclaimer: false,
  hasCompletedOnboarding: false,
  userMode: 'beginner',
  biometricLock: false,
  darkMode: true,
};

const collectionOrder: SupabaseSyncCollection[] = [
  'settings',
  'vials',
  'inventory_batches',
  'doses',
  'stacks',
  'schedules',
  'schedule_logs',
  'reconstitution_calculations',
  'signal_check_ins',
  'user_compounds',
];

function toRow(
  userId: string,
  collection: SupabaseSyncCollection,
  recordId: string,
  payload: Record<string, unknown>,
  updatedAt: string,
): SupabaseSyncRow {
  const deletedAt = typeof payload.deletedAt === 'string' ? payload.deletedAt : null;

  return {
    user_id: userId,
    collection,
    record_id: recordId,
    payload,
    updated_at: updatedAt,
    deleted_at: deletedAt,
    schema_version: PERSISTENCE_SCHEMA_VERSION,
  };
}

function appendCollectionRows(
  rows: SupabaseSyncRow[],
  userId: string,
  collection: SupabaseSyncCollection,
  records: SyncRecord[],
  updatedAt: string,
) {
  records
    .filter((record) => record.id.trim())
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((record) => {
      rows.push(toRow(userId, collection, record.id, record as Record<string, unknown>, updatedAt));
    });
}

export function buildSupabaseSyncRows(input: BuildSupabaseSyncRowsInput): SupabaseSyncRow[] {
  const userId = input.userId.trim();
  if (!userId) {
    throw new Error('Supabase sync requires a signed-in user id.');
  }

  const updatedAt = (input.syncedAt ?? new Date()).toISOString();
  const rows: SupabaseSyncRow[] = [
    toRow(userId, 'settings', 'app-settings', input.data.settings as unknown as Record<string, unknown>, updatedAt),
  ];

  appendCollectionRows(rows, userId, 'vials', input.data.vials, updatedAt);
  appendCollectionRows(rows, userId, 'inventory_batches', input.data.inventoryBatches, updatedAt);
  appendCollectionRows(rows, userId, 'doses', input.data.doses, updatedAt);
  appendCollectionRows(rows, userId, 'stacks', input.data.stacks, updatedAt);
  appendCollectionRows(rows, userId, 'schedules', input.data.schedules, updatedAt);
  appendCollectionRows(rows, userId, 'schedule_logs', input.data.scheduleLogs, updatedAt);
  appendCollectionRows(rows, userId, 'reconstitution_calculations', input.data.reconstitutionCalculations, updatedAt);
  appendCollectionRows(rows, userId, 'signal_check_ins', input.data.signalCheckIns, updatedAt);
  appendCollectionRows(rows, userId, 'user_compounds', input.data.userCompounds, updatedAt);

  return rows.sort((a, b) => {
    const collectionDiff = collectionOrder.indexOf(a.collection) - collectionOrder.indexOf(b.collection);
    return collectionDiff || a.record_id.localeCompare(b.record_id);
  });
}

function activePayloads(rows: SupabaseSyncRow[], collection: SupabaseSyncCollection) {
  return rows
    .filter((row) => row.collection === collection && !row.deleted_at)
    .sort((a, b) => a.record_id.localeCompare(b.record_id))
    .map((row) => row.payload);
}

function typedPayloads<T>(rows: SupabaseSyncRow[], collection: SupabaseSyncCollection) {
  return activePayloads(rows, collection) as unknown as T[];
}

export function supabaseSyncRowsToPersistedUserData(rows: SupabaseSyncRow[]): PersistedUserData {
  const settingsRow = typedPayloads<AppSettings>(rows, 'settings')[0];

  return {
    vials: typedPayloads<Vial>(rows, 'vials'),
    inventoryBatches: typedPayloads<InventoryBatch>(rows, 'inventory_batches'),
    doses: typedPayloads<Dose>(rows, 'doses'),
    stacks: typedPayloads<Stack>(rows, 'stacks'),
    schedules: typedPayloads<Schedule>(rows, 'schedules'),
    scheduleLogs: typedPayloads<ScheduleLog>(rows, 'schedule_logs'),
    reconstitutionCalculations: typedPayloads<ReconstitutionCalculation>(rows, 'reconstitution_calculations'),
    signalCheckIns: typedPayloads<SignalCheckIn>(rows, 'signal_check_ins'),
    userCompounds: typedPayloads<Compound>(rows, 'user_compounds'),
    settings: settingsRow ?? defaultSettings,
  };
}

export function createSupabaseUserDataSyncAdapter(client: SupabaseSyncClient): SupabaseUserDataSyncAdapter {
  return {
    async pushUserData(input) {
      const rows = buildSupabaseSyncRows(input);
      const { error } = await client
        .from('app_user_sync_records')
        .upsert(rows, { onConflict: 'user_id,collection,record_id' });

      if (error) {
        throw new Error(error.message);
      }

      return { pushedRows: rows.length };
    },
  };
}
