import { describe, expect, it } from 'vitest';
import { buildReconstitutedVialUpdate, getReconstitutionPreview } from './reconstitute-vial';
import type { Vial } from './types';

const sealedVial: Vial = {
  id: 'vial-5',
  name: 'GHK-Cu sealed vial',
  peptideId: 'ghk-cu',
  dateAdded: '2026-05-20',
  source: 'Source',
  lotNumber: 'GHK-001',
  mg: 10,
  bacWaterMl: 0,
  reconstitutedDate: null,
  expirationDate: '2026-10-01T00:00:00.000Z',
  status: 'sealed',
};

describe('reconstitute vial', () => {
  it('builds an active vial update with a 28-day expiration window', () => {
    const now = new Date('2026-05-19T12:00:00.000Z');

    const update = buildReconstitutedVialUpdate({
      vial: sealedVial,
      bacWaterMl: 2,
      now,
    });

    expect(update).toEqual({
      status: 'active',
      bacWaterMl: 2,
      reconstitutedDate: '2026-05-19T12:00:00.000Z',
      expirationDate: '2026-06-16T12:00:00.000Z',
    });
  });

  it('rejects invalid BAC water values', () => {
    expect(buildReconstitutedVialUpdate({ vial: sealedVial, bacWaterMl: 0 })).toBeNull();
    expect(buildReconstitutedVialUpdate({ vial: sealedVial, bacWaterMl: Number.NaN })).toBeNull();
  });

  it('previews concentration from existing vial amount and entered BAC water', () => {
    expect(getReconstitutionPreview({ vial: sealedVial, bacWaterMl: 2 })).toEqual({
      concentrationMgPerMl: 5,
      concentrationMcgPerMl: 5000,
      concentrationLabel: '5.00 mg/mL (5000 mcg/mL)',
    });
  });
});
