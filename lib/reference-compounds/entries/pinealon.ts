import type { ReferenceCompound } from '../schema';

export const pinealon: ReferenceCompound = {
  id: 'pinealon',
  name: 'Pinealon',
  aliases: ['Glu-Asp-Arg', 'EDR peptide'],
  compoundType: 'peptide',
  category: 'cognitive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'intranasal'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg lyophilized vial',
      totalAmount: { value: 10, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-pinealon'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A short peptide tracked in cognitive and neuropeptide research contexts.',
  researcherDetails: 'Pinealon is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied as a short peptide in neuropeptide and cellular regulation research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-pinealon',
      title: 'Pinealon compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/10273502',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
