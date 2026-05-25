import type { ReferenceCompound } from '../schema';

export const nadPlus: ReferenceCompound = {
  id: 'nad-plus',
  name: 'NAD+',
  aliases: ['Nicotinamide adenine dinucleotide', 'NAD plus'],
  compoundType: 'supplement',
  category: 'longevity',
  defaultRoute: 'oral',
  supportedRoutes: ['oral', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or labeled container',
      sourceNote: 'Reference container type only; amount and concentration must come from the actual product label.',
      citationIds: ['pubchem-nad-plus'],
    },
  ],
  beginnerSummary: 'A nicotinamide adenine dinucleotide entry tracked as an adjacent longevity and mitochondrial-support compound.',
  researcherDetails: 'NAD+ is represented as an adjacent compound reference for identity, route, and inventory metadata. Formulations vary widely and are not normalized here.',
  mechanism: 'Central redox cofactor involved in cellular metabolism and nucleotide-related pathways.',
  safety: 'Supplement/adjacent compound context varies by formulation and jurisdiction. This entry is for tracking metadata only.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-nad-plus',
      title: 'NAD+ compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5892',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
