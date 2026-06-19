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

  test('does not downgrade newer bundled generated records with stale released rows', () => {
    const staleAhkCuSnapshot = buildBundledReferenceSnapshot(referenceCompounds.map((compound) => (
      compound.id === 'ahk-cu'
        ? {
          ...compound,
          supportedRoutes: ['topical', 'subq'],
          concentrationMode: 'reconstituted',
          storage: 'Old generic storage text.',
          updatedAt: '2026-06-01',
          referenceProfile: {
            ...compound.referenceProfile!,
            evidenceTier: 'identity-only',
            biohackerBrief: {
              ...compound.referenceProfile!.biohackerBrief,
              headline: 'Old AHK-Cu identity-only headline.',
            },
          },
        } as typeof compound
        : compound
    )));
    const currentAhkCu = initialAppData.compounds.find((compound) => compound.id === 'ahk-cu');

    const nextData = applyReleasedReferenceLibrarySnapshot(initialAppData, staleAhkCuSnapshot);
    const nextAhkCu = nextData.compounds.find((compound) => compound.id === 'ahk-cu');

    expect(currentAhkCu?.updatedAt).toBe('2026-06-19');
    expect(nextAhkCu?.supportedRoutes).toEqual(['topical']);
    expect(nextAhkCu?.concentrationMode).toBe('none');
    expect(nextAhkCu?.referenceProfile?.evidenceTier).toBe('preclinical');
    expect(nextAhkCu?.referenceProfile?.biohackerBrief.headline).toBe(
      'Topical-first copper peptide with preclinical hair-follicle signal.',
    );
  });

  test('keeps newer bundled generated records that are missing from a stale released snapshot', () => {
    const staleSnapshotWithoutAhkCu = buildBundledReferenceSnapshot(
      referenceCompounds.filter((compound) => compound.id !== 'ahk-cu'),
    );

    const nextData = applyReleasedReferenceLibrarySnapshot(initialAppData, staleSnapshotWithoutAhkCu);
    const nextAhkCu = nextData.compounds.find((compound) => compound.id === 'ahk-cu');

    expect(nextAhkCu?.updatedAt).toBe('2026-06-19');
    expect(nextAhkCu?.referenceProfile?.biohackerBrief.headline).toBe(
      'Topical-first copper peptide with preclinical hair-follicle signal.',
    );
  });
});
