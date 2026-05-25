import type { ReferenceCompound } from '../schema';

export const semax: ReferenceCompound = {
  id: 'semax',
  name: 'Semax',
  aliases: ['ACTH 4-7 Pro-Gly-Pro', 'MEHFPGP'],
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
      citationIds: ['pubchem-semax'],
    },
  ],
  beginnerSummary: 'A peptide tracked in cognitive and neuropeptide research contexts.',
  researcherDetails: 'Semax is represented as a peptide reference compound for identity, route, and concentration-container tracking metadata.',
  mechanism: 'Studied as an ACTH fragment analog in neuropeptide and cognitive research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-semax',
      title: 'Semax compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9811102',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
