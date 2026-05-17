import { getConversionById, canUseIU, convertIUToMg, convertMgToIU } from './peptide-conversions';
import type { DoseUnit } from './types';

export function getDoseUnitLabel(unit: DoseUnit): string {
  return unit === 'iu' ? 'IU' : unit;
}

export function formatDose(value: number, unit: DoseUnit): string {
  return `${Number.isInteger(value) ? value : value.toLocaleString('en-US', { maximumFractionDigits: 3 })} ${getDoseUnitLabel(unit)}`;
}

export function getDefaultDoseUnit(peptideId: string): DoseUnit {
  return getConversionById(peptideId)?.defaultUnit ?? 'mcg';
}

export function getAllowedDoseUnits(peptideId: string): DoseUnit[] {
  return canUseIU(peptideId) ? ['iu', 'mg', 'mcg'] : ['mcg', 'mg'];
}

export function convertDoseToMg(peptideId: string, value: number, unit: DoseUnit): number | null {
  if (unit === 'mg') return value;
  if (unit === 'mcg') return value / 1000;
  return convertIUToMg(peptideId, value);
}

export function convertDoseToUnit(peptideId: string, value: number, fromUnit: DoseUnit, toUnit: DoseUnit): number | null {
  if (fromUnit === toUnit) return value;

  const mg = convertDoseToMg(peptideId, value, fromUnit);
  if (mg === null) return null;

  if (toUnit === 'mg') return mg;
  if (toUnit === 'mcg') return mg * 1000;
  return convertMgToIU(peptideId, mg);
}
