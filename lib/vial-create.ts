import { convertDoseToMg } from './dose-helpers';
import { convertIUToMg } from './peptide-conversions';
import type { ConcentrationUnit, DoseUnit, InventoryContainerType, Vial } from './types';

export interface NewVialInput {
  name: string;
  peptideId: string;
  dateAdded: string;
  containerType?: InventoryContainerType;
  totalAmountValue?: number;
  totalAmountUnit?: DoseUnit;
  concentrationValue?: number;
  concentrationUnit?: ConcentrationUnit;
  volumeMl?: number;
  packageUnit?: 'vial' | 'kit';
  packageQuantity?: number;
}

function deriveTotalMg(input: NewVialInput): number {
  if (input.concentrationValue && input.concentrationUnit && input.volumeMl && input.volumeMl > 0) {
    const total = input.concentrationValue * input.volumeMl;
    if (input.concentrationUnit === 'mg/ml') return total;

    return convertIUToMg(input.peptideId, total) ?? 0;
  }

  if (input.totalAmountValue && input.totalAmountUnit) {
    return convertDoseToMg(input.peptideId, input.totalAmountValue, input.totalAmountUnit) ?? 0;
  }

  return 0;
}

export function buildNewVial(input: NewVialInput): Omit<Vial, 'id'> | null {
  const { name, peptideId, dateAdded } = input;
  const trimmedName = name.trim();
  const trimmedPeptideId = peptideId.trim();

  if (!trimmedName || !trimmedPeptideId || Number.isNaN(new Date(dateAdded).getTime())) {
    return null;
  }

  const normalizedInput = { ...input, peptideId: trimmedPeptideId };
  const totalMg = deriveTotalMg(normalizedInput);
  const concentrationValue = normalizedInput.concentrationValue;
  const concentrationUnit = normalizedInput.concentrationUnit;
  const volumeMl = normalizedInput.volumeMl;
  const hasConcentration =
    concentrationValue !== undefined &&
    concentrationUnit !== undefined &&
    volumeMl !== undefined &&
    volumeMl > 0;
  const totalAmountValue = normalizedInput.totalAmountValue;
  const totalAmountUnit = normalizedInput.totalAmountUnit;
  const hasTotalAmount = totalAmountValue !== undefined && totalAmountUnit !== undefined;

  return {
    name: trimmedName,
    peptideId: trimmedPeptideId,
    ...(normalizedInput.containerType ? { containerType: normalizedInput.containerType } : {}),
    dateAdded,
    source: '',
    lotNumber: '',
    mg: totalMg,
    ...(hasTotalAmount
      ? {
          totalAmount: {
            value: totalAmountValue,
            unit: totalAmountUnit,
          },
        }
      : {}),
    ...(hasConcentration
      ? {
          concentration: {
            value: concentrationValue,
            unit: concentrationUnit,
          },
          volumeMl,
        }
      : {}),
    bacWaterMl: 0,
    reconstitutedDate: null,
    expirationDate: new Date(`${dateAdded}T00:00:00.000Z`).toISOString(),
    status: 'sealed',
  };
}

export function getPhysicalVialCount(input: Pick<NewVialInput, 'packageUnit' | 'packageQuantity'>): number {
  const quantity = input.packageQuantity ?? 1;
  if (!Number.isFinite(quantity) || quantity < 1) return 0;

  return Math.floor(quantity) * (input.packageUnit === 'kit' ? 10 : 1);
}

export function buildNewVialBatch(input: NewVialInput): Array<Omit<Vial, 'id'>> {
  const count = getPhysicalVialCount(input);
  if (count < 1) return [];

  const baseVial = buildNewVial(input);
  if (!baseVial) return [];

  if (count === 1) return [baseVial];

  return Array.from({ length: count }, (_, index) => ({
    ...baseVial,
    name: `${baseVial.name} vial ${index + 1} of ${count}`,
  }));
}
