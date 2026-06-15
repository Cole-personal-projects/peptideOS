import type { ProtocolCompoundInput } from './ai-protocol';
import type { DoseUnit, InventoryContainerType } from './types';
import type { NewVialInput } from './vial-create';

export interface ParsedInventoryIntake {
  compoundName: string;
  vialAmountValue: number | null;
  vialAmountUnit: DoseUnit | null;
  containerType: InventoryContainerType | null;
  packageUnit: 'vial' | 'kit' | null;
  packageQuantity: number | null;
}

export interface InventoryDraftResult {
  draft: NewVialInput | null;
  unmatchedCompound: string | null;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function findCompound(compoundName: string, compounds: ProtocolCompoundInput[]) {
  const normalizedName = normalizeName(compoundName);
  return compounds.find((compound) => normalizeName(compound.name) === normalizedName);
}

export function parsedInventoryToVialDraft(
  parsed: ParsedInventoryIntake,
  compounds: ProtocolCompoundInput[],
  now = new Date(),
): InventoryDraftResult {
  const compound = findCompound(parsed.compoundName, compounds);
  if (!compound) {
    return { draft: null, unmatchedCompound: parsed.compoundName };
  }

  if (
    parsed.vialAmountValue === null
    || parsed.vialAmountValue <= 0
    || parsed.vialAmountUnit === null
  ) {
    return { draft: null, unmatchedCompound: null };
  }

  const packageUnit = parsed.packageUnit ?? 'vial';
  const packageQuantity = parsed.packageQuantity && parsed.packageQuantity > 0 ? parsed.packageQuantity : 1;

  return {
    draft: {
      name: packageUnit === 'kit' ? `${compound.name} kit` : `${compound.name} vial`,
      peptideId: compound.id,
      dateAdded: now.toISOString().slice(0, 10),
      containerType: parsed.containerType ?? 'lyophilized-vial',
      totalAmountValue: parsed.vialAmountValue,
      totalAmountUnit: parsed.vialAmountUnit,
      packageUnit,
      packageQuantity,
    },
    unmatchedCompound: null,
  };
}
