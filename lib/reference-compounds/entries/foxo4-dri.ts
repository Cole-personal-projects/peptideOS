import type { ReferenceCompound } from '../schema';

export const foxo4Dri: ReferenceCompound = {
  id: 'foxo4-dri',
  name: 'FOXO4-DRI',
  aliases: ['FOXO4 D-retro-inverso peptide', 'FOXO4-DRI peptide'],
  compoundType: 'peptide',
  category: 'longevity',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for tracking only; verify against the actual vial label.',
      citationIds: ['pubchem-foxo4-dri'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A senescence-research peptide commonly tracked in longevity research contexts.',
  researcherDetails: 'FOXO4-DRI is indexed by PubChem as a defined peptide compound. PeptideOS tracks identity and inventory metadata only.',
  mechanism: 'Studied in cellular senescence research contexts involving FOXO4 and p53 interaction pathways.',
  safety: 'Research peptide context. This entry is not medical advice or use guidance.',
  storage: 'Follow the actual vial or material-label storage instructions.',
  citations: [
    {
      id: 'pubchem-foxo4-dri',
      title: 'FOXO4-DRI compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/167312269',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
