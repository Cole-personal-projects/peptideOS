import { describe, expect, it } from 'vitest';
import {
  canUseIU,
  convertIUToMg,
  convertMcgToMg,
  convertMgToIU,
  getConversionById,
  peptideConversions,
} from './peptide-conversions';
import { referenceCompounds } from './reference-compounds';

describe('peptide conversion metadata', () => {
  it('keeps IU conversion ratios compound-specific', () => {
    expect(convertMgToIU('hgh', 1)).toBe(3);
    expect(convertIUToMg('hgh', 3)).toBe(1);
    expect(convertMgToIU('hcg', 1)).toBe(6000);
    expect(convertIUToMg('hcg', 6000)).toBe(1);
  });

  it('does not invent IU conversions for mass-only compounds', () => {
    expect(canUseIU('bpc-157')).toBe(false);
    expect(convertMgToIU('bpc-157', 1)).toBeNull();
    expect(convertIUToMg('bpc-157', 1)).toBeNull();
  });

  it('exposes expected dosing modes and defaults for key compounds', () => {
    expect(getConversionById('hgh')?.dosingMode).toBe('iu-primary');
    expect(getConversionById('tb-500')?.defaultUnit).toBe('mg');
    expect(getConversionById('bpc-157')?.defaultUnit).toBe('mcg');
  });

  it('converts mcg to mg without changing the stored display unit', () => {
    expect(convertMcgToMg(250)).toBe(0.25);
    expect(convertMcgToMg(2500)).toBe(2.5);
  });

  it('includes every reconstituted reference-library compound in the calculator picker', () => {
    const conversionIds = new Set(peptideConversions.map((compound) => compound.id));
    const reconstitutedReferenceIds = referenceCompounds
      .filter((compound) => compound.concentrationMode === 'reconstituted' && compound.reconstitutionDefaults)
      .map((compound) => compound.id);

    expect(reconstitutedReferenceIds.length).toBeGreaterThan(20);
    expect([...conversionIds]).toEqual(expect.arrayContaining(reconstitutedReferenceIds));
  });

  it('generates calculator defaults from reference reconstitution metadata', () => {
    expect(getConversionById('dsip')).toMatchObject({
      id: 'dsip',
      name: 'Delta Sleep-Inducing Peptide',
      defaultUnit: 'mcg',
      typicalVialSizes: [{ value: 5, unit: 'mg' }],
    });
  });
});
