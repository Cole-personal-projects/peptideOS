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
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Gonadorelin is a GnRH peptide where users need label/source clarity, mcg-based scheduling, and reproductive-axis logging without protocol advice.',
      whyPeopleCare: [
        'It is a reproductive-axis signaling peptide that users may track near HCG, kisspeptin, and testosterone workflows.',
        'Container presentations vary, so vial amount, concentration, reconstitution state, and route should come from the actual label.',
        'Its value in PeptideOS is clean schedule history, vial math, source flags, and user-entered hormone-context notes.',
      ],
      verifyBeforeUse: [
        'Exact label, source, lot, expiration, total vial amount, concentration or diluent volume, route, and container state.',
        'Whether the compound is gonadorelin, GnRH, or another reproductive-axis peptide before Peppi matches it.',
        'Any prescription, pharmacy label, COA, or source documentation attached to the vial.',
      ],
      trackInApp: [
        'Inventory by vial with total amount, concentration, reconstitution date, lot, expiration, and source.',
        'Schedule adherence, missed entries, remaining vial estimate, and route-specific logs.',
        'User-entered reproductive-axis notes, source-quality flags, and label photos for later review.',
      ],
      realityCheck: 'Gonadorelin has label-backed context, but PeptideOS should only structure the user’s confirmed data and avoid deciding endocrine protocols.',
    },
    reviewSummary: 'Gonadorelin is represented as a label-backed reproductive/endocrine peptide with identity, source, reconstitution, and mcg-oriented schedule tracking.',
    mechanismTargets: [
      'GnRH receptor',
      'hypothalamic-pituitary-gonadal axis',
    ],
    clinicalEvidence: [
      {
        design: 'label-candidate-reference',
        population: 'People using labeled gonadorelin products under product-specific contexts',
        finding: 'DailyMed label candidates provide product-specific identity and safety context for gonadorelin products.',
        citationIds: ['dailymed-gonadorelin'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Users who need GnRH alias and identity matching',
        finding: 'PubChem supports compound identity metadata for gonadorelin, helping distinguish it from other reproductive-axis peptides.',
        citationIds: ['pubchem-gonadorelin'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, route, and handling details.',
      'Flag missing vial amount, concentration, lot, expiration, source, or route before creating a schedule.',
      'Track missed entries, active-vial age, user-entered tolerability notes, and source flags without interpreting hormone outcomes.',
    ],
    practicalNotes: [
      'Keep gonadorelin distinct from HCG and kisspeptin in library search and Peppi workflows.',
      'Peppi can calculate concentration only from user-confirmed total amount and diluent volume.',
      'Ask for route and container state because user workflows may involve sealed, reconstituted, or active vials.',
    ],
    evidenceGaps: [
      'PeptideOS does not choose reproductive-axis protocols or interpret hormone lab changes.',
      'Search-level label candidates and identity records do not validate a specific user-supplied vial.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label-candidate context for gonadorelin; PeptideOS uses this for identity and tracking metadata only.',
      citationIds: ['dailymed-gonadorelin'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a gonadorelin vial to inventory after the user confirms label details.',
      'Ask for amount, concentration or diluent volume, lot, expiration, source, route, and vial state before saving.',
      'Build a schedule from user-confirmed instructions and preserve missed-entry context.',
      'Track inventory depletion, reconstitution date, user-entered notes, source-quality flags, and label photos.',
    ],
  },
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
