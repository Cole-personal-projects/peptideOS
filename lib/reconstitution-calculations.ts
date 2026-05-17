import { formatDose } from './dose-helpers';
import type { PeptideConversion, SyringeType } from './peptide-conversions';
import type { DoseUnit } from './types';

export type VialUnit = 'mg' | 'iu';

export interface ReconstitutionInput {
  compound: PeptideConversion;
  syringe: SyringeType;
  vialSize: number;
  vialUnit: VialUnit;
  bacWaterMl: number;
  doseValue: number;
  doseUnit: DoseUnit;
  vialCost?: number | null;
  cycleDays?: number | null;
}

export interface ReconstitutionResult {
  volumeToDrawMl: number;
  syringeUnits: number;
  concentrationMgPerMl: number;
  concentrationDisplay: string;
  doseDisplay: string;
  vialDisplay: string;
  totalDoses: number;
  costPerDose: number | null;
  costPerCycle: number | null;
  vialMg: number;
  doseMg: number;
}

export interface ReconstitutionWarning {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  suggestion?: string;
}

export function calculateReconstitution(input: ReconstitutionInput): ReconstitutionResult | null {
  const { compound, syringe, vialSize, vialUnit, bacWaterMl, doseValue, doseUnit } = input;

  if (vialSize <= 0 || doseValue <= 0 || bacWaterMl <= 0) {
    return null;
  }

  if ((vialUnit === 'iu' || doseUnit === 'iu') && !compound.iuPerMg) {
    return null;
  }

  const vialMg = vialUnit === 'iu' ? vialSize / compound.iuPerMg! : vialSize;
  const doseMg = doseUnit === 'iu'
    ? doseValue / compound.iuPerMg!
    : doseUnit === 'mcg'
      ? doseValue / 1000
      : doseValue;

  const concentrationMgPerMl = vialMg / bacWaterMl;
  const volumeToDrawMl = doseMg / concentrationMgPerMl;
  const syringeUnits = volumeToDrawMl * syringe.unitsPerMl;
  const totalDoses = vialMg / doseMg;

  let concentrationDisplay: string;
  let doseDisplay: string;
  let vialDisplay: string;

  if (compound.dosingMode === 'iu-primary' && compound.iuPerMg) {
    const concentrationIuPerMl = concentrationMgPerMl * compound.iuPerMg;
    concentrationDisplay = `${concentrationIuPerMl.toFixed(1)} IU/mL (${concentrationMgPerMl.toFixed(2)} mg/mL)`;

    if (doseUnit === 'iu') {
      const doseMcg = doseMg * 1000;
      doseDisplay = `${doseValue} IU (${doseMcg.toFixed(0)} mcg)`;
    } else {
      const doseIu = doseMg * compound.iuPerMg;
      doseDisplay = `${formatDose(doseValue, doseUnit)} (${doseIu.toFixed(1)} IU)`;
    }

    if (vialUnit === 'iu') {
      vialDisplay = `${vialSize} IU (${vialMg.toFixed(2)} mg)`;
    } else {
      const vialIu = vialMg * compound.iuPerMg;
      vialDisplay = `${vialSize} mg (${vialIu.toFixed(0)} IU)`;
    }
  } else {
    const concentrationMcgPerMl = concentrationMgPerMl * 1000;
    concentrationDisplay = `${concentrationMgPerMl.toFixed(2)} mg/mL (${concentrationMcgPerMl.toFixed(0)} mcg/mL)`;

    if (doseUnit === 'mcg') {
      doseDisplay = `${doseValue} mcg (${doseMg.toFixed(3)} mg)`;
    } else {
      const doseMcg = doseMg * 1000;
      doseDisplay = `${doseValue} mg (${doseMcg.toFixed(0)} mcg)`;
    }

    vialDisplay = `${vialMg} mg (${vialMg * 1000} mcg)`;
  }

  let costPerDose: number | null = null;
  let costPerCycle: number | null = null;
  const cost = input.vialCost ?? null;
  const days = input.cycleDays ?? null;

  if (cost !== null && cost > 0) {
    costPerDose = cost / totalDoses;
    if (days !== null && days > 0) {
      costPerCycle = costPerDose * days;
    }
  }

  return {
    volumeToDrawMl,
    syringeUnits,
    concentrationMgPerMl,
    concentrationDisplay,
    doseDisplay,
    vialDisplay,
    totalDoses,
    costPerDose,
    costPerCycle,
    vialMg,
    doseMg,
  };
}

