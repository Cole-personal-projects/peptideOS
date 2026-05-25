import type { ReferenceCompound } from '../schema';

export const kpv: ReferenceCompound = {
  id: 'kpv',
  name: 'KPV',
  aliases: ['Lys-Pro-Val', 'L-Lysyl-L-prolyl-L-valine'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'oral',
  supportedRoutes: ['oral', 'topical'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or labeled container',
      sourceNote: 'Reference container type only; amount and form must come from the actual product label.',
      citationIds: ['pubchem-kpv'],
    },
  ],
  beginnerSummary: 'A short tripeptide tracked in healing and inflammation-adjacent research contexts.',
  researcherDetails: 'KPV is represented as a peptide reference compound for identity, route, and container tracking metadata. PeptideOS does not encode protocol guidance for this entry.',
  mechanism: 'Studied as a short peptide motif in inflammation and barrier-related research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-kpv',
      title: 'Lys-Pro-Val compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/125672',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
