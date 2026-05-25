import type { ReferenceCompound } from '../schema';

export const metformin: ReferenceCompound = {
  id: 'metformin',
  name: 'Metformin',
  aliases: ['Metformin hydrochloride', 'Glucophage'],
  compoundType: 'small-molecule',
  category: 'metabolic',
  defaultRoute: 'oral',
  supportedRoutes: ['oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [],
  beginnerSummary: 'A metabolic small molecule often tracked alongside broader metabolic and longevity research compounds.',
  researcherDetails: 'Metformin is a defined small molecule with PubChem and DailyMed references. PeptideOS includes it as adjacent compound metadata rather than a peptide.',
  mechanism: 'Studied in metabolic contexts involving hepatic glucose production, insulin sensitivity, and AMPK-linked pathways.',
  safety: 'Prescription-drug class compound. This reference entry is not medical advice or use guidance.',
  storage: 'Storage depends on the product label and dosage form.',
  citations: [
    {
      id: 'pubchem-metformin',
      title: 'Metformin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/4091',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-metformin',
      title: 'METFORMIN label search',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Metformin',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
