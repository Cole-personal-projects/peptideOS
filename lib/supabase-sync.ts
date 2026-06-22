import { PERSISTENCE_SCHEMA_VERSION } from './db';
import type { PersistedUserData } from './persistence';
import type {
  AppSettings,
  Compound,
  Dose,
  InventoryBatch,
  ReconstitutionCalculation,
  Schedule,
  ScheduleLog,
  SignalCheckIn,
  Stack,
  Vial,
} from './types';

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
  pullUserData: (input: { userId: string }) => Promise<{
    data: PersistedUserData;
    pulledRows: number;
    pulledAt: string | null;
    ignoredRows: number;
  }>;
}

interface SupabaseSyncUpsertResult {
  error: { message: string } | null;
}

interface SupabaseSyncSelectResult {
  data: SupabaseSyncRow[] | null;
  error: { message: string } | null;
}

interface SupabaseSyncTableClient {
  upsert: (
    rows: SupabaseSyncRow[],
    options: { onConflict: 'user_id,collection,record_id' },
  ) => PromiseLike<SupabaseSyncUpsertResult>;
  select?: (columns: string) => {
    eq: (column: 'user_id', value: string) => {
      order: (column: 'collection' | 'record_id', options?: { ascending?: boolean }) => PromiseLike<SupabaseSyncSelectResult>;
    };
  };
}

export interface SupabaseSyncClient {
  from: (table: 'app_user_sync_records') => SupabaseSyncTableClient;
}

type SyncRecord = { id: string; deletedAt?: string | null };

const defaultSettings: AppSettings = {
  hasSeenDisclaimer: false,
  hasCompletedOnboarding: false,
  userMode: 'beginner',
  biometricLock: false,
  darkMode: true,
  cloudSyncEnabled: false,
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

function requireUserId(userId: string) {
  const trimmed = userId.trim();
  if (!trimmed) {
    throw new Error('Supabase sync requires signed-in user id.');
  }
  return trimmed;
}

function toRow(
  userId: string,
  collection: SupabaseSyncCollection,
  recordId: string,
  payload: Record<string, unknown>,
  updatedAt: string,
  deletedAt: string | null = null,
): SupabaseSyncRow {
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

function appendCollectionRows<T extends SyncRecord>(
  rows: SupabaseSyncRow[],
  userId: string,
  collection: SupabaseSyncCollection,
  records: T[],
  updatedAt: string,
) {
  records.forEach((record) => {
    rows.push(
      toRow(
        userId,
        collection,
        record.id,
        record as unknown as Record<string, unknown>,
        updatedAt,
        record.deletedAt ?? null,
      ),
    );
  });
}

export function buildSupabaseSyncRows(input: BuildSupabaseSyncRowsInput): SupabaseSyncRow[] {
  const userId = requireUserId(input.userId);
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

function latestUpdatedAt(rows: SupabaseSyncRow[]) {
  return rows.reduce<string | null>((latest, row) => {
    if (!latest) return row.updated_at;
    return new Date(row.updated_at).getTime() > new Date(latest).getTime() ? row.updated_at : latest;
  }, null);
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

    async pullUserData(input) {
      const userId = requireUserId(input.userId);
      const table = client.from('app_user_sync_records');
      if (!table.select) {
        throw new Error('Supabase sync client does not support cloud retrieval.');
      }

      const { data, error } = await table
        .select('user_id,collection,record_id,payload,updated_at,deleted_at,schema_version')
        .eq('user_id', userId)
        .order('collection', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const rows = data ?? [];
      const compatibleRows = rows.filter((row) => row.schema_version <= PERSISTENCE_SCHEMA_VERSION);
      if (rows.length > 0 && compatibleRows.length === 0) {
        throw new Error('Cloud data was saved by a newer PeptideOS version. Update this device before retrieving.');
      }

      return {
        data: supabaseSyncRowsToPersistedUserData(compatibleRows),
        pulledRows: compatibleRows.length,
        pulledAt: latestUpdatedAt(compatibleRows),
        ignoredRows: rows.length - compatibleRows.length,
      };
    },
  };
}
