import type { ReferenceCompound } from '../schema';

export const motsC: ReferenceCompound = {
  id: 'mots-c',
  name: 'MOTS-c',
  aliases: ['Mitochondrial open reading frame of the 12S rRNA-c', 'MOTS-c human'],
  compoundType: 'peptide',
  category: 'longevity',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-mots-c'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }, { value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A mitochondrial-derived peptide tracked in longevity and metabolic research contexts.',
  researcherDetails: 'MOTS-c is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied in mitochondrial signaling and metabolism-related pathways.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-mots-c',
      title: 'MOTS-c compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/146675088',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
