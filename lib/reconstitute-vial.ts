import type { Vial } from './types';

const DEFAULT_RECONSTITUTED_STABILITY_DAYS = 28;

export interface ReconstituteVialInput {
  vial: Vial;
  bacWaterMl: number;
  now?: Date;
}

export interface ReconstitutionPreview {
  concentrationMgPerMl: number;
  concentrationMcgPerMl: number;
  concentrationLabel: string;
}

function isValidBacWater(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getReconstitutionPreview({
  vial,
  bacWaterMl,
}: ReconstituteVialInput): ReconstitutionPreview | null {
  if (!isValidBacWater(bacWaterMl)) {
    return null;
  }

  const concentrationMgPerMl = vial.mg / bacWaterMl;
  const concentrationMcgPerMl = concentrationMgPerMl * 1000;

  return {
    concentrationMgPerMl,
    concentrationMcgPerMl,
    concentrationLabel: `${concentrationMgPerMl.toFixed(2)} mg/mL (${concentrationMcgPerMl.toFixed(0)} mcg/mL)`,
  };
}

export function buildReconstitutedVialUpdate({
  bacWaterMl,
  now = new Date(),
}: ReconstituteVialInput): Pick<Vial, 'status' | 'bacWaterMl' | 'reconstitutedDate' | 'expirationDate'> | null {
  if (!isValidBacWater(bacWaterMl)) {
    return null;
  }

  return {
    status: 'active',
    bacWaterMl,
    reconstitutedDate: now.toISOString(),
    expirationDate: addDays(now, DEFAULT_RECONSTITUTED_STABILITY_DAYS).toISOString(),
  };
}
