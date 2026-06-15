import { describe, expect, test } from 'vitest';
import { ensureInventoryBatches } from './inventory-batches';
import type { AppData, Vial } from './types';

const makeVial = (overrides: Partial<Vial>): Vial => ({
  id: overrides.id ?? 'vial-1',
  name: overrides.name ?? 'KPV kit vial',
  peptideId: overrides.peptideId ?? 'kpv',
  containerType: overrides.containerType ?? 'lyophilized-vial',
  dateAdded: overrides.dateAdded ?? '2026-06-15',
  source: overrides.source ?? 'Source A',
  lotNumber: overrides.lotNumber ?? 'KPV-001',
  mg: overrides.mg ?? 10,
  totalAmount: overrides.totalAmount ?? { value: 10, unit: 'mg' },
  bacWaterMl: overrides.bacWaterMl ?? 0,
  reconstitutedDate: overrides.reconstitutedDate ?? null,
  expirationDate: overrides.expirationDate ?? '2027-06-15T00:00:00.000Z',
  status: overrides.status ?? 'sealed',
});

const makeData = (vials: Vial[]): AppData => ({
  peptides: [],
  compounds: [],
  vials,
  inventoryBatches: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
  reconstitutionCalculations: [],
  signalCheckIns: [],
  hasSeenDisclaimer: true,
  hasCompletedOnboarding: true,
  userMode: 'researcher',
  biometricLock: false,
  darkMode: true,
});

describe('ensureInventoryBatches', () => {
  test('groups compatible legacy vials into durable inventory batches', () => {
    const data = makeData([
      makeVial({ id: 'vial-a', name: 'KPV kit vial 1 of 10' }),
      makeVial({ id: 'vial-b', name: 'KPV kit vial 2 of 10' }),
      makeVial({ id: 'vial-c', name: 'KPV other lot', lotNumber: 'KPV-002' }),
    ]);

    const next = ensureInventoryBatches(data);

    expect(next.inventoryBatches).toHaveLength(2);
    expect(next.vials.find((vial) => vial.id === 'vial-a')?.inventoryBatchId).toBe(
      next.vials.find((vial) => vial.id === 'vial-b')?.inventoryBatchId,
    );
    expect(next.vials.find((vial) => vial.id === 'vial-c')?.inventoryBatchId).not.toBe(
      next.vials.find((vial) => vial.id === 'vial-a')?.inventoryBatchId,
    );
    expect(next.inventoryBatches[0]).toEqual(expect.objectContaining({
      peptideId: 'kpv',
      totalAmount: { value: 10, unit: 'mg' },
      lotNumber: 'KPV-001',
      vialCount: 2,
    }));
  });
});
