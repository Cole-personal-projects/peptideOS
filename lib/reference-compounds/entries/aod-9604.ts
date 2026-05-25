import type { ReferenceCompound } from '../schema';

export const aod9604: ReferenceCompound = {
  id: 'aod-9604',
  name: 'AOD-9604',
  aliases: ['AOD 9604', 'Tyr-hGH 177-191'],
  compoundType: 'peptide',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-aod-9604'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A growth-hormone fragment peptide tracked in metabolic research contexts.',
  researcherDetails: 'AOD-9604 is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied as a peptide fragment related to growth hormone sequence research.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-aod-9604',
      title: 'AOD-9604 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/71300630',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
