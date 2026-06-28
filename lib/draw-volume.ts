import { convertDoseToMg, formatDose } from './dose-helpers';
import { convertIUToMg, convertMgToIU, syringeTypes } from './peptide-conversions';
import type { DoseUnit, Vial } from './types';

export interface DoseDrawVolumePreview {
  drawMl: number;
  syringeUnits: number;
  doseMg: number;
  concentrationMgPerMl: number;
  concentrationLabel: string;
  drawLabel: string;
  syringeLabel: string;
}

const defaultSyringe = syringeTypes.find((syringe) => syringe.id === 'u100-1ml') ?? syringeTypes[0];

function roundForDisplay(value: number, maximumFractionDigits: number) {
  return value.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
  });
}

function getVialConcentrationMgPerMl(vial: Vial): number | null {
  if (vial.concentration?.value && vial.concentration.value > 0) {
    if (vial.concentration.unit === 'mg/ml') return vial.concentration.value;
    return convertIUToMg(vial.peptideId, vial.concentration.value);
  }

  if (vial.bacWaterMl > 0 && vial.totalAmount?.unit === 'iu') {
    const mg = convertIUToMg(vial.peptideId, vial.totalAmount.value);
    return mg === null ? null : mg / vial.bacWaterMl;
  }

  if (vial.bacWaterMl > 0 && vial.mg > 0) return vial.mg / vial.bacWaterMl;
  return null;
}

function formatConcentration(vial: Vial, concentrationMgPerMl: number) {
  const iuPerMl = convertMgToIU(vial.peptideId, concentrationMgPerMl);
  const massLabel = `${roundForDisplay(concentrationMgPerMl, 2)} mg/mL`;
  if (iuPerMl === null) return massLabel;
  return `${roundForDisplay(iuPerMl, 2)} IU/mL (${massLabel})`;
}

export function getDoseDrawVolumePreview({
  vial,
  doseValue,
  doseUnit,
}: {
  vial: Vial | null | undefined;
  doseValue: number;
  doseUnit: DoseUnit;
}): DoseDrawVolumePreview | null {
  if (!vial || !Number.isFinite(doseValue) || doseValue <= 0) return null;

  const concentrationMgPerMl = getVialConcentrationMgPerMl(vial);
  if (concentrationMgPerMl === null || concentrationMgPerMl <= 0) return null;

  const doseMg = convertDoseToMg(vial.peptideId, doseValue, doseUnit);
  if (doseMg === null || doseMg <= 0) return null;

  const drawMl = doseMg / concentrationMgPerMl;
  const syringeUnits = drawMl * defaultSyringe.unitsPerMl;

  return {
    drawMl,
    syringeUnits,
    doseMg,
    concentrationMgPerMl,
    concentrationLabel: formatConcentration(vial, concentrationMgPerMl),
    drawLabel: `${roundForDisplay(drawMl, 3)} mL`,
    syringeLabel: `${roundForDisplay(syringeUnits, 1)} U-100 units`,
  };
}

export function getDoseDrawVolumeSummary(preview: DoseDrawVolumePreview | null, doseValue: number, doseUnit: DoseUnit) {
  if (!preview) return null;
  return `${formatDose(doseValue, doseUnit)} -> ${preview.drawLabel} / ${preview.syringeLabel}`;
}
