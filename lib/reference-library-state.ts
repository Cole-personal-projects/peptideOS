import type { ReferenceLibrarySnapshot } from './reference-library-snapshot';
import { mergeCompoundLibrary } from './user-compounds';
import type { AppData, Compound } from './types';

export function applyReleasedReferenceLibrarySnapshot(data: AppData, snapshot: ReferenceLibrarySnapshot): AppData {
  const currentReferenceCompoundsById = new Map(
    data.compounds
      .filter((compound) => compound.source === 'bundled')
      .map((compound) => [compound.id, compound]),
  );
  const releasedCompoundIds = new Set(snapshot.compounds.map((compound) => compound.id));
  const releaseCompounds = snapshot.compounds.map((releasedCompound) => {
    const currentCompound = currentReferenceCompoundsById.get(releasedCompound.id);
    return shouldPreserveCurrentReferenceCompound(currentCompound, releasedCompound)
      ? currentCompound
      : releasedCompound;
  });
  const currentOnlyGeneratedCompounds = [...currentReferenceCompoundsById.values()].filter((compound) => (
    !releasedCompoundIds.has(compound.id) && parseReferenceTimestamp(compound.updatedAt) !== null
  ));

  return {
    ...data,
    compounds: mergeCompoundLibrary(data.compounds, [...releaseCompounds, ...currentOnlyGeneratedCompounds]),
  };
}

function shouldPreserveCurrentReferenceCompound(currentCompound: Compound | undefined, releasedCompound: Compound): currentCompound is Compound {
  if (!currentCompound) return false;
  if (currentCompound.source !== 'bundled') return false;

  const currentUpdatedAt = parseReferenceTimestamp(currentCompound.updatedAt);
  const releasedUpdatedAt = parseReferenceTimestamp(releasedCompound.updatedAt);

  if (currentUpdatedAt === null) return false;
  if (releasedUpdatedAt === null) return true;

  return currentUpdatedAt > releasedUpdatedAt;
}

function parseReferenceTimestamp(value: string | undefined): number | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}
