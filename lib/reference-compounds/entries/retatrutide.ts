import type { ReferenceCompound } from '../schema';

export const retatrutide: ReferenceCompound = {
  id: 'retatrutide',
  name: 'Retatrutide',
  aliases: ['LY3437943', 'Salkalli'],
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
      citationIds: ['dailymed-retatrutide'],
    },
  ],
  beginnerSummary: 'A metabolic incretin-class compound tracked in GLP-style logging contexts.',
  researcherDetails: 'Retatrutide is represented as a GLP-style reference compound with route and labeled-container metadata for tracking only.',
  mechanism: 'Studied as an incretin-pathway compound involving multiple metabolic receptor targets.',
  safety: 'Metabolic research compound context varies by product and jurisdiction. This entry is for tracking metadata only.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  citations: [
    {
      id: 'dailymed-retatrutide',
      title: 'DailyMed label candidates for Retatrutide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Retatrutide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
