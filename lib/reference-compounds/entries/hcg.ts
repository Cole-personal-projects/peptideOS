import type { ReferenceCompound } from '../schema';

export const hcg: ReferenceCompound = {
  id: 'hcg',
  name: 'HCG',
  aliases: ['Human chorionic gonadotropin', 'Chorionic gonadotropin'],
  compoundType: 'biologic',
  category: 'hormone-endocrine',
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
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'HCG is an IU-labeled endocrine biologic where vial amount, reconstitution math, source verification, and active-vial age are the core PeptideOS jobs.',
      whyPeopleCare: [
        'Users commonly encounter HCG as lyophilized IU-labeled vials, so inventory math depends on exact vial amount and diluent volume.',
        'It sits in reproductive and hormone-axis workflows, making schedule, depletion, and source tracking especially important.',
        'Multiple identical vials or kits can be grouped cleanly only when lot, IU amount, source, and expiration are captured.',
      ],
      verifyBeforeUse: [
        'Exact label, source or prescription, lot, expiration, total IU per vial, diluent volume, route, and container state.',
        'Whether the user has a sealed vial, reconstituted vial, kit, or partially used active vial.',
        'Storage requirements and discard timing from the actual product label or pharmacy instructions.',
      ],
      trackInApp: [
        'Inventory by vial or kit with total IU, BAC water volume, active date, lot, expiration, and source.',
        'Schedule adherence, reconstitution date, remaining IU estimates, missed entries, and active-vial age.',
        'Source-quality flags, label photos, and user-entered reproductive or hormone-context notes.',
      ],
      realityCheck: 'HCG tracking is mostly math and container hygiene in PeptideOS; the app should not infer fertility, hormone, or medical decisions from the log.',
    },
    reviewSummary: 'HCG is modeled as a label-backed hormone/endocrine biologic with IU-primary inventory, reconstitution, schedule, and source-quality tracking. PeptideOS should make vial state and user confirmation explicit.',
    mechanismTargets: [
      'LH/chorionic gonadotropin receptor',
      'reproductive endocrine axis',
    ],
    clinicalEvidence: [
      {
        design: 'label-candidate-reference',
        population: 'People using labeled chorionic gonadotropin products under product-specific contexts',
        finding: 'DailyMed label candidates provide product-specific identity, route, safety, and handling context for chorionic gonadotropin products.',
        citationIds: ['dailymed-hcg'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'iu-vial-tracking-reference',
        population: 'Users entering lyophilized HCG vials and kits',
        finding: 'The label-candidate source supports IU-based product tracking, but final inventory math must come from the exact user-confirmed vial and diluent volume.',
        citationIds: ['dailymed-hcg'],
        sourceQuality: 'label-backed',
        limitations: 'Search-level label candidates do not replace verification of the specific container in hand.',
      },
    ],
    safetySignals: [
      'Use the exact label for contraindications, warnings, adverse reactions, route, and handling details.',
      'Flag missing IU amount, diluent volume, lot, expiration, source, or reconstitution date before calculating remaining supply.',
      'Track active-vial age, storage notes, user-entered tolerability notes, and missed entries without giving endocrine guidance.',
    ],
    practicalNotes: [
      'Treat kits as grouped vial inventory while preserving individual vial count, lot, and expiration.',
      'Peppi can calculate concentration only from user-confirmed total IU and diluent volume.',
      'Ask whether the vial is sealed, reconstituted, active, finished, or expired before updating inventory.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine fertility, hormone, or reproductive protocols for a user.',
      'Compounded, relabeled, or research-market HCG may not match label-backed assumptions and needs explicit source-quality flags.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label-candidate context for chorionic gonadotropin products; PeptideOS uses it for tracking metadata only.',
      citationIds: ['dailymed-hcg'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add sealed HCG vials or kits to inventory after user confirmation.',
      'Ask for total IU, diluent volume, lot, expiration, source, route, and vial state before saving.',
      'Calculate concentration and remaining IU from user-confirmed vial and reconstitution data.',
      'Track schedule adherence, active-vial age, inventory depletion, missed entries, and source-quality notes.',
    ],
  },
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
