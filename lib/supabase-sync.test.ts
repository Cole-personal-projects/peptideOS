import { describe, expect, test } from 'vitest';
import {
  buildSupabaseSyncRows,
  createSupabaseUserDataSyncAdapter,
  supabaseSyncRowsToPersistedUserData,
} from './supabase-sync';
import type { PersistedUserData } from './persistence';

const settings = {
  hasSeenDisclaimer: true,
  hasCompletedOnboarding: true,
  userMode: 'researcher' as const,
  biometricLock: false,
  darkMode: true,
};

describe('Supabase user-data sync contracts', () => {
  test('serializes user-owned app data into deterministic owner-scoped sync rows', () => {
    const data: PersistedUserData = {
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
      inventoryBatches: [],
      doses: [],
      stacks: [],
      schedules: [],
      scheduleLogs: [],
      reconstitutionCalculations: [],
      signalCheckIns: [],
      userCompounds: [],
      settings,
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
      schema_version: 6,
    });
    expect(rows[1]).toEqual(expect.objectContaining({
      user_id: 'user-amy',
      collection: 'vials',
      record_id: 'vial-cloud',
      payload: expect.objectContaining({ id: 'vial-cloud', peptideId: 'kpv' }),
    }));
  });

  test('hydrates persisted user data from active owner-scoped sync rows', () => {
    const rows = buildSupabaseSyncRows({
      userId: 'user-amy',
      syncedAt: new Date('2026-06-16T12:00:00.000Z'),
      data: {
        vials: [
          {
            id: 'vial-cloud',
            name: 'Cloud KPV vial',
            peptideId: 'kpv',
            dateAdded: '2026-06-16',
            source: 'Source A',
            lotNumber: 'KPV-001',
            mg: 10,
            bacWaterMl: 0,
            reconstitutedDate: null,
            expirationDate: '2027-06-16',
            status: 'sealed',
          },
        ],
        inventoryBatches: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
        signalCheckIns: [],
        userCompounds: [],
        settings,
      },
    });

    const deletedRow = {
      ...rows[1]!,
      record_id: 'vial-deleted',
      payload: { id: 'vial-deleted' },
      deleted_at: '2026-06-16T13:00:00.000Z',
    };

    expect(supabaseSyncRowsToPersistedUserData([...rows, deletedRow])).toEqual({
      vials: [expect.objectContaining({ id: 'vial-cloud', name: 'Cloud KPV vial' })],
      inventoryBatches: [],
      doses: [],
      stacks: [],
      schedules: [],
      scheduleLogs: [],
      reconstitutionCalculations: [],
      signalCheckIns: [],
      userCompounds: [],
      settings,
    });
  });

  test('pushes serialized user data through the Supabase app sync table', async () => {
    const upsertCalls: Array<{ table: string; rows: unknown[]; options: unknown }> = [];
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
      data: {
        vials: [],
        inventoryBatches: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
        signalCheckIns: [],
        userCompounds: [],
        settings,
      },
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

  test('rejects unsigned sync pushes and surfaces Supabase write failures', async () => {
    const emptyData: PersistedUserData = {
      vials: [],
      inventoryBatches: [],
      doses: [],
      stacks: [],
      schedules: [],
      scheduleLogs: [],
      reconstitutionCalculations: [],
      signalCheckIns: [],
      userCompounds: [],
      settings,
    };
    const client = {
      from() {
        return {
          upsert() {
            return Promise.resolve({ error: { message: 'RLS denied write' } });
          },
        };
      },
    };
    const adapter = createSupabaseUserDataSyncAdapter(client);

    expect(() => buildSupabaseSyncRows({ userId: ' ', data: emptyData })).toThrow(/signed-in user id/i);
    await expect(adapter.pushUserData({ userId: 'user-amy', data: emptyData })).rejects.toThrow('RLS denied write');
  });
});
