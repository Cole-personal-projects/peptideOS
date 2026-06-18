import type { ReferenceCompound } from '../schema';

export const aicar: ReferenceCompound = {
  id: 'aicar',
  name: 'AICAR',
  aliases: ['Acadesine', 'ZMP riboside'],
  compoundType: 'small-molecule',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Labeled powder or capsule container',
      sourceNote: 'Reference container type only; amount and form must come from the actual product label.',
      citationIds: ['pubchem-aicar'],
    },
  ],
  beginnerSummary: 'A small molecule tracked in metabolic and AMPK-related research contexts.',
  researcherDetails: 'AICAR is represented as a small-molecule reference compound for identity, route, and container tracking metadata.',
  mechanism: 'Studied as an AMP analog in AMPK and energy-sensing pathway research.',
  safety: 'Research small molecule. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'AICAR is a metabolic research compound where PeptideOS should focus on identity, container form, AMPK-context notes, and source-quality flags.',
      whyPeopleCare: [
        'It is discussed in metabolic, endurance, and AMPK-related research contexts.',
        'Users may encounter powders, capsules, or labeled research containers that require different inventory tracking.',
        'The bundled source set supports compound identity and mechanism context, not a validated user protocol.',
      ],
      verifyBeforeUse: [
        'Exact label name, form, amount, route, lot, expiration, and source from the physical container.',
        'Whether the product is AICAR, acadesine, a blend, or another AMP-related compound name.',
        'COA, purity, storage instructions, and supplier documentation before treating the item as verified.',
      ],
      trackInApp: [
        'Inventory by labeled container with form, amount, package count, and source documentation status.',
        'User-entered schedule, adherence, training context, metabolic notes, tolerability notes, and stack changes.',
        'Evidence and source-quality flags when form, amount, lot, or documentation is missing.',
      ],
      realityCheck: 'AICAR is a biohacker-relevant research compound, but PeptideOS should make identity and source uncertainty visible rather than presenting it like an approved product.',
    },
    reviewSummary: 'AICAR is included as a research small molecule with PubChem-backed identity metadata and metabolic-context tracking support.',
    mechanismTargets: [
      'AMPK pathway research',
      'cellular energy-sensing context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for metabolic research compound tracking',
        finding: 'PubChem supports identity and naming metadata for AICAR.',
        citationIds: ['pubchem-aicar'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-market-tracking-context',
        population: 'Users logging AICAR powders, capsules, or research containers',
        finding: 'Reliable inventory and schedule tracking depends on confirmed product form, amount, route, lot, source, and storage details.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is product-quality and tracking context, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish approved-label safety context.',
      'Research-market products can create identity, purity, amount, storage, and contamination uncertainty.',
      'Training, nutrition, stimulants, GLP-1 use, and stack changes can confound user-entered metabolic notes.',
    ],
    practicalNotes: [
      'Capture form and amount separately so capsules, powders, and containers remain auditable.',
      'Tag training and metabolic context when users want pattern summaries.',
      'Prompt for source documentation before marking the inventory record as verified.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety or efficacy claims for biohacking use.',
      'Marketed products may not match the reference identity record in purity, form, or amount.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats AICAR as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment depends on claims, formulation, and source; this entry does not validate legality or use.',
    },
    peptideOSActions: [
      'Add AICAR containers after the user confirms label details.',
      'Ask for form, amount, lot, source, expiration, storage, and documentation when missing.',
      'Build schedules only from user-entered instructions and tie logs to the exact inventory item.',
      'Track adherence, training context, metabolic notes, tolerability notes, stack changes, and remaining supply.',
      'Summarize user-entered patterns with explicit research-use flags.',
    ],
  },
  citations: [
    {
      id: 'pubchem-aicar',
      title: 'AICAR compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/65110',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
