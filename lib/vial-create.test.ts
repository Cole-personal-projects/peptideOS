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
});
