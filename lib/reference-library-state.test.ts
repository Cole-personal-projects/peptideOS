import { describe, expect, test } from 'vitest';
import { initialAppData } from './mock-data';
import { referenceCompounds } from './reference-compounds';
import { applyReleasedReferenceLibrarySnapshot } from './reference-library-state';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';
import { createUserCompound } from './user-compounds';

describe('reference library app state', () => {
  test('replaces bundled reference compounds with a released snapshot while preserving user compounds', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds.map((compound) => (
      compound.id === 'retatrutide'
        ? { ...compound, beginnerSummary: 'Loaded from DB-backed released library.' }
        : compound
    )));
    const custom = createUserCompound({
      ...referenceCompounds[0],
      id: 'custom-stack-compound',
      name: 'Custom Stack Compound',
    });
    const currentData = {
      ...initialAppData,
      compounds: [...initialAppData.compounds, custom],
    };

    const nextData = applyReleasedReferenceLibrarySnapshot(currentData, snapshot);
    const retatrutide = nextData.compounds.find((compound) => compound.id === 'retatrutide');

    expect(retatrutide?.beginnerSummary).toBe('Loaded from DB-backed released library.');
    expect(nextData.compounds).toContain(custom);
    expect(nextData.compounds.filter((compound) => compound.id === 'custom-stack-compound')).toHaveLength(1);
  });
});
