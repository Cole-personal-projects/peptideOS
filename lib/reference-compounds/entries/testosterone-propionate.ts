import type { ReferenceCompound } from '../schema';

export const testosteronePropionate: ReferenceCompound = {
  id: 'testosterone-propionate',
  name: 'Testosterone Propionate',
  aliases: ['Testosterone 17-propionate', 'Testosterone propanoate'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'im',
  supportedRoutes: ['im'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Concentration-based oil solution',
      concentration: { value: 100, unit: 'mg/ml' },
      sourceNote: 'Historical oil-solution concentration placeholder for logging; verify against the actual container label.',
      citationIds: ['pubchem-testosterone-propionate'],
    },
  ],
  beginnerSummary: 'A shorter ester testosterone compound tracked as a hormone/endocrine compound rather than a peptide.',
  researcherDetails: 'Testosterone propionate is an esterified testosterone compound. Reference metadata captures identity and concentration-compatible tracking fields without protocol guidance.',
  mechanism: 'Acts as an androgen receptor ligand after ester cleavage to testosterone.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on product labeling; keep product-specific label instructions attached to the actual container.',
  citations: [
    {
      id: 'pubchem-testosterone-propionate',
      title: 'Testosterone Propionate compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5995',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
