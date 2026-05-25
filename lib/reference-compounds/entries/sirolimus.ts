import type { ReferenceCompound } from '../schema';

export const sirolimus: ReferenceCompound = {
  id: 'sirolimus',
  name: 'Sirolimus',
  aliases: ['Rapamycin', 'Rapamune'],
  compoundType: 'small-molecule',
  category: 'longevity',
  defaultRoute: 'oral',
  supportedRoutes: ['oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [],
  beginnerSummary: 'A small-molecule mTOR inhibitor often tracked in longevity and immunology research contexts.',
  researcherDetails: 'Sirolimus is a defined small molecule with PubChem and DailyMed label references. PeptideOS tracks it as a non-peptide reference compound.',
  mechanism: 'Known for mTOR pathway inhibition in approved drug and research contexts.',
  safety: 'Prescription-drug class compound with significant safety considerations; this entry is not treatment guidance.',
  storage: 'Storage varies by product form and label; follow the specific product label.',
  citations: [
    {
      id: 'pubchem-sirolimus',
      title: 'Sirolimus compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5284616',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-sirolimus',
      title: 'SIROLIMUS label search',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Sirolimus',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
