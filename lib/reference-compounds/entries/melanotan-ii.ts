import type { ReferenceCompound } from '../schema';

export const melanotanIi: ReferenceCompound = {
  id: 'melanotan-ii',
  name: 'Melanotan II',
  aliases: ['MT-II', 'Melanotan 2'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg lyophilized vial',
      totalAmount: { value: 10, unit: 'mg' },
      sourceNote: 'Inventory preset for tracking only; verify against the actual container label.',
      citationIds: ['pubchem-melanotan-ii'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A melanocortin peptide commonly referenced in skin-pigmentation research contexts.',
  researcherDetails: 'Melanotan II is a cyclic peptide indexed by PubChem. PeptideOS models it as a skin/hair category research compound without use instructions.',
  mechanism: 'Studied as a melanocortin receptor agonist in pigmentation and related research contexts.',
  safety: 'Research peptide context with nontrivial safety considerations; this entry is not use guidance.',
  storage: 'Use the storage instructions provided with the actual material.',
  citations: [
    {
      id: 'pubchem-melanotan-ii',
      title: 'Melanotan II compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/92432',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
