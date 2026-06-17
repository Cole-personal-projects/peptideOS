import type { ReferenceLibrarySnapshot } from './reference-library-snapshot';
import { mergeCompoundLibrary } from './user-compounds';
import type { AppData } from './types';

export function applyReleasedReferenceLibrarySnapshot(data: AppData, snapshot: ReferenceLibrarySnapshot): AppData {
  return {
    ...data,
    compounds: mergeCompoundLibrary(data.compounds, snapshot.compounds),
  };
}
