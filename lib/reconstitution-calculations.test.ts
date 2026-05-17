import { describe, expect, it } from 'vitest';
import { calculateReconstitution, getReconstitutionWarnings } from './reconstitution-calculations';
import { getConversionById, syringeTypes } from './peptide-conversions';

const u100Syringe = syringeTypes.find((syringe) => syringe.id === 'u100-1ml')!;

describe('reconstitution calculations', () => {
  it('calculates the hGH IU trifecta without normalizing the displayed dose', () => {
    const hgh = getConversionById('hgh')!;

    const result = calculateReconstitution({
      compound: hgh,
      syringe: u100Syringe,
      vialSize: 10,
      vialUnit: 'iu',
      bacWaterMl: 1,
      doseValue: 2,
      doseUnit: 'iu',
    });

    expect(result).not.toBeNull();
    expect(result?.volumeToDrawMl).toBeCloseTo(0.2);
    expect(result?.syringeUnits).toBeCloseTo(20);
    expect(result?.doseDisplay).toBe('2 IU (667 mcg)');
    expect(result?.concentrationDisplay).toBe('10.0 IU/mL (3.33 mg/mL)');
    expect(result?.totalDoses).toBeCloseTo(5);
  });

  it('keeps mass-based doses in the selected display unit', () => {
    const tb500 = getConversionById('tb-500')!;

    const result = calculateReconstitution({
      compound: tb500,
      syringe: u100Syringe,
      vialSize: 5,
      vialUnit: 'mg',
      bacWaterMl: 2,
      doseValue: 2.5,
      doseUnit: 'mg',
    });

    expect(result?.volumeToDrawMl).toBeCloseTo(1);
    expect(result?.syringeUnits).toBeCloseTo(100);
    expect(result?.doseDisplay).toBe('2.5 mg (2500 mcg)');
  });

  it('calculates costs when vial cost and cycle length are present', () => {
    const bpc = getConversionById('bpc-157')!;

    const result = calculateReconstitution({
      compound: bpc,
      syringe: u100Syringe,
      vialSize: 5,
      vialUnit: 'mg',
      bacWaterMl: 2,
      doseValue: 250,
      doseUnit: 'mcg',
      vialCost: 100,
      cycleDays: 10,
    });

    expect(result?.totalDoses).toBeCloseTo(20);
    expect(result?.costPerDose).toBeCloseTo(5);
    expect(result?.costPerCycle).toBeCloseTo(50);
    expect(result?.vialDisplay).toBe('5 mg (5000 mcg)');
    expect(result?.doseDisplay).toBe('250 mcg (0.250 mg)');
  });

  it('returns null when IU units are requested for mass-only compounds', () => {
    const bpc = getConversionById('bpc-157')!;

    expect(calculateReconstitution({
      compound: bpc,
      syringe: u100Syringe,
      vialSize: 10,
      vialUnit: 'iu',
      bacWaterMl: 1,
      doseValue: 2,
      doseUnit: 'iu',
    })).toBeNull();
  });

  it('returns null for incomplete inputs', () => {
    const bpc = getConversionById('bpc-157')!;

    expect(calculateReconstitution({
      compound: bpc,
      syringe: u100Syringe,
      vialSize: 0,
      vialUnit: 'mg',
      bacWaterMl: 2,
      doseValue: 250,
      doseUnit: 'mcg',
    })).toBeNull();
  });

  it('warns when a draw exceeds syringe capacity or is outside typical range', () => {
    const tb500 = getConversionById('tb-500')!;
    const result = calculateReconstitution({
      compound: tb500,
      syringe: u100Syringe,
      vialSize: 5,
      vialUnit: 'mg',
      bacWaterMl: 2,
      doseValue: 3,
      doseUnit: 'mg',
    })!;

    const warnings = getReconstitutionWarnings({
      calculations: result,
      compound: tb500,
      syringe: u100Syringe,
      doseValue: 3,
      doseUnit: 'mg',
      isIUCompound: false,
    });

    expect(warnings.map((warning) => warning.id)).toContain('exceeds-capacity');
  });

  it('warns for very small draws, unusual doses, and IU label verification', () => {
    const hgh = getConversionById('hgh')!;
    const result = calculateReconstitution({
      compound: hgh,
      syringe: u100Syringe,
      vialSize: 10,
      vialUnit: 'iu',
      bacWaterMl: 1,
      doseValue: 0.1,
      doseUnit: 'iu',
    })!;

    const warnings = getReconstitutionWarnings({
      calculations: result,
      compound: hgh,
      syringe: u100Syringe,
      doseValue: 0.1,
      doseUnit: 'iu',
      isIUCompound: true,
    });

    expect(warnings.map((warning) => warning.id)).toEqual([
      'too-concentrated',
      'unusual-dose',
      'verify-vial',
    ]);
  });

  it('returns no warnings without calculations or compound metadata', () => {
    const bpc = getConversionById('bpc-157')!;
    const result = calculateReconstitution({
      compound: bpc,
      syringe: u100Syringe,
      vialSize: 5,
      vialUnit: 'mg',
      bacWaterMl: 2,
      doseValue: 250,
      doseUnit: 'mcg',
    });

    expect(getReconstitutionWarnings({
      calculations: null,
      compound: bpc,
      syringe: u100Syringe,
      doseValue: 250,
      doseUnit: 'mcg',
      isIUCompound: false,
    })).toEqual([]);
    expect(getReconstitutionWarnings({
      calculations: result,
      compound: undefined,
      syringe: u100Syringe,
      doseValue: 250,
      doseUnit: 'mcg',
      isIUCompound: false,
    })).toEqual([]);
  });
});
