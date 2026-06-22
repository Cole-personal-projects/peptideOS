import { describe, expect, test } from 'vitest';
import {
  buildSupabaseSyncRows,
  createSupabaseUserDataSyncAdapter,
  supabaseSyncRowsToPersistedUserData,
  type SupabaseSyncRow,
} from './supabase-sync';
import type { PersistedUserData } from './persistence';

const settings = {
  hasSeenDisclaimer: true,
  hasCompletedOnboarding: true,
  userMode: 'researcher' as const,
  biometricLock: false,
  darkMode: true,
};

const emptyData: PersistedUserData = {
  vials: [],
  inventoryBatches: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
  reconstitutionCalculations: [],
  signalCheckIns: [],
  labReports: [],
  labResults: [],
  labImportAudits: [],
  userCompounds: [],
  settings,
};

describe('Supabase user-data sync contracts', () => {
  test('serializes user-owned app data into deterministic owner-scoped sync rows', () => {
    const data: PersistedUserData = {
      ...emptyData,
      vials: [
        {
          id: 'vial-cloud',
          name: 'Cloud KPV vial',
          peptideId: 'kpv',
          containerType: 'lyophilized-vial',
          dateAdded: '2026-06-16',
          source: 'Source A',
          lotNumber: 'KPV-001',
          mg: 10,
          totalAmount: { value: 10, unit: 'mg' },
          bacWaterMl: 0,
          reconstitutedDate: null,
          expirationDate: '2027-06-16',
          status: 'sealed',
        },
      ],
    };

    const rows = buildSupabaseSyncRows({
      userId: 'user-amy',
      data,
      syncedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(rows.map((row) => `${row.collection}:${row.record_id}`)).toEqual([
      'settings:app-settings',
      'vials:vial-cloud',
    ]);
    expect(rows[0]).toEqual({
      user_id: 'user-amy',
      collection: 'settings',
      record_id: 'app-settings',
      payload: settings,
      updated_at: '2026-06-16T12:00:00.000Z',
      deleted_at: null,
      schema_version: 7,
    });
    expect(rows[1]).toEqual(expect.objectContaining({
      user_id: 'user-amy',
      collection: 'vials',
      record_id: 'vial-cloud',
      payload: data.vials[0],
      updated_at: '2026-06-16T12:00:00.000Z',
      deleted_at: null,
      schema_version: 7,
    }));
  });

  test('hydrates persisted data from active Supabase sync rows', () => {
    const rows = buildSupabaseSyncRows({
      userId: 'user-amy',
      data: {
        ...emptyData,
        vials: [
          {
            id: 'vial-active',
            name: 'Active cloud vial',
            peptideId: 'bpc-157',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-16',
            source: 'Cloud',
            lotNumber: '',
            mg: 5,
            totalAmount: { value: 5, unit: 'mg' },
            bacWaterMl: 1,
            reconstitutedDate: '2026-06-16',
            expirationDate: '2027-06-16',
            status: 'active',
          },
        ],
      },
      syncedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    rows.push({
      ...rows[1],
      record_id: 'vial-deleted',
      payload: { id: 'vial-deleted' },
      deleted_at: '2026-06-16T12:05:00.000Z',
    });

    const data = supabaseSyncRowsToPersistedUserData(rows);

    expect(data.settings).toEqual(settings);
    expect(data.vials).toHaveLength(1);
    expect(data.vials[0].id).toBe('vial-active');
  });

  test('pushes rows through Supabase upsert with owner conflict key', async () => {
    const upsertCalls: unknown[] = [];
    const client = {
      from(table: string) {
        return {
          upsert(rows: unknown[], options: unknown) {
            upsertCalls.push({ table, rows, options });
            return Promise.resolve({ error: null });
          },
        };
      },
    };

    const adapter = createSupabaseUserDataSyncAdapter(client);

    await expect(adapter.pushUserData({
      userId: 'user-amy',
      data: emptyData,
      syncedAt: new Date('2026-06-16T12:00:00.000Z'),
    })).resolves.toEqual({ pushedRows: 1 });

    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toEqual({
      table: 'app_user_sync_records',
      rows: [
        expect.objectContaining({
          user_id: 'user-amy',
          collection: 'settings',
          record_id: 'app-settings',
        }),
      ],
      options: { onConflict: 'user_id,collection,record_id' },
    });
  });

  test('pulls compatible signed-in rows from Supabase and reports latest cloud timestamp', async () => {
    const rows: SupabaseSyncRow[] = buildSupabaseSyncRows({
      userId: 'user-amy',
      data: emptyData,
      syncedAt: new Date('2026-06-16T12:00:00.000Z'),
    }).map((row) => ({ ...row, schema_version: 5 }));
    const filters: Array<[string, string | number]> = [];

    const client = {
      from(table: string) {
        expect(table).toBe('app_user_sync_records');
        return {
          select(columns: string) {
            expect(columns).toContain('payload');
            return {
              eq(column: string, value: string | number) {
                filters.push([column, value]);
                return this;
              },
              order(column: string) {
                expect(column).toBe('collection');
                return Promise.resolve({ data: rows, error: null });
              },
            };
          },
          upsert() {
            return Promise.resolve({ error: null });
          },
        };
      },
    };

    const adapter = createSupabaseUserDataSyncAdapter(client);
    const result = await adapter.pullUserData({ userId: 'user-amy' });

    expect(filters).toEqual([['user_id', 'user-amy']]);
    expect(result).toEqual({
      data: emptyData,
      pulledRows: 1,
      pulledAt: '2026-06-16T12:00:00.000Z',
      ignoredRows: 0,
    });
  });

  test('rejects cloud rows from newer unsupported app schemas', async () => {
    const rows: SupabaseSyncRow[] = buildSupabaseSyncRows({
      userId: 'user-amy',
      data: emptyData,
      syncedAt: new Date('2026-06-16T12:00:00.000Z'),
    }).map((row) => ({ ...row, schema_version: 999 }));
    const client = {
      from() {
        return {
          select() {
            return {
              eq() {
                return this;
              },
              order() {
                return Promise.resolve({ data: rows, error: null });
              },
            };
          },
          upsert() {
            return Promise.resolve({ error: null });
          },
        };
      },
    };

    const adapter = createSupabaseUserDataSyncAdapter(client);

    await expect(adapter.pullUserData({ userId: 'user-amy' })).rejects.toThrow(/newer PeptideOS version/i);
  });

  test('rejects unsigned sync and surfaces Supabase failures', async () => {
    const client = {
      from() {
        return {
          upsert() {
            return Promise.resolve({ error: { message: 'RLS denied write' } });
          },
          select() {
            return {
              eq() {
                return this;
              },
              order() {
                return Promise.resolve({ data: null, error: { message: 'RLS denied read' } });
              },
            };
          },
        };
      },
    };
    const adapter = createSupabaseUserDataSyncAdapter(client);

    expect(() => buildSupabaseSyncRows({ userId: ' ', data: emptyData })).toThrow(/signed-in user id/i);
    await expect(adapter.pushUserData({ userId: 'user-amy', data: emptyData })).rejects.toThrow('RLS denied write');
    await expect(adapter.pullUserData({ userId: 'user-amy' })).rejects.toThrow('RLS denied read');
  });
});
