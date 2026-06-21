import { describe, expect, test } from 'vitest';
import { getLibraryCollection, getLibraryCollectionCompounds, getVisibleLibraryCollectionSummaries } from './library-collections';
import { referenceCompounds } from './reference-compounds';
import type { Compound } from './types';

describe('library collections', () => {
  test('resolves GLP-1 from compound type rather than optional library classification', () => {
    const collection = getLibraryCollection('glp-1');

    expect(collection).toEqual(expect.objectContaining({
      kind: 'compound-type',
      value: 'glp-1',
    }));
    expect(getLibraryCollectionCompounds(referenceCompounds, collection!).map((compound) => compound.id).sort()).toEqual([
      'retatrutide',
      'semaglutide',
      'tirzepatide',
    ]);
  });

  test('resolves standard collections from compound category', () => {
    const collection = getLibraryCollection('metabolic');
    const metabolicCompounds = getLibraryCollectionCompounds(referenceCompounds, collection!);

    expect(collection).toEqual(expect.objectContaining({
      kind: 'category',
      value: 'metabolic',
    }));
    expect(metabolicCompounds.length).toBeGreaterThan(3);
    expect(metabolicCompounds.every((compound) => compound.category === 'metabolic')).toBe(true);
  });

  test('omits empty collections from visible summaries', () => {
    const compounds = referenceCompounds.filter((compound) => compound.category !== 'sleep');
    const summaries = getVisibleLibraryCollectionSummaries(compounds);

    expect(summaries.map((summary) => summary.slug)).not.toContain('sleep');
  });

  test('does not expose deleted compounds in collection counts', () => {
    const compounds: Compound[] = referenceCompounds.map((compound) => (
      compound.id === 'retatrutide' ? { ...compound, deletedAt: '2026-06-20T00:00:00.000Z' } : compound
    ));
    const collection = getLibraryCollection('glp-1');

    expect(getLibraryCollectionCompounds(compounds, collection!).map((compound) => compound.id).sort()).toEqual([
      'semaglutide',
      'tirzepatide',
    ]);
  });

  test('returns no collection for unknown slugs', () => {
    expect(getLibraryCollection('unknown-collection')).toBeUndefined();
  });
});
