import type { ReferenceCompound } from '../schema';

export const bpc157: ReferenceCompound = {
  id: 'bpc-157',
  name: 'BPC-157',
  aliases: ['Body Protection Compound 157', 'Pentadecapeptide BPC 157', 'PL 14736'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'oral'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Common vial-size preset for inventory math; verify against the actual container label.',
      citationIds: ['pmc-bpc157-wound-healing'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A synthetic pentadecapeptide commonly tracked in healing/recovery research contexts.',
  researcherDetails: 'BPC-157 is described in preclinical literature as a stable gastric pentadecapeptide. PeptideOS treats it as a research compound reference entry for logging and inventory only.',
  mechanism: 'Studied in tissue-repair models with proposed links to vascular, nitric oxide, and cytoprotective pathways.',
  safety: 'Research peptide. Human evidence and regulatory status vary; this entry is not medical advice or use guidance.',
  storage: 'Lyophilized research peptides are commonly tracked with vial-specific storage notes; follow the actual container label.',
  citations: [
    {
      id: 'pmc-bpc157-wound-healing',
      title: 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8275860/',
      source: 'PMC',
      year: 2021,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
