import { referenceCompounds } from './reference-compounds';
import type { Compound } from './types';

export type UserCompoundDraft = Omit<Compound, 'source' | 'curationStatus' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncState'>;

const bundledCompoundIds = new Set(referenceCompounds.map((compound) => compound.id));

export function getPersistableUserCompounds(compounds: Compound[]): Compound[] {
  return compounds.filter((compound) => compound.source === 'user' && !bundledCompoundIds.has(compound.id));
}

export function getVisibleUserCompounds(compounds: Compound[]): Compound[] {
  return getPersistableUserCompounds(compounds).filter((compound) => !compound.deletedAt);
}

export function mergeCompoundLibrary(userCompounds: Compound[] = []): Compound[] {
  return [...referenceCompounds, ...getVisibleUserCompounds(userCompounds)];
}

export function createUserCompound(draft: UserCompoundDraft, createdAt = new Date()): Compound {
  const now = createdAt.toISOString();

  return {
    ...draft,
    source: 'user',
    curationStatus: 'draft',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncState: 'dirty',
  };
}

export function updateUserCompound(compound: Compound, updates: Partial<UserCompoundDraft>, updatedAt = new Date()): Compound {
  if (compound.source !== 'user') {
    return compound;
  }

  return {
    ...compound,
    ...updates,
    source: 'user',
    curationStatus: 'draft',
    updatedAt: updatedAt.toISOString(),
    syncState: 'dirty',
  };
}

export function softDeleteUserCompound(compound: Compound, deletedAt = new Date()): Compound {
  if (compound.source !== 'user') {
    return compound;
  }

  const timestamp = deletedAt.toISOString();

  return {
    ...compound,
    deletedAt: timestamp,
    updatedAt: timestamp,
    syncState: 'dirty',
  };
}
