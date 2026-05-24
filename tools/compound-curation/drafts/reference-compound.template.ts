import type { ReferenceCompound } from '../../../lib/reference-compounds/schema';

export const exampleCompound: ReferenceCompound = {
  id: 'example-compound',
  name: 'Example Compound',
  aliases: ['Example Alias'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'Draft summary for reviewer completion.',
  researcherDetails: 'Draft details for reviewer completion.',
  safety: 'Draft safety context for tracking only.',
  storage: 'Draft storage context from source facts.',
  citations: [
    {
      id: 'source-id',
      title: 'Source title',
      url: 'https://example.com/source',
      source: 'Source name',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
