import type { ReferenceCompound } from '../schema';

export const testosteroneCypionate: ReferenceCompound = {
  id: 'testosterone-cypionate',
  name: 'Testosterone Cypionate',
  aliases: ['Testosterone cyclopentylpropionate', 'Depo-Testosterone'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'im',
  supportedRoutes: ['im'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: '200 mg/mL multi-dose vial',
      concentration: { value: 200, unit: 'mg/ml' },
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-testosterone-cypionate'],
    },
  ],
  beginnerSummary: 'An injectable testosterone ester tracked as a hormone/endocrine compound rather than a peptide.',
  researcherDetails: 'Testosterone cypionate is an esterified testosterone preparation. Reference metadata focuses on identity, route, concentration units, and label-backed tracking fields.',
  mechanism: 'Acts as an androgen receptor ligand after ester cleavage to testosterone.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by manufacturer labeling; keep product-specific label instructions attached to the actual vial.',
  citations: [
    {
      id: 'dailymed-testosterone-cypionate',
      title: 'TESTOSTERONE CYPIONATE injection, solution label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3653a602-4551-4e6c-84a7-31861f5dc482',
      source: 'DailyMed',
      year: 2025,
    },
    {
      id: 'pubchem-testosterone-cypionate',
      title: 'Testosterone Cypionate compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/441404',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
