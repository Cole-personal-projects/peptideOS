import { describe, expect, test } from 'vitest';
import { libraryCategoryOptions } from './compound-display';
import { collectReferenceLibraryAuditIssues } from './reference-library-audit';
import { referenceCompounds } from './reference-compounds';

describe('reference library audit checks', () => {
  test('exposes every bundled reference category in Library filters', () => {
    const usedCategories = new Set(referenceCompounds.map((compound) => compound.category));
    const visibleCategories = new Set<string>(libraryCategoryOptions.filter((category) => category !== 'all' && category !== 'custom'));
    const missingCategories = [...usedCategories].filter((category) => !visibleCategories.has(category));

    expect(missingCategories).toEqual([]);
  });

  test('reports actionable quality issues for weak bundled reference metadata', () => {
    const valid = referenceCompounds[0];
    const weakEntry = {
      ...valid,
      id: 'weak-entry',
      beginnerSummary: `${valid.name} compound summary copied from PubChem.`,
      citations: [],
      dosePresets: [{
        label: 'Preset without source',
        value: 1,
        unit: valid.defaultDoseUnit,
        intent: 'loggingPreset',
        sourceNote: '',
        citationIds: ['missing-citation'],
      }],
      vialPresets: [{
        label: 'Vial without source',
        totalAmount: { value: 5, unit: 'mg' },
        sourceNote: '',
        citationIds: ['missing-citation'],
      }],
    } as typeof valid;

    expect(collectReferenceLibraryAuditIssues([weakEntry])).toEqual([
      'weak-entry: at least one citation is required',
      'weak-entry: dose preset "Preset without source" requires a source note',
      'weak-entry: dose preset "Preset without source" references missing citation "missing-citation"',
      'weak-entry: vial preset "Vial without source" requires a source note',
      'weak-entry: vial preset "Vial without source" references missing citation "missing-citation"',
      'weak-entry: copy contains third-party database boilerplate marker "copied from"',
    ]);
  });

  test('ships bundled reference compounds without audit issues', () => {
    expect(collectReferenceLibraryAuditIssues(referenceCompounds)).toEqual([]);
  });
});
