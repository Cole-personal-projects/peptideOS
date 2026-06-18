import type { ReferenceCompound } from '../schema';

export const pinealon: ReferenceCompound = {
  id: 'pinealon',
  name: 'Pinealon',
  aliases: ['Glu-Asp-Arg', 'EDR peptide'],
  compoundType: 'peptide',
  category: 'cognitive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'intranasal'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg lyophilized vial',
      totalAmount: { value: 10, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-pinealon'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A short peptide tracked in cognitive and neuropeptide research contexts.',
  researcherDetails: 'Pinealon is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied as a short peptide in neuropeptide and cellular regulation research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Pinealon is a short cognitive peptide where the app value is vial identity, reconstitution math, and clear emerging-evidence labeling.',
      whyPeopleCare: [
        'It is discussed in cognitive, aging, and peptide bioregulation research communities.',
        'Users commonly handle it as lyophilized research vials, so vial amount and BAC volume drive every downstream calculation.',
        'The bundled citation supports identity metadata and does not establish a clinical product model.',
      ],
      verifyBeforeUse: [
        'Exact vial amount, route, lot, expiration, source, and whether the vial is lyophilized or already mixed.',
        'Whether the label says Pinealon, EDR, a blend, or another short-peptide name.',
        'COA, purity, sterility/endotoxin documentation, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with total amount, BAC volume, concentration, reconstitution date, and active vial status.',
        'User-entered schedule, adherence, cognitive context notes, sleep notes, and tolerability notes.',
        'Evidence gaps and source-quality flags for missing lot, source, amount, or documentation.',
      ],
      realityCheck: 'Pinealon belongs in an exploratory biohacking library, but PeptideOS should frame it as identity-backed research tracking rather than proven clinical guidance.',
    },
    reviewSummary: 'Pinealon is represented as a research peptide with PubChem-backed identity metadata and a reconstituted-vial tracking workflow.',
    mechanismTargets: [
      'short peptide bioregulation context',
      'neuropeptide research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for short-peptide tracking',
        finding: 'PubChem supports identity and naming metadata for Pinealon.',
        citationIds: ['pubchem-pinealon'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users logging Pinealon lyophilized vials or kits',
        finding: 'Reliable app math depends on user-confirmed vial amount, diluent volume, lot, source, and container state.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is tracking context for research-market products, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish a label-backed human safety profile.',
      'Research vials introduce identity, purity, sterility, concentration, and storage uncertainty.',
      'Reconstitution errors can make schedule and remaining-supply logs misleading.',
    ],
    practicalNotes: [
      'Require vial amount and BAC volume before calculating concentration.',
      'Group kits while retaining vial-level amount, lot, and reconstitution state.',
      'Prompt for missing source documentation before presenting an inventory record as verified.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety or efficacy claims.',
      'Supplier products may differ from the reference identity record in purity, salt form, amount, or storage requirements.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Pinealon as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment varies by product claims and source; this entry does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add Pinealon vials or kits to inventory after user confirmation.',
      'Calculate concentration from confirmed vial amount and BAC water volume.',
      'Ask for lot, source, expiration, storage, container state, and documentation when missing.',
      'Track adherence, cognitive notes, sleep notes, tolerability notes, reconstitution history, and inventory depletion.',
      'Summarize user-entered patterns with visible research-use flags.',
    ],
  },
  citations: [
    {
      id: 'pubchem-pinealon',
      title: 'Pinealon compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/10273502',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
