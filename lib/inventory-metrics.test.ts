import { describe, expect, it } from 'vitest';
import { getVialInventoryMetrics } from './inventory-metrics';
import type { Dose, Vial } from './types';

const baseVial: Vial = {
  id: 'vial-1',
  name: 'BPC-157 active vial',
  peptideId: 'bpc-157',
  dateAdded: '2026-05-20',
  source: 'Source',
  lotNumber: 'LOT-1',
  mg: 5,
  bacWaterMl: 2,
  reconstitutedDate: null,
  expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
};

function dose(overrides: Partial<Dose>): Dose {
  return {
    id: 'dose-1',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: new Date().toISOString(),
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed: true,
    ...overrides,
  };
}

describe('inventory metrics', () => {
  it('subtracts completed mass doses from vial amount and formats remaining mg', () => {
    const metrics = getVialInventoryMetrics(baseVial, [
      dose({ id: 'a', doseValue: 250, doseUnit: 'mcg' }),
      dose({ id: 'b', doseValue: 0.5, doseUnit: 'mg' }),
      dose({ id: 'c', completed: false, doseValue: 2, doseUnit: 'mg' }),
      dose({ id: 'd', vialId: 'other-vial', doseValue: 1, doseUnit: 'mg' }),
    ]);

    expect(metrics.remainingMg).toBe(4.25);
    expect(metrics.remainingLabel).toBe('4.25 mg');
    expect(metrics.originalLabel).toBe('5 mg');
  });

  it('formats IU-primary vial inventory in IU when conversion metadata exists', () => {
    const metrics = getVialInventoryMetrics(
      { ...baseVial, id: 'hgh-vial', peptideId: 'hgh', mg: 3.33 },
      [dose({ id: 'hgh-dose', peptideId: 'hgh', vialId: 'hgh-vial', doseValue: 2, doseUnit: 'iu' })]
    );

    expect(metrics.remainingMg).toBeCloseTo(2.663, 3);
    expect(metrics.originalLabel).toBe('9.99 IU');
    expect(metrics.remainingLabel).toBe('7.99 IU');
  });

  it('clamps overdrawn remaining amount at zero', () => {
    const metrics = getVialInventoryMetrics(baseVial, [dose({ doseValue: 10, doseUnit: 'mg' })]);

    expect(metrics.remainingMg).toBe(0);
    expect(metrics.remainingLabel).toBe('0 mg');
  });

  it('derives inventory from concentration and volume for multi-dose vials', () => {
    const testosteroneVial: Vial = {
      ...baseVial,
      id: 'test-cyp-vial',
      peptideId: 'testosterone-cypionate',
      containerType: 'multi-dose-vial',
      mg: 0,
      concentration: { value: 200, unit: 'mg/ml' },
      volumeMl: 10,
    };

    const metrics = getVialInventoryMetrics(testosteroneVial, [
      dose({
        id: 'test-dose',
        peptideId: 'testosterone-cypionate',
        vialId: 'test-cyp-vial',
        doseValue: 100,
        doseUnit: 'mg',
        route: 'im',
      }),
    ]);

    expect(metrics.originalMg).toBe(2000);
    expect(metrics.remainingMg).toBe(1900);
    expect(metrics.originalLabel).toBe('200 mg/mL · 10 mL');
    expect(metrics.remainingLabel).toBe('1900 mg');
  });

  it('formats IU concentration containers in IU when conversion metadata exists', () => {
    const hghPen: Vial = {
      ...baseVial,
      id: 'hgh-pen',
      peptideId: 'hgh',
      containerType: 'prefilled-pen',
      mg: 0,
      concentration: { value: 10, unit: 'iu/ml' },
      volumeMl: 1.5,
    };

    const metrics = getVialInventoryMetrics(hghPen, [
      dose({ id: 'hgh-pen-dose', peptideId: 'hgh', vialId: 'hgh-pen', doseValue: 2, doseUnit: 'iu' }),
    ]);

    expect(metrics.originalMg).toBe(5);
    expect(metrics.remainingMg).toBeCloseTo(4.333, 3);
    expect(metrics.originalLabel).toBe('10 IU/mL · 1.5 mL');
    expect(metrics.remainingLabel).toBe('13 IU');
  });
});
