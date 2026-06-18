import type { ReferenceCompound } from '../schema';

export const thymosinAlpha1: ReferenceCompound = {
  id: 'thymosin-alpha-1',
  name: 'Thymosin Alpha-1',
  aliases: ['Thymalfasin', 'TA1', 'Talpha1'],
  compoundType: 'peptide',
  category: 'immune',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '1.6 mg lyophilized vial',
      totalAmount: { value: 1.6, unit: 'mg' },
      sourceNote: 'Identity and inventory preset for tracking; verify the actual vial label.',
      citationIds: ['pubchem-thymosin-alpha-1'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 1.6, unit: 'mg' }],
    typicalBacWaterMl: [1],
  },
  beginnerSummary: 'An immune-related peptide often referenced in thymosin alpha-1 research and tracking contexts.',
  researcherDetails: 'Thymosin alpha-1 is represented as a defined peptide compound in PubChem. PeptideOS includes identity metadata without protocol recommendations.',
  mechanism: 'Studied in immune modulation contexts involving T-cell and cytokine signaling pathways.',
  safety: 'Immune-active research compound. This entry is for logging context only and is not use guidance.',
  storage: 'Use product-specific storage instructions from the actual container label.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Thymosin Alpha-1 is an immune-focused peptide where PeptideOS should make vial identity, source quality, reconstitution, and immune-context notes explicit.',
      whyPeopleCare: [
        'It is one of the thymosin-family compounds users discuss for immune-modulation research and resilience stacks.',
        'Users commonly encounter lyophilized vials, so amount, diluent volume, concentration, lot, and active-vial state matter.',
        'It can be confused with other thymosin names, especially Thymosin Beta-4 or TB-500, unless the label is captured exactly.',
      ],
      verifyBeforeUse: [
        'Exact label name, vial amount, lot, expiration, source, route, and container state from the vial or kit.',
        'Whether the label says Thymosin Alpha-1, thymalfasin, TA1, a blend, or a different thymosin-family compound.',
        'COA, sterility/endotoxin documentation, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Inventory by vial or kit with vial amount, BAC water volume, concentration, reconstitution date, and active-vial status.',
        'Schedule adherence, missed entries, immune-context notes, travel/illness context, and user-entered tolerability notes.',
        'Evidence/source flags when identity, vial amount, lot, storage, or sterility documentation is missing.',
      ],
      realityCheck: 'Thymosin Alpha-1 has serious immune-context interest, but PeptideOS should not treat a research vial as a clinical protocol. The app should keep identity, math, and uncertainty clean.',
    },
    reviewSummary: 'Thymosin Alpha-1 is modeled as an immune-category peptide with PubChem-backed identity metadata and high practical need for exact vial and source tracking.',
    mechanismTargets: [
      'T-cell signaling context',
      'cytokine signaling research',
      'immune-modulation research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for immune peptide library users',
        finding: 'PubChem supports identity and naming metadata for Thymosin Alpha-1.',
        citationIds: ['pubchem-thymosin-alpha-1'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users entering Thymosin Alpha-1 vials, kits, or thymosin-family products',
        finding: 'Reliable tracking depends on user-confirmed label identity, vial amount, lot, source, storage, and reconstitution details because thymosin-family naming can be ambiguous.',
        citationIds: ['pubchem-thymosin-alpha-1'],
        sourceQuality: 'source-backed',
        limitations: 'Identity metadata does not validate product quality, sterility, concentration, or human-use claims for a specific vial.',
      },
    ],
    safetySignals: [
      'Immune-active context means user-entered illness, infection, medication, and tolerability notes may matter for personal records.',
      'Research-market vials can carry identity, purity, sterility, endotoxin, storage, and amount uncertainty.',
      'Thymosin-family naming confusion can lead to bad records if Alpha-1, Beta-4, TB-500, or blends are collapsed into one entry.',
    ],
    practicalNotes: [
      'Ask Peppi to confirm whether the label says Thymosin Alpha-1, thymalfasin, TA1, or another thymosin compound before saving.',
      'Calculate concentration only from confirmed vial amount and BAC water volume.',
      'Group kits by source, lot, vial amount, and expiration while preserving individual active-vial state.',
      'Attach source documentation or label photos when available so future review does not depend on memory.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this bundled reference entry.',
      'The bundled source set does not establish standardized personal protocols or outcome claims.',
      'Research-market material may differ from reference identity records in purity, form, stability, and sterility.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Thymosin Alpha-1 as research-use tracking context with PubChem-backed identity metadata and no approved US product label attached to this entry.',
      citationIds: ['pubchem-thymosin-alpha-1'],
      sourceQuality: 'source-backed',
      limitations: 'Regulatory handling depends on source, claims, formulation, and jurisdiction; this app entry does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add Thymosin Alpha-1 vials or kits to inventory after user confirmation.',
      'Ask for label identity, vial amount, lot, source, expiration, route, storage, and container state when missing.',
      'Calculate concentration from confirmed vial amount and BAC water volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Track adherence, immune-context notes, tolerability notes, source-quality flags, and inventory depletion.',
    ],
  },
  citations: [
    {
      id: 'pubchem-thymosin-alpha-1',
      title: 'Thymosin alpha 1 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16130571',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
