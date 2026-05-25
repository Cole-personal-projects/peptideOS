import type { ReferenceCompound } from '../schema';

export const dihexa: ReferenceCompound = {
  id: 'dihexa',
  name: 'Dihexa',
  aliases: ['N-hexanoic-Tyr-Ile aminohexanoic amide', 'PNB-0408'],
  compoundType: 'small-molecule',
  category: 'cognitive',
  defaultRoute: 'oral',
  supportedRoutes: ['oral', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or powder container',
      sourceNote: 'Reference container type only; amount and form must come from the actual product label.',
      citationIds: ['pubchem-dihexa'],
    },
  ],
  beginnerSummary: 'A small molecule tracked in cognitive and neurotrophic research contexts.',
  researcherDetails: 'Dihexa is represented as a small-molecule reference compound for identity, route, and container tracking metadata.',
  mechanism: 'Studied in neurotrophic and hepatocyte growth factor pathway research contexts.',
  safety: 'Research small molecule. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-dihexa',
      title: 'Dihexa compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/129010512',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
