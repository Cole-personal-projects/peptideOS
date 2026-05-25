import type { ReferenceCompound } from '../schema';

export const thymosinAlpha1: ReferenceCompound = {
  id: 'thymosin-alpha-1',
  name: 'Thymosin Alpha-1',
  aliases: ['Thymalfasin', 'TA1', 'Talpha1'],
  compoundType: 'peptide',
  category: 'immune',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '1.6 mg lyophilized vial',
      totalAmount: { value: 1.6, unit: 'mg' },
      sourceNote: 'Identity and inventory preset for tracking; verify the actual vial label.',
      citationIds: ['pubchem-thymosin-alpha-1'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 1.6, unit: 'mg' }],
    typicalBacWaterMl: [1],
  },
  beginnerSummary: 'An immune-related peptide often referenced in thymosin alpha-1 research and tracking contexts.',
  researcherDetails: 'Thymosin alpha-1 is represented as a defined peptide compound in PubChem. PeptideOS includes identity metadata without protocol recommendations.',
  mechanism: 'Studied in immune modulation contexts involving T-cell and cytokine signaling pathways.',
  safety: 'Immune-active research compound. This entry is for logging context only and is not use guidance.',
  storage: 'Use product-specific storage instructions from the actual container label.',
  citations: [
    {
      id: 'pubchem-thymosin-alpha-1',
      title: 'Thymosin alpha 1 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16130571',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
