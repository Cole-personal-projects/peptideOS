import type { ReferenceCompound } from '../schema';

export const oxytocin: ReferenceCompound = {
  id: 'oxytocin',
  name: 'Oxytocin',
  aliases: ['Pitocin'],
  compoundType: 'hormone',
  category: 'sexual-reproductive',
  defaultRoute: 'im',
  supportedRoutes: ['im'],
  defaultDoseUnit: 'iu',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 USP units/mL injection',
      concentration: { value: 10, unit: 'iu/ml' },
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-oxytocin'],
    },
  ],
  beginnerSummary: 'A peptide hormone tracked in reproductive and endocrine contexts.',
  researcherDetails: 'Oxytocin is represented with PubChem identity metadata and DailyMed label context. PeptideOS models it as a hormone reference record.',
  mechanism: 'Acts through oxytocin receptors in reproductive, lactation, and neuroendocrine contexts.',
  safety: 'Hormone/endocrine compound with clinical safety constraints; this entry is not use guidance.',
  storage: 'Follow product-specific label storage instructions.',
  citations: [
    {
      id: 'pubchem-oxytocin',
      title: 'Oxytocin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/439302',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-oxytocin',
      title: 'PITOCIN (OXYTOCIN) injection label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6e5a66fc-e507-497c-b5ce-44a8c95898ad',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
