import { convertDoseToMg, formatDose, getDefaultDoseUnit } from './dose-helpers';
import { convertIUToMg, convertMgToIU } from './peptide-conversions';
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

function getOriginalMg(vial: Vial): number {
  if (vial.concentration && vial.volumeMl && vial.volumeMl > 0) {
    const total = vial.concentration.value * vial.volumeMl;
    if (vial.concentration.unit === 'mg/ml') {
      return total;
    }

    return convertIUToMg(vial.peptideId, total) ?? vial.mg;
  }

  return vial.mg;
}

function formatOriginalInventory(vial: Vial, originalMg: number): string {
  if (vial.concentration && vial.volumeMl && vial.volumeMl > 0) {
    const concentrationLabel =
      vial.concentration.unit === 'iu/ml'
        ? `${formatDose(vial.concentration.value, 'iu')}/mL`
        : `${formatDose(vial.concentration.value, 'mg')}/mL`;
    const volumeLabel = `${vial.volumeMl.toLocaleString('en-US', { maximumFractionDigits: 3 })} mL`;

    return `${concentrationLabel} · ${volumeLabel}`;
  }

  return formatInventoryMass(vial.peptideId, originalMg);
}

export function getVialInventoryMetrics(vial: Vial, doses: Dose[]): VialInventoryMetrics {
  const originalMg = getOriginalMg(vial);
  const usedMg = doses.reduce((total, dose) => {
    if (!dose.completed || dose.vialId !== vial.id || dose.peptideId !== vial.peptideId) {
      return total;
    }

    const doseMg = convertDoseToMg(dose.peptideId, dose.doseValue, dose.doseUnit);
    return total + (doseMg ?? 0);
  }, 0);
  const remainingMg = Math.max(originalMg - usedMg, 0);

  return {
    originalMg: roundMg(originalMg),
    usedMg: roundMg(usedMg),
    remainingMg: roundMg(remainingMg),
    originalLabel: formatOriginalInventory(vial, originalMg),
    remainingLabel: formatInventoryMass(vial.peptideId, remainingMg),
  };
}
