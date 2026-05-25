import type { ReferenceCompound } from '../schema';

export const bremelanotide: ReferenceCompound = {
  id: 'bremelanotide',
  name: 'PT-141 / Bremelanotide',
  aliases: ['PT-141', 'Vyleesi'],
  compoundType: 'peptide',
  category: 'sexual-reproductive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Prefilled injector or labeled container',
      sourceNote: 'Reference container type only; amount and concentration must come from the actual product label.',
      citationIds: ['dailymed-bremelanotide'],
    },
  ],
  beginnerSummary: 'A melanocortin-pathway peptide tracked in sexual/reproductive compound logging contexts.',
  researcherDetails: 'Bremelanotide is represented as a peptide reference compound with identity, route, and labeled-container tracking metadata.',
  mechanism: 'Studied as a melanocortin receptor agonist.',
  safety: 'Prescription compound in some jurisdictions. This entry is for tracking metadata and is not treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  citations: [
    {
      id: 'pubchem-bremelanotide',
      title: 'Bremelanotide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9941379',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-bremelanotide',
      title: 'DailyMed label candidates for Bremelanotide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Bremelanotide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
