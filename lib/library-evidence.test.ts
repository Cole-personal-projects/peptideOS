import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { formatLibraryEvidenceFilter, getLibraryEvidenceDisplay } from './library-evidence';

describe('library evidence display', () => {
  test('labels Retatrutide as strong human evidence and investigational', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');

    expect(getLibraryEvidenceDisplay(retatrutide!)).toEqual(expect.objectContaining({
      filter: 'strong-human',
      tierLabel: 'Strong Human',
      statusLabel: 'Investigational',
      mechanismClass: 'GLP-1 / GIP / Glucagon',
    }));
  });

  test('labels DailyMed-backed compounds as approved label entries', () => {
    const semaglutide = referenceCompounds.find((compound) => compound.id === 'semaglutide');

    expect(getLibraryEvidenceDisplay(semaglutide!)).toEqual(expect.objectContaining({
      filter: 'approved-label',
      tierLabel: 'Approved Label',
      statusLabel: 'Label Backed',
    }));
  });

  test('formats evidence filter labels for the library controls', () => {
    expect(formatLibraryEvidenceFilter('all')).toBe('All evidence');
    expect(formatLibraryEvidenceFilter('early-emerging')).toBe('Early / Emerging');
  });
});
