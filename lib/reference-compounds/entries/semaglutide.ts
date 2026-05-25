import type { ReferenceCompound } from '../schema';

export const semaglutide: ReferenceCompound = {
  id: 'semaglutide',
  name: 'Semaglutide',
  aliases: ['Ozempic', 'Wegovy', 'Rybelsus'],
  compoundType: 'glp-1',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Prefilled pen or labeled container',
      sourceNote: 'Reference container type only; concentration and amount must come from the actual product label.',
      citationIds: ['dailymed-semaglutide'],
    },
  ],
  beginnerSummary: 'A GLP-1 receptor agonist compound tracked in metabolic and weight-management logging contexts.',
  researcherDetails: 'Semaglutide is represented as a GLP-1 class compound with identity, route, and labeled-container tracking metadata. PeptideOS does not encode dosing guidance.',
  mechanism: 'GLP-1 receptor agonist activity is associated with incretin signaling pathways.',
  safety: 'Prescription metabolic compound in many jurisdictions. This entry is for tracking metadata and is not treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  citations: [
    {
      id: 'pubchem-semaglutide',
      title: 'Semaglutide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/56843331',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-semaglutide',
      title: 'DailyMed label candidates for Semaglutide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Semaglutide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