export function getReconstitutionWarnings({
  calculations,
  compound,
  syringe,
  doseValue,
  doseUnit,
  isIUCompound,
}: {
  calculations: ReconstitutionResult | null;
  compound: PeptideConversion | undefined;
  syringe: SyringeType;
  doseValue: number;
  doseUnit: DoseUnit;
  isIUCompound: boolean;
}): ReconstitutionWarning[] {
  const result: ReconstitutionWarning[] = [];
  if (!calculations || !compound) return result;

  const { syringeUnits, volumeToDrawMl } = calculations;

  if (syringeUnits > syringe.totalUnits) {
    result.push({
      id: 'exceeds-capacity',
      type: 'error',
      message: 'Dose exceeds syringe capacity',
      suggestion: `The draw volume (${syringeUnits.toFixed(1)} units) exceeds your ${syringe.totalUnits}-unit syringe. Use a larger syringe or increase BAC water to dilute.`,
    });
  }

  if (volumeToDrawMl > 0.5 && syringeUnits <= syringe.totalUnits) {
    result.push({
      id: 'too-dilute',
      type: 'warning',
      message: 'Concentration may be too dilute',
      suggestion: `Drawing ${volumeToDrawMl.toFixed(2)}mL per dose. Consider using less BAC water for more concentrated solution.`,
    });
  }

  if (volumeToDrawMl < 0.05 && volumeToDrawMl > 0) {
    result.push({
      id: 'too-concentrated',
      type: 'warning',
      message: 'Concentration may be too concentrated',
      suggestion: `Drawing only ${(volumeToDrawMl * 1000).toFixed(1)}µL. Consider adding more BAC water for accurate dosing.`,
    });
  }

  const { min, max, unit } = compound.typicalDoseRange;
  let doseInRangeUnit: number;

  if (unit === 'iu' && compound.iuPerMg) {
    doseInRangeUnit = doseUnit === 'iu'
      ? doseValue
      : doseUnit === 'mg'
        ? doseValue * compound.iuPerMg
        : (doseValue / 1000) * compound.iuPerMg;
  } else if (unit === 'mg') {
    doseInRangeUnit = doseUnit === 'mg'
      ? doseValue
      : doseUnit === 'mcg'
        ? doseValue / 1000
        : doseValue / (compound.iuPerMg || 1);
  } else {
    doseInRangeUnit = doseUnit === 'mcg'
      ? doseValue
      : doseUnit === 'mg'
        ? doseValue * 1000
        : (doseValue / (compound.iuPerMg || 1)) * 1000;
  }

  if (doseInRangeUnit < min * 0.5 || doseInRangeUnit > max * 2) {
    result.push({
      id: 'unusual-dose',
      type: 'warning',
      message: `Unusual dose for ${compound.name}`,
      suggestion: `Typical research range: ${min}-${max} ${unit}. Verify your intended dose.`,
    });
  }

  if (isIUCompound && compound.typicalVialSizes.length > 0) {
    const sizes = compound.typicalVialSizes.map((size) => `${size.value} ${size.unit}`).join(', ');
    result.push({
      id: 'verify-vial',
      type: 'info',
      message: 'Verify your vial label',
      suggestion: `Common vial sizes for ${compound.name}: ${sizes}`,
    });
  }

  return result;
}
