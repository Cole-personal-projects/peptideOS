import type { ReferenceCompound } from '../schema';

export const aicar: ReferenceCompound = {
  id: 'aicar',
  name: 'AICAR',
  aliases: ['Acadesine', 'ZMP riboside'],
  compoundType: 'small-molecule',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Labeled powder or capsule container',
      sourceNote: 'Reference container type only; amount and form must come from the actual product label.',
      citationIds: ['pubchem-aicar'],
    },
  ],
  beginnerSummary: 'A small molecule tracked in metabolic and AMPK-related research contexts.',
  researcherDetails: 'AICAR is represented as a small-molecule reference compound for identity, route, and container tracking metadata.',
  mechanism: 'Studied as an AMP analog in AMPK and energy-sensing pathway research.',
  safety: 'Research small molecule. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-aicar',
      title: 'AICAR compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/65110',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
