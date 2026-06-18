import type { ReferenceCompound } from '../schema';

export const aod9604: ReferenceCompound = {
  id: 'aod-9604',
  name: 'AOD-9604',
  aliases: ['AOD 9604', 'Tyr-hGH 177-191'],
  compoundType: 'peptide',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-aod-9604'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A growth-hormone fragment peptide tracked in metabolic research contexts.',
  researcherDetails: 'AOD-9604 is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied as a peptide fragment related to growth hormone sequence research.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'AOD-9604 is a metabolic-market GH-fragment peptide where PeptideOS should make vial identity, concentration math, and evidence limits explicit.',
      whyPeopleCare: [
        'It is discussed as a growth-hormone fragment in metabolic and body-composition research contexts.',
        'Users commonly handle it as a lyophilized vial requiring vial amount, BAC volume, concentration, and active-vial tracking.',
        'The bundled source set is identity-focused, so the app should avoid implying clinical certainty.',
      ],
      verifyBeforeUse: [
        'Exact vial label, amount, lot, source, expiration, and whether the vial is AOD-9604 alone or a blend.',
        'Formulation state, storage instructions, and whether the vial has already been reconstituted.',
        'COA, sterility/endotoxin documentation, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with amount, BAC volume, concentration, reconstitution date, and active-vial state.',
        'Schedule adherence, missed doses, body-composition notes, appetite notes, and user-entered outcome notes.',
        'Source-quality and evidence flags when the label, lot, source, or amount is incomplete.',
      ],
      realityCheck: 'AOD-9604 is a popular biohacking-market compound, but this entry is not a clinical endorsement. PeptideOS should help users keep records clean and uncertainty visible.',
    },
    reviewSummary: 'AOD-9604 is tracked as a GH-fragment metabolic research peptide with identity, vial, and logging metadata. PeptideOS focuses on inventory accuracy, reconstitution math, and transparent evidence gaps.',
    mechanismTargets: [
      'growth-hormone fragment context',
      'metabolic research context',
      'body-composition tracking context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for inventory creation',
        finding: 'PubChem supports AOD-9604 identity and naming metadata used by PeptideOS for reference-library records.',
        citationIds: ['pubchem-aod-9604'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not establish approved-product status or protocol guidance.',
      },
      {
        design: 'product-verification-context',
        population: 'Users adding AOD-9604 vials, kits, or blends to inventory',
        finding: 'Identity metadata supports alias matching, while vial amount, lot, source, sterility documentation, and blend status remain product-specific fields requiring user confirmation.',
        citationIds: ['pubchem-aod-9604'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate a supplier, concentration, sterility, stability, or clinical use.',
      },
    ],
    safetySignals: [
      'Research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Metabolic outcome notes are easy to over-attribute without consistent schedule and context tracking.',
      'Missing vial amount or BAC volume prevents reliable concentration and depletion math.',
    ],
    practicalNotes: [
      'Capture vial amount and diluent volume before calculating concentration.',
      'Keep user-entered outcome notes separate from app conclusions.',
      'For kits, group inventory while retaining vial-level amount, lot, and reconstitution state.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The source set does not establish clinical outcome certainty or a recommended protocol.',
      'Community-market material may not match expected identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats AOD-9604 as research-use tracking context with identity metadata from PubChem.',
      citationIds: ['pubchem-aod-9604'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, or clinical use.',
    },
    peptideOSActions: [
      'Add AOD-9604 vials or kits to inventory from a label photo after user confirmation.',
      'Ask for missing vial amount, lot, source, expiration, BAC volume, or reconstitution date.',
      'Calculate concentration from confirmed vial amount and diluent volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Summarize adherence, inventory depletion, and user-entered metabolic notes without recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-aod-9604',
      title: 'AOD-9604 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/71300630',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
