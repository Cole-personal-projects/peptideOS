import type { ReferenceCompound } from '../schema';

export const ll37: ReferenceCompound = {
  id: 'll-37',
  name: 'LL-37',
  aliases: ['Cathelicidin LL-37', 'hCAP-18 peptide fragment'],
  compoundType: 'peptide',
  category: 'immune',
  defaultRoute: 'topical',
  supportedRoutes: ['topical', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-ll-37'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'An antimicrobial cathelicidin peptide tracked in immune and skin-barrier research contexts.',
  researcherDetails: 'LL-37 is represented as a peptide reference compound with identity and vial metadata for research tracking only.',
  mechanism: 'Studied in innate immune signaling, antimicrobial activity, and epithelial barrier contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-ll-37',
      title: 'LL-37 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16198951',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
