import type { ReferenceCompound } from '../schema';

export const ghkCu: ReferenceCompound = {
  id: 'ghk-cu',
  name: 'GHK-Cu',
  aliases: ['Copper peptide GHK-Cu', 'Glycyl-L-histidyl-L-lysine copper', 'Copper tripeptide-1'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'topical'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '50 mg lyophilized vial',
      totalAmount: { value: 50, unit: 'mg' },
      sourceNote: 'Common vial-size preset for inventory math; verify against the actual container label.',
      citationIds: ['pmc-ghk-cu-skin-regeneration'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 50, unit: 'mg' }],
    typicalBacWaterMl: [2, 5],
  },
  beginnerSummary: 'A copper-binding tripeptide commonly tracked in skin, hair, and tissue-repair research contexts.',
  researcherDetails: 'GHK-Cu is a glycyl-histidyl-lysine copper complex discussed in dermatology and tissue-remodeling literature. This entry supports identity, route, and vial tracking metadata.',
  mechanism: 'Studied for copper binding, extracellular matrix remodeling, collagen-related signaling, and skin-regeneration pathways.',
  safety: 'Research peptide. Topical and injectable contexts are distinct; this entry is not medical advice or use guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual vial.',
  citations: [
    {
      id: 'pmc-ghk-cu-skin-regeneration',
      title: 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4508379/',
      source: 'PMC',
      year: 2015,
    },
    {
      id: 'pmc-ghk-cu-anti-aging',
      title: 'The potential of GHK as an anti-aging peptide',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8789089/',
      source: 'PMC',
      year: 2022,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
