import { convertDoseToMg, formatDose, getDefaultDoseUnit } from './dose-helpers';
import { convertMgToIU } from './peptide-conversions';
import type { Dose, Vial } from './types';

export interface VialInventoryMetrics {
  originalMg: number;
  usedMg: number;
  remainingMg: number;
  originalLabel: string;
  remainingLabel: string;
}

function roundMg(value: number): number {
  return Number(value.toFixed(3));
}

function formatInventoryMass(peptideId: string, mg: number): string {
  if (getDefaultDoseUnit(peptideId) === 'iu') {
    const iu = convertMgToIU(peptideId, mg);
    if (iu !== null) {
      return formatDose(iu, 'iu');
    }
  }

  return formatDose(mg, 'mg');
}

export function getVialInventoryMetrics(vial: Vial, doses: Dose[]): VialInventoryMetrics {
  const usedMg = doses.reduce((total, dose) => {
    if (!dose.completed || dose.vialId !== vial.id || dose.peptideId !== vial.peptideId) {
      return total;
    }

    const doseMg = convertDoseToMg(dose.peptideId, dose.doseValue, dose.doseUnit);
    return total + (doseMg ?? 0);
  }, 0);
  const remainingMg = Math.max(vial.mg - usedMg, 0);

  return {
    originalMg: roundMg(vial.mg),
    usedMg: roundMg(usedMg),
    remainingMg: roundMg(remainingMg),
    originalLabel: formatInventoryMass(vial.peptideId, vial.mg),
    remainingLabel: formatInventoryMass(vial.peptideId, remainingMg),
  };
}
