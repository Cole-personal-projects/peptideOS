import type { ReferenceCompound } from '../schema';

export const epitalon: ReferenceCompound = {
  id: 'epitalon',
  name: 'Epitalon',
  aliases: ['Epithalon', 'Ala-Glu-Asp-Gly'],
  compoundType: 'peptide',
  category: 'longevity',
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
      citationIds: ['pubchem-epitalon'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A tetrapeptide tracked in longevity and aging-research contexts.',
  researcherDetails: 'Epitalon is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied in aging-related cellular and peptide bioregulation research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-epitalon',
      title: 'Epitalon compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/219042',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
