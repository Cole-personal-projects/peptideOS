import type { ReferenceCompound } from '../schema';

export const tesamorelin: ReferenceCompound = {
  id: 'tesamorelin',
  name: 'Tesamorelin',
  aliases: ['Egrifta', 'GHRH 1-44'],
  compoundType: 'peptide',
  category: 'growth-hormone',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '1 mg lyophilized vial',
      totalAmount: { value: 1, unit: 'mg' },
      sourceNote: 'Container preset for label-oriented tracking; verify against the actual product label.',
      citationIds: ['dailymed-tesamorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 1, unit: 'mg' }, { value: 2, unit: 'mg' }],
    typicalBacWaterMl: [0.5, 1],
  },
  beginnerSummary: 'A synthetic GHRH analog tracked in growth-hormone axis and endocrine research contexts.',
  researcherDetails: 'Tesamorelin is represented as a peptide reference compound with identity and container metadata from public compound and label sources.',
  mechanism: 'Acts through growth-hormone-releasing hormone receptor signaling.',
  safety: 'Prescription/endocrine compound in some jurisdictions. This entry is for tracking metadata and is not treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-tesamorelin',
      title: 'Tesamorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16137828',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-tesamorelin',
      title: 'DailyMed label candidates for Tesamorelin',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Tesamorelin',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
