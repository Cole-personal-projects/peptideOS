import type { ReferenceCompound } from '../schema';

export const ipamorelin: ReferenceCompound = {
  id: 'ipamorelin',
  name: 'Ipamorelin',
  aliases: ['NNC 26-0161', 'Ipamorelin acetate'],
  compoundType: 'peptide',
  category: 'growth-hormone',
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
      citationIds: ['pubchem-ipamorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A ghrelin-receptor agonist peptide tracked in growth-hormone secretagogue research contexts.',
  researcherDetails: 'Ipamorelin is represented as a peptide reference compound for identity, route, vial, and logging metadata. This entry avoids dosing or protocol claims.',
  mechanism: 'Studied as a growth hormone secretagogue with ghrelin receptor activity.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-ipamorelin',
      title: 'Ipamorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9831659',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
