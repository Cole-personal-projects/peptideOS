import { describe, expect, it } from 'vitest';
import { buildNewVial } from './vial-create';

describe('vial creation', () => {
  it('builds a sealed vial payload from name, peptide, and date added', () => {
    expect(
      buildNewVial({
        name: 'GHK-Cu backup vial',
        peptideId: 'ghk-cu',
        dateAdded: '2026-05-20',
      })
    ).toEqual({
      name: 'GHK-Cu backup vial',
      peptideId: 'ghk-cu',
      dateAdded: '2026-05-20',
      source: '',
      lotNumber: '',
      mg: 0,
      bacWaterMl: 0,
      reconstitutedDate: null,
      expirationDate: '2026-05-20T00:00:00.000Z',
      status: 'sealed',
    });
  });

  it('rejects blank names and missing peptides', () => {
    expect(buildNewVial({ name: ' ', peptideId: 'ghk-cu', dateAdded: '2026-05-20' })).toBeNull();
    expect(buildNewVial({ name: 'Backup vial', peptideId: '', dateAdded: '2026-05-20' })).toBeNull();
  });

  it('builds a concentration-based multi-dose vial payload', () => {
    expect(
      buildNewVial({
        name: 'Testosterone Cypionate 200mg/mL',
        peptideId: 'testosterone-cypionate',
        dateAdded: '2026-05-20',
        containerType: 'multi-dose-vial',
        concentrationValue: 200,
        concentrationUnit: 'mg/ml',
        volumeMl: 10,
      })
    ).toMatchObject({
      name: 'Testosterone Cypionate 200mg/mL',
      peptideId: 'testosterone-cypionate',
      containerType: 'multi-dose-vial',
      mg: 2000,
      concentration: { value: 200, unit: 'mg/ml' },
      volumeMl: 10,
      bacWaterMl: 0,
      status: 'sealed',
    });
  });

  it('builds a total-amount container payload', () => {
    expect(
      buildNewVial({
        name: 'Capsule Bottle',
        peptideId: 'nad-plus',
        dateAdded: '2026-05-20',
        containerType: 'capsule-bottle',
        totalAmountValue: 3000,
        totalAmountUnit: 'mg',
      })
    ).toMatchObject({
      name: 'Capsule Bottle',
      peptideId: 'nad-plus',
      containerType: 'capsule-bottle',
      mg: 3000,
      totalAmount: { value: 3000, unit: 'mg' },
      status: 'sealed',
    });
  });
});
