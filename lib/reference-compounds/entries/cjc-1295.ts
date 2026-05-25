import type { ReferenceCompound } from '../schema';

export const cjc1295: ReferenceCompound = {
  id: 'cjc-1295',
  name: 'CJC-1295',
  aliases: ['Modified GRF 1-29', 'GRF 1-29 CJC1295'],
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
      citationIds: ['pubchem-cjc-1295'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 2, unit: 'mg' }, { value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A growth-hormone secretagogue peptide tracked in GH-axis research contexts.',
  researcherDetails: 'CJC-1295 is represented as a peptide reference compound for identity, vial, route, and logging metadata. PeptideOS does not encode protocol guidance for this entry.',
  mechanism: 'Studied as a growth-hormone-releasing hormone analog interacting with GHRH receptor signaling.',
  safety: 'Research peptide. Regulatory status and evidence base vary by context; this entry is for tracking metadata only.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-cjc-1295',
      title: 'CJC-1295 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/91971820',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
