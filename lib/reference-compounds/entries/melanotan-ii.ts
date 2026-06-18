import type { ReferenceCompound } from '../schema';

export const melanotanIi: ReferenceCompound = {
  id: 'melanotan-ii',
  name: 'Melanotan II',
  aliases: ['MT-II', 'Melanotan 2'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg lyophilized vial',
      totalAmount: { value: 10, unit: 'mg' },
      sourceNote: 'Inventory preset for tracking only; verify against the actual container label.',
      citationIds: ['pubchem-melanotan-ii'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A melanocortin peptide commonly referenced in skin-pigmentation research contexts.',
  researcherDetails: 'Melanotan II is a cyclic peptide indexed by PubChem. PeptideOS models it as a skin/hair category research compound without use instructions.',
  mechanism: 'Studied as a melanocortin receptor agonist in pigmentation and related research contexts.',
  safety: 'Research peptide context with nontrivial safety considerations; this entry is not use guidance.',
  storage: 'Use the storage instructions provided with the actual material.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Melanotan II is a melanocortin peptide where PeptideOS should track vial math, skin-response notes, and clear risk/source flags.',
      whyPeopleCare: [
        'It is commonly discussed for pigmentation and melanocortin-related research contexts.',
        'Users often handle it as lyophilized research vials, making vial amount, BAC volume, and reconstitution history important.',
        'The bundled source supports identity metadata but does not create approved-product guidance.',
      ],
      verifyBeforeUse: [
        'Exact label name, vial amount, route, lot, expiration, source, and container state.',
        'Whether the product is Melanotan II, MT-II, a blend, or another melanocortin peptide.',
        'COA, purity, sterility/endotoxin documentation, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with total amount, BAC volume, concentration, reconstitution date, and active vial status.',
        'User-entered schedule, adherence, skin-response notes, UV/tanning context notes if the user adds them, and tolerability notes.',
        'Source-quality and risk flags when label, lot, amount, source, or documentation is missing.',
      ],
      realityCheck: 'Melanotan II has strong community visibility and nontrivial risk context. PeptideOS should provide clean records and caution flags, not use instructions.',
    },
    reviewSummary: 'Melanotan II is included as a research peptide with PubChem-backed identity metadata and vial-tracking support for skin/pigmentation context notes.',
    mechanismTargets: [
      'melanocortin receptor agonism context',
      'pigmentation research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for melanocortin peptide tracking',
        finding: 'PubChem supports identity and naming metadata for Melanotan II.',
        citationIds: ['pubchem-melanotan-ii'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users logging Melanotan II lyophilized vials or kits',
        finding: 'Reliable tracking depends on confirmed vial amount, source, lot, storage, reconstitution details, and user-entered skin/tolerability context.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is product-quality and tracking context, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish approved-label safety context.',
      'Research vials can create identity, purity, sterility, endotoxin, amount, and storage uncertainty.',
      'Skin-response notes are confounded by UV exposure, skin type, concurrent products, timing, and subjective observation.',
    ],
    practicalNotes: [
      'Require vial amount and BAC volume before concentration math.',
      'Track UV/tanning context only as user-entered context when the user chooses to log it.',
      'Keep tolerability and skin observations tied to the exact active vial.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety or efficacy claims.',
      'Research-market products may not match the reference identity record in purity, amount, sterility, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Melanotan II as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment depends on product claims, formulation, and source; this entry does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add Melanotan II vials or kits to inventory after user confirmation.',
      'Calculate concentration from confirmed vial amount and BAC water volume.',
      'Ask for lot, source, expiration, storage, container state, and documentation when missing.',
      'Track adherence, skin-response notes, UV/tanning context notes, tolerability notes, reconstitution history, and inventory depletion.',
      'Surface risk, research-use, and source-quality flags in Peppi summaries.',
    ],
  },
  citations: [
    {
      id: 'pubchem-melanotan-ii',
      title: 'Melanotan II compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/92432',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
