import { describe, expect, it } from 'vitest';

import { getDoseDrawVolumePreview, getDoseDrawVolumeSummary } from './draw-volume';
import type { Vial } from './types';

const bpcVial: Vial = {
  id: 'vial-bpc',
  name: 'BPC active vial',
  peptideId: 'bpc-157',
  dateAdded: '2026-06-28',
  source: 'test',
  lotNumber: 'BPC-001',
  mg: 5,
  bacWaterMl: 2,
  reconstitutedDate: '2026-06-28',
  expirationDate: '2026-07-26',
  status: 'active',
};

describe('dose draw volume preview', () => {
  it('derives draw volume from vial amount and BAC water for mass doses', () => {
    const preview = getDoseDrawVolumePreview({ vial: bpcVial, doseValue: 250, doseUnit: 'mcg' });

    expect(preview).toMatchObject({
      drawMl: 0.1,
      syringeUnits: 10,
      concentrationMgPerMl: 2.5,
      concentrationLabel: '2.5 mg/mL',
      drawLabel: '0.10 mL',
      syringeLabel: '10 U-100 units',
    });
    expect(getDoseDrawVolumeSummary(preview, 250, 'mcg')).toBe('250 mcg -> 0.10 mL / 10 U-100 units');
  });

  it('uses stored concentration when present', () => {
    const preview = getDoseDrawVolumePreview({
      vial: { ...bpcVial, concentration: { value: 5, unit: 'mg/ml' }, bacWaterMl: 0 },
      doseValue: 1,
      doseUnit: 'mg',
    });

    expect(preview?.drawMl).toBeCloseTo(0.2);
    expect(preview?.syringeLabel).toBe('20 U-100 units');
  });

  it('handles IU concentration and IU dose for compounds with conversion metadata', () => {
    const preview = getDoseDrawVolumePreview({
      vial: {
        ...bpcVial,
        peptideId: 'hgh',
        totalAmount: { value: 10, unit: 'iu' },
        concentration: { value: 10, unit: 'iu/ml' },
        mg: 10 / 3,
        bacWaterMl: 1,
      },
      doseValue: 2,
      doseUnit: 'iu',
    });

    expect(preview?.drawMl).toBeCloseTo(0.2);
    expect(preview?.syringeUnits).toBeCloseTo(20);
    expect(preview?.concentrationLabel).toBe('10 IU/mL (3.33 mg/mL)');
  });

  it('returns null when dose or concentration cannot be derived', () => {
    expect(getDoseDrawVolumePreview({ vial: null, doseValue: 250, doseUnit: 'mcg' })).toBeNull();
    expect(getDoseDrawVolumePreview({ vial: { ...bpcVial, bacWaterMl: 0 }, doseValue: 250, doseUnit: 'mcg' })).toBeNull();
    expect(getDoseDrawVolumePreview({ vial: bpcVial, doseValue: 0, doseUnit: 'mcg' })).toBeNull();
    expect(getDoseDrawVolumePreview({ vial: bpcVial, doseValue: 2, doseUnit: 'iu' })).toBeNull();
  });
});
