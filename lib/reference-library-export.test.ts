import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import {
  buildReferenceLibrarySnapshotFromRegistrySeed,
  validateReferenceRegistrySeedForExport,
} from './reference-library-export';
import { buildBundledReferenceSnapshot, validateReferenceSnapshot } from './reference-library-snapshot';
import { buildReferenceRegistrySeed } from './reference-registry-seed';

describe('reference library export pipeline', () => {
  test('reconstructs a bundled-compatible snapshot from reviewed registry rows', () => {
    const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const seed = buildReferenceRegistrySeed(bundledSnapshot);

    const exported = buildReferenceLibrarySnapshotFromRegistrySeed(seed, {
      exportedAt: '2026-06-17T00:00:00.000Z',
      exportedFrom: 'test-registry',
    });

    expect(validateReferenceSnapshot(exported)).toEqual([]);
    expect(exported).toEqual(expect.objectContaining({
      libraryVersion: bundledSnapshot.libraryVersion,
      schemaVersion: 1,
      exportedAt: '2026-06-17T00:00:00.000Z',
      source: {
        kind: 'supabase-export',
        registry: 'peptideos-reference-registry',
        exportedFrom: 'test-registry',
      },
      validation: {
        policyVersion: 1,
        reviewedOnly: true,
      },
    }));

    const retatrutide = exported.compounds.find((compound) => compound.id === 'retatrutide');
    const tirzepatide = exported.compounds.find((compound) => compound.id === 'tirzepatide');

    expect(retatrutide?.referenceProfile?.biohackerBrief.headline).toContain('triple-agonist');
    expect(retatrutide?.referenceProfile?.clinicalEvidence.some((evidence) => (
      evidence.sourceQuality === 'trial-registry'
      && evidence.limitations?.includes('topline')
    ))).toBe(true);
    expect(tirzepatide?.actionableProfile).toEqual(expect.objectContaining({
      primaryActions: expect.arrayContaining([
        'Add the exact labeled container or pen to inventory',
      ]),
      verifyBeforeUse: expect.arrayContaining([
        'Container label, lot, expiration, strength, and route',
      ]),
      transparencyFlags: expect.arrayContaining([
        'Approved-label or label-adjacent citations may describe a regulated product, not an unlabeled research item.',
      ]),
    }));
  });

  test('reports release and content block problems before export', () => {
    const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const seed = buildReferenceRegistrySeed(bundledSnapshot);
    const brokenSeed = {
      ...seed,
      releaseItems: [
        ...seed.releaseItems,
        {
          release_version: seed.libraryRelease.release_version,
          compound_slug: 'retatrutide',
          content_block_id: 'missing-content-block',
          sort_order: 999,
        },
      ],
    };

    expect(validateReferenceRegistrySeedForExport(brokenSeed)).toEqual(expect.arrayContaining([
      'release 2026.05.0: release item references missing content block "missing-content-block"',
    ]));
  });
});
