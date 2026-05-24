import type { ReferenceCompound } from '../schema';

export const testosteroneEnanthate: ReferenceCompound = {
  id: 'testosterone-enanthate',
  name: 'Testosterone Enanthate',
  aliases: ['Testosterone heptanoate', 'Testosterone enantate'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'im',
  supportedRoutes: ['im', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: '200 mg/mL vial',
      concentration: { value: 200, unit: 'mg/ml' },
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-testosterone-enanthate'],
    },
  ],
  beginnerSummary: 'An injectable testosterone ester tracked as a hormone/endocrine compound rather than a peptide.',
  researcherDetails: 'Testosterone enanthate is an esterified testosterone preparation. Reference metadata focuses on identity, route, concentration units, and label-backed tracking fields.',
  mechanism: 'Acts as an androgen receptor ligand after ester cleavage to testosterone.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by manufacturer labeling; keep product-specific label instructions attached to the actual vial.',
  citations: [
    {
      id: 'dailymed-testosterone-enanthate',
      title: 'TESTOSTERONE ENANTHATE injection, solution label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=82a98132-9d5f-40a5-8c4f-f52f2a5de60e',
      source: 'DailyMed',
      year: 2025,
    },
    {
      id: 'pubchem-testosterone-enanthate',
      title: 'Testosterone enanthate compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9416',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
