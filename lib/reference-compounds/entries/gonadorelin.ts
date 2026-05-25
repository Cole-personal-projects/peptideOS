import type { ReferenceCompound } from '../schema';

export const gonadorelin: ReferenceCompound = {
  id: 'gonadorelin',
  name: 'Gonadorelin',
  aliases: ['GnRH', 'Gonadorelin hydrochloride'],
  compoundType: 'peptide',
  category: 'sexual-reproductive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'im'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Labeled vial',
      sourceNote: 'Container preset for label-oriented tracking; verify route, amount, and concentration from the actual product label.',
      citationIds: ['dailymed-gonadorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 1, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A gonadotropin-releasing hormone peptide tracked in reproductive/endocrine contexts.',
  researcherDetails: 'Gonadorelin is represented as a peptide reference compound with identity, route, vial, and label-candidate metadata.',
  mechanism: 'Acts through gonadotropin-releasing hormone receptor signaling.',
  safety: 'Endocrine compound context varies by product and jurisdiction. This entry is for tracking metadata only.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'pubchem-gonadorelin',
      title: 'Gonadorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/638793',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-gonadorelin',
      title: 'DailyMed label candidates for Gonadorelin',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Gonadorelin',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
