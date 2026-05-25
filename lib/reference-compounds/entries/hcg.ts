import type { ReferenceCompound } from '../schema';

export const hcg: ReferenceCompound = {
  id: 'hcg',
  name: 'HCG',
  aliases: ['Human chorionic gonadotropin', 'Chorionic gonadotropin'],
  compoundType: 'biologic',
  category: 'sexual-reproductive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'im'],
  defaultDoseUnit: 'iu',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5,000 IU lyophilized vial',
      totalAmount: { value: 5000, unit: 'iu' },
      sourceNote: 'Inventory preset for IU-labeled container tracking; verify against the actual vial label.',
      citationIds: ['dailymed-hcg'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5000, unit: 'iu' }, { value: 10000, unit: 'iu' }],
    typicalBacWaterMl: [1, 2, 5],
  },
  beginnerSummary: 'A chorionic gonadotropin biologic tracked in reproductive/endocrine logging contexts.',
  researcherDetails: 'HCG is represented as an IU-primary biologic reference compound with route, vial, and inventory metadata.',
  mechanism: 'Acts through luteinizing hormone/chorionic gonadotropin receptor signaling.',
  safety: 'Biologic/endocrine compound context varies by product and jurisdiction. This entry is for tracking metadata only.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the vial.',
  citations: [
    {
      id: 'dailymed-hcg',
      title: 'DailyMed label candidates for Human chorionic gonadotropin',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Human%20chorionic%20gonadotropin',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
