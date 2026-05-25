import type { ReferenceCompound } from '../schema';

export const kisspeptin10: ReferenceCompound = {
  id: 'kisspeptin-10',
  name: 'Kisspeptin-10',
  aliases: ['Metastin 45-54', 'KP-10'],
  compoundType: 'peptide',
  category: 'sexual-reproductive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Common tracking preset for inventory math; verify against the actual vial label.',
      citationIds: ['pubchem-kisspeptin-10'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A kisspeptin fragment tracked in reproductive-axis research contexts.',
  researcherDetails: 'Kisspeptin-10 is a short peptide indexed by PubChem. PeptideOS treats it as sexual/reproductive reference metadata for local logging only.',
  mechanism: 'Studied as a kisspeptin receptor ligand related to hypothalamic-pituitary-gonadal axis signaling.',
  safety: 'Research peptide context. This entry does not provide administration or treatment guidance.',
  storage: 'Follow the storage instructions on the actual material label.',
  citations: [
    {
      id: 'pubchem-kisspeptin-10',
      title: 'Kisspeptin-10 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/25240297',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
