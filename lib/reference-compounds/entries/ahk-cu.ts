import type { ReferenceCompound } from '../schema';

export const ahkCu: ReferenceCompound = {
  id: 'ahk-cu',
  name: 'AHK-Cu',
  aliases: ['Copper peptide AHK-Cu', 'Ala-His-Lys copper complex'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'topical',
  supportedRoutes: ['topical', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '50 mg lyophilized vial',
      totalAmount: { value: 50, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-ahk-cu'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 50, unit: 'mg' }],
    typicalBacWaterMl: [2, 5],
  },
  beginnerSummary: 'A copper-binding peptide tracked in skin and hair research contexts.',
  researcherDetails: 'AHK-Cu is represented as a peptide reference compound with identity, route, and vial metadata for tracking only.',
  mechanism: 'Studied as a copper peptide in skin, hair, and extracellular-matrix research contexts.',
  safety: 'Research peptide. Topical and injectable contexts are distinct; this entry is not medical advice or use guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-ahk-cu',
      title: 'AHK-Cu compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/168431292',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
