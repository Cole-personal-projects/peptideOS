import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { buildBundledReferenceSnapshot, validateReferenceSnapshot } from './reference-library-snapshot';

describe('reference library snapshot', () => {
  test('builds a valid bundled snapshot from reviewed reference compounds', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);

    expect(snapshot).toMatchObject({
      libraryVersion: expect.stringMatching(/^\d{4}\.\d{2}\.\d+$/),
      schemaVersion: 1,
      source: {
        kind: 'bundled',
        registry: 'peptideos-reference-registry',
      },
      validation: {
        policyVersion: 1,
        reviewedOnly: true,
      },
    });
    expect(snapshot.compounds).toHaveLength(referenceCompounds.length);
    expect(snapshot.citations.length).toBeGreaterThan(0);
    expect(validateReferenceSnapshot(snapshot)).toEqual([]);
  });

  test('rejects draft compounds, duplicate aliases, and missing indexed citations', () => {
    const valid = referenceCompounds[0];
    const invalidSnapshot = buildBundledReferenceSnapshot([
      valid,
      {
        ...referenceCompounds[1],
        aliases: [valid.name],
        curationStatus: 'draft',
      },
    ]);

    invalidSnapshot.citations = [];

    expect(validateReferenceSnapshot(invalidSnapshot)).toEqual(expect.arrayContaining([
      `snapshot: duplicate compound name or alias "${valid.name.toLowerCase()}"`,
      `${referenceCompounds[1].id}: app index only ships reviewed compounds`,
      `${referenceCompounds[1].id}: snapshot can only include reviewed compounds`,
      `${valid.id}: citation "${valid.citations[0].id}" is missing from snapshot citation index`,
    ]));
  });

  test('requires Supabase export snapshots to identify their export source', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);

    snapshot.source = {
      kind: 'supabase-export',
      registry: 'peptideos-reference-registry',
    };

    expect(validateReferenceSnapshot(snapshot)).toContain('snapshot: Supabase exports must identify exportedFrom');
  });
});
