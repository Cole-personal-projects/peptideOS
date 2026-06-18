import type { ReferenceCompound } from '../schema';

export const epitalon: ReferenceCompound = {
  id: 'epitalon',
  name: 'Epitalon',
  aliases: ['Epithalon', 'Ala-Glu-Asp-Gly'],
  compoundType: 'peptide',
  category: 'longevity',
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
      citationIds: ['pubchem-epitalon'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A tetrapeptide tracked in longevity and aging-research contexts.',
  researcherDetails: 'Epitalon is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied in aging-related cellular and peptide bioregulation research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Epitalon is a longevity peptide where PeptideOS should capture vial math, cycle-style logs, and transparent evidence limitations.',
      whyPeopleCare: [
        'It is widely discussed in longevity and peptide bioregulation communities.',
        'Users often handle it as lyophilized research vials, making vial amount, BAC volume, and reconstitution state central to app value.',
        'The bundled source set supports identity metadata, not an approved clinical product model.',
      ],
      verifyBeforeUse: [
        'Exact label name, vial amount, route, lot, expiration, source, and container state.',
        'Whether the product is Epitalon, Epithalon, a blend, or a vendor-specific short-peptide label.',
        'COA, purity, sterility/endotoxin documentation, storage language, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with total amount, BAC volume, concentration, reconstitution date, and active vial status.',
        'User-entered schedule, cycle notes, sleep notes, recovery notes, tolerability notes, and adherence.',
        'Source-quality and evidence-gap flags when documentation, lot, amount, or storage details are missing.',
      ],
      realityCheck: 'Epitalon is a classic biohacker compound, but PeptideOS should make the evidence limits and product-quality questions visible in every workflow.',
    },
    reviewSummary: 'Epitalon is included as a research peptide with PubChem-backed identity metadata and strong need for vial, kit, and cycle-style logging.',
    mechanismTargets: [
      'short peptide bioregulation context',
      'aging-related cellular research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for longevity-peptide tracking',
        finding: 'PubChem supports identity and naming metadata for Epitalon.',
        citationIds: ['pubchem-epitalon'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users logging Epitalon lyophilized vials or kits',
        finding: 'Useful app tracking depends on confirmed vial amount, diluent volume, source, lot, expiration, storage, and container state.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This describes research-market tracking needs, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish an approved-label safety profile.',
      'Research vials can introduce identity, purity, sterility, endotoxin, amount, and storage uncertainty.',
      'Long-cycle self-tracking can be confounded by sleep, training, diet, other compounds, and subjective expectations.',
    ],
    practicalNotes: [
      'Require vial amount and BAC volume before calculating concentration.',
      'Support kit grouping while preserving vial-level lot, amount, and reconstitution state.',
      'Let Peppi summarize cycle adherence and notes without inferring clinical outcomes.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety, efficacy, or protocol claims.',
      'Research-market material may not match the reference identity record in purity, amount, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Epitalon as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment varies by product claims, formulation, and source; this app entry does not validate legality or use.',
    },
    peptideOSActions: [
      'Add Epitalon vials or kits to inventory after user confirmation.',
      'Calculate concentration from confirmed vial amount and BAC water volume.',
      'Ask for lot, source, expiration, storage, container state, and documentation when missing.',
      'Track schedule adherence, cycle notes, sleep notes, recovery notes, tolerability, reconstitution history, and inventory depletion.',
      'Summarize logs with research-use and source-quality flags.',
    ],
  },
  citations: [
    {
      id: 'pubchem-epitalon',
      title: 'Epitalon compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/219042',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
