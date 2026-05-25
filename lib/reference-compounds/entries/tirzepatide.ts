import type { ReferenceCompound } from '../schema';

export const tirzepatide: ReferenceCompound = {
  id: 'tirzepatide',
  name: 'Tirzepatide',
  aliases: ['Mounjaro', 'Zepbound'],
  compoundType: 'glp-1',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Prefilled pen or labeled container',
      sourceNote: 'Reference container type only; concentration and amount must come from the actual product label.',
      citationIds: ['dailymed-tirzepatide'],
    },
  ],
  beginnerSummary: 'A metabolic incretin-class compound tracked in GLP-style logging contexts.',
  researcherDetails: 'Tirzepatide is represented as a GLP-style reference compound with identity, route, and labeled-container metadata for tracking only.',
  mechanism: 'Studied as an incretin receptor agonist involving GIP and GLP-1 receptor pathways.',
  safety: 'Prescription metabolic compound in many jurisdictions. This entry is for tracking metadata and is not treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  citations: [
    {
      id: 'pubchem-tirzepatide',
      title: 'Tirzepatide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/166567236',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-tirzepatide',
      title: 'DailyMed label candidates for Tirzepatide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Tirzepatide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
