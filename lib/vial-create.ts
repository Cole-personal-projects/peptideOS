import type { Vial } from './types';

export interface NewVialInput {
  name: string;
  peptideId: string;
  dateAdded: string;
}

export function buildNewVial({ name, peptideId, dateAdded }: NewVialInput): Omit<Vial, 'id'> | null {
  const trimmedName = name.trim();
  const trimmedPeptideId = peptideId.trim();

  if (!trimmedName || !trimmedPeptideId || Number.isNaN(new Date(dateAdded).getTime())) {
    return null;
  }

  return {
    name: trimmedName,
    peptideId: trimmedPeptideId,
    dateAdded,
    source: '',
    lotNumber: '',
    mg: 0,
    bacWaterMl: 0,
    reconstitutedDate: null,
    expirationDate: new Date(`${dateAdded}T00:00:00.000Z`).toISOString(),
    status: 'sealed',
  };
}
