import type { ReferenceCompound } from '../schema';

export const sermorelin: ReferenceCompound = {
  id: 'sermorelin',
  name: 'Sermorelin',
  aliases: ['GRF 1-29', 'Sermorelin acetate'],
  compoundType: 'peptide',
  category: 'growth-hormone',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '2 mg lyophilized vial',
      totalAmount: { value: 2, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-sermorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 2, unit: 'mg' }, { value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A GHRH analog peptide tracked in growth-hormone axis research contexts.',
  researcherDetails: 'Sermorelin is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied as a growth-hormone-releasing hormone analog in GH-axis research.',
  safety: 'Peptide/endocrine compound context varies by jurisdiction. This entry supports tracking metadata only.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-sermorelin',
      title: 'Sermorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16132413',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
