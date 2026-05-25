import type { ReferenceCompound } from '../schema';

export const selank: ReferenceCompound = {
  id: 'selank',
  name: 'Selank',
  aliases: ['Thr-Lys-Pro-Arg-Pro-Gly-Pro', 'Tuftsin analog Selank'],
  compoundType: 'peptide',
  category: 'cognitive',
  defaultRoute: 'intranasal',
  supportedRoutes: ['intranasal', 'subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Intranasal solution container',
      concentration: { value: 10, unit: 'mg/ml' },
      sourceNote: 'Concentration placeholder for inventory math only; verify against the actual container label.',
      citationIds: ['pubchem-selank'],
    },
  ],
  beginnerSummary: 'A peptide tracked in cognitive and neuropeptide research contexts.',
  researcherDetails: 'Selank is represented as a peptide reference compound for identity, route, and concentration-container tracking metadata.',
  mechanism: 'Studied as a tuftsin-related peptide analog in neuropeptide research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-selank',
      title: 'Selank compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/11765600',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
