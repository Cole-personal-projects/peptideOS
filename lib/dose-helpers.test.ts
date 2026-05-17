import { describe, expect, it } from 'vitest';
import {
  convertDoseToMg,
  convertDoseToUnit,
  formatDose,
  getAllowedDoseUnits,
  getDefaultDoseUnit,
} from './dose-helpers';

describe('dose helpers', () => {
  it('formats doses in the unit the user selected', () => {
    expect(formatDose(250, 'mcg')).toBe('250 mcg');
    expect(formatDose(2.5, 'mg')).toBe('2.5 mg');
    expect(formatDose(2, 'iu')).toBe('2 IU');
  });

  it('uses compound metadata for default dose units', () => {
    expect(getDefaultDoseUnit('bpc-157')).toBe('mcg');
    expect(getDefaultDoseUnit('tb-500')).toBe('mg');
    expect(getDefaultDoseUnit('hgh')).toBe('iu');
    expect(getDefaultDoseUnit('unknown-compound')).toBe('mcg');
  });

  it('only allows IU input for IU-primary compounds', () => {
    expect(getAllowedDoseUnits('hgh')).toEqual(['iu', 'mg', 'mcg']);
    expect(getAllowedDoseUnits('tb-500')).toEqual(['mcg', 'mg']);
  });

  it('converts IU doses only when the compound has a known IU ratio', () => {
    expect(convertDoseToMg('hgh', 3, 'iu')).toBe(1);
    expect(convertDoseToUnit('hgh', 1, 'mg', 'iu')).toBe(3);
    expect(convertDoseToUnit('hgh', 1000, 'mcg', 'iu')).toBe(3);
    expect(convertDoseToMg('bpc-157', 3, 'iu')).toBeNull();
  });

  it('converts between mass units and refuses unknown IU target conversions', () => {
    expect(convertDoseToUnit('tb-500', 2.5, 'mg', 'mg')).toBe(2.5);
    expect(convertDoseToUnit('tb-500', 2.5, 'mg', 'mcg')).toBe(2500);
    expect(convertDoseToUnit('tb-500', 2500, 'mcg', 'mg')).toBe(2.5);
    expect(convertDoseToUnit('tb-500', 2.5, 'mg', 'iu')).toBeNull();
  });
});
