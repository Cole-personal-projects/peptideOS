import type { ReferenceCompound } from '../schema';

export const tb500: ReferenceCompound = {
  id: 'tb-500',
  name: 'TB-500 / Thymosin Beta-4',
  aliases: ['TB-500', 'Thymosin beta-4', 'Tbeta4'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Common vial-size preset for inventory math; verify against the actual container label.',
      citationIds: ['pmc-thymosin-beta4-wound-healing'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A thymosin beta-4 related peptide reference entry for healing/recovery tracking contexts.',
  researcherDetails: 'Thymosin beta-4 is a 43-amino-acid peptide studied in wound repair and tissue-regeneration models. TB-500 naming is tracked as a practical alias for user logging.',
  mechanism: 'Studied for actin-binding, cell migration, angiogenesis, and repair signaling roles in wound models.',
  safety: 'Research peptide. This reference entry supports tracking context only and does not provide use guidance.',
  storage: 'Lyophilized research peptides are commonly tracked with vial-specific storage notes; follow the actual container label.',
  citations: [
    {
      id: 'pmc-thymosin-beta4-wound-healing',
      title: 'Research advances on thymosin beta 4 in promoting wound healing',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11704510/',
      source: 'PMC',
      year: 2022,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
