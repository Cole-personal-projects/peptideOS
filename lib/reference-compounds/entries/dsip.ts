import type { ReferenceCompound } from '../schema';

export const dsip: ReferenceCompound = {
  id: 'dsip',
  name: 'DSIP',
  aliases: ['Delta Sleep-Inducing Peptide', 'Delta sleep inducing peptide'],
  compoundType: 'peptide',
  category: 'sleep',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'intranasal'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for tracking only; verify the actual vial label.',
      citationIds: ['pubchem-dsip'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A sleep-associated peptide tracked in sleep and neuropeptide research contexts.',
  researcherDetails: 'Delta sleep-inducing peptide is indexed by PubChem as a peptide compound. This entry supports categorization and local logging, not protocol guidance.',
  mechanism: 'Studied historically in sleep, stress, and neuroendocrine research contexts.',
  safety: 'Research peptide context. This entry is not medical advice or use guidance.',
  storage: 'Follow actual vial or material-label storage instructions.',
  citations: [
    {
      id: 'pubchem-dsip',
      title: 'Delta sleep-inducing peptide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/68816',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
