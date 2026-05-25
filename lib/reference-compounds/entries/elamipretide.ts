import type { ReferenceCompound } from '../schema';

export const elamipretide: ReferenceCompound = {
  id: 'elamipretide',
  name: 'Elamipretide',
  aliases: ['SS-31', 'MTP-131', 'Bendavia'],
  compoundType: 'peptide',
  category: 'longevity',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg lyophilized vial',
      totalAmount: { value: 10, unit: 'mg' },
      sourceNote: 'Inventory preset for research tracking; verify against the actual container label.',
      citationIds: ['pubchem-elamipretide'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A mitochondria-targeted tetrapeptide commonly tracked in longevity and mitochondrial research contexts.',
  researcherDetails: 'Elamipretide is indexed by PubChem as a defined peptide compound. PeptideOS models it as a reference compound for identity, route, and inventory logging only.',
  mechanism: 'Studied for interactions with mitochondrial inner-membrane biology and cardiolipin-associated pathways.',
  safety: 'Research compound context. This entry is not medical advice or use guidance.',
  storage: 'Storage should follow the actual product or study-material label attached to the vial.',
  citations: [
    {
      id: 'pubchem-elamipretide',
      title: 'Elamipretide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/11764719',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
