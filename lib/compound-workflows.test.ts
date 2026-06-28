import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import {
  getAllowedWorkflowDoseUnits,
  getTrackableCompounds,
  getWorkflowDosePresets,
  isReconstitutableCompound,
} from './compound-workflows';
import type { AppData, Compound, Peptide } from './types';

const legacyPeptide: Peptide = {
  id: 'hgh',
  name: 'hGH (Somatropin)',
  category: 'growth',
  defaultRoute: 'subq',
  halfLifeHours: 3,
  beginnerSummary: 'Legacy hGH peptide.',
  researcherDetails: 'Legacy hGH details.',
  mechanism: 'GH signaling.',
  protocols: ['2 IU daily'],
  safety: 'Research use only.',
  storage: 'Refrigerate.',
  citations: [],
};

const customCompound: Compound = {
  id: 'custom-focus',
  name: 'Custom Focus',
  aliases: [],
  compoundType: 'small-molecule',
  category: 'cognitive',
  defaultRoute: 'oral',
  supportedRoutes: ['oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [
    {
      label: 'Focus 10 mg',
      value: 10,
      unit: 'mg',
      intent: 'loggingPreset',
      sourceNote: 'User preset.',
      citationIds: [],
    },
  ],
  vialPresets: [],
  beginnerSummary: 'Custom focus tracker.',
  researcherDetails: 'Custom focus details.',
  safety: 'User notes.',
  storage: 'User storage.',
  citations: [],
  source: 'user',
  curationStatus: 'draft',
};

const appData = {
  peptides: [legacyPeptide],
  compounds: [...referenceCompounds, customCompound],
} as AppData;

describe('compound workflow adapter', () => {
  test('combines legacy peptides with bundled and custom compounds without duplicate ids', () => {
    const trackable = getTrackableCompounds(appData);

    expect(trackable.map((compound) => compound.id)).toEqual(expect.arrayContaining([
      'hgh',
      'hgh-somatropin',
      'testosterone-cypionate',
      'custom-focus',
    ]));
    expect(trackable.filter((compound) => compound.id === 'hgh')).toHaveLength(1);
  });

  test('uses compound-native dose units and preserves legacy IU behavior', () => {
    const trackable = getTrackableCompounds(appData);

    expect(getAllowedWorkflowDoseUnits(trackable.find((compound) => compound.id === 'hgh'))).toEqual(['iu', 'mg', 'mcg']);
    expect(getAllowedWorkflowDoseUnits(trackable.find((compound) => compound.id === 'testosterone-cypionate'))).toEqual(['mg', 'mcg']);
    expect(getAllowedWorkflowDoseUnits(trackable.find((compound) => compound.id === 'custom-focus'))).toEqual(['mg', 'mcg']);
  });

  test('surfaces legacy and custom dose presets for logging', () => {
    const trackable = getTrackableCompounds(appData);

    expect(getWorkflowDosePresets(trackable.find((compound) => compound.id === 'hgh')).map((preset) => preset.label)).toContain('hGH 2 IU (beginner)');
    expect(getWorkflowDosePresets(trackable.find((compound) => compound.id === 'custom-focus'))).toEqual([
      { id: 'custom-focus-preset-0', label: 'Focus 10 mg', doseValue: 10, doseUnit: 'mg' },
    ]);
  });

  test('marks only reconstituted-compatible compounds for vial reconstitution', () => {
    const trackable = getTrackableCompounds(appData);

    expect(isReconstitutableCompound(trackable.find((compound) => compound.id === 'bpc-157'))).toBe(true);
    expect(isReconstitutableCompound(trackable.find((compound) => compound.id === 'custom-focus'))).toBe(false);
    expect(isReconstitutableCompound(undefined)).toBe(false);
  });
  test('returns compounds alphabetically by display name', () => {
    const names = getTrackableCompounds(appData).map((compound) => compound.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
  });
});
