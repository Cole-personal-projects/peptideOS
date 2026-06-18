import type { ReferenceCompound } from '../schema';

export const dsip: ReferenceCompound = {
  id: 'dsip',
  name: 'DSIP',
  aliases: ['Delta Sleep-Inducing Peptide', 'Delta sleep inducing peptide'],
  compoundType: 'peptide',
  category: 'sleep',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'intranasal'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for tracking only; verify the actual vial label.',
      citationIds: ['pubchem-dsip'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A sleep-associated peptide tracked in sleep and neuropeptide research contexts.',
  researcherDetails: 'Delta sleep-inducing peptide is indexed by PubChem as a peptide compound. This entry supports categorization and local logging, not protocol guidance.',
  mechanism: 'Studied historically in sleep, stress, and neuroendocrine research contexts.',
  safety: 'Research peptide context. This entry is not medical advice or use guidance.',
  storage: 'Follow actual vial or material-label storage instructions.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'DSIP is a sleep-associated peptide where PeptideOS should capture vial math, sleep-context logs, and the limits of the evidence.',
      whyPeopleCare: [
        'It is discussed in sleep, stress, and neuroendocrine research contexts.',
        'Users often want to compare sleep logs against timing, stack changes, and subjective next-day notes.',
        'The bundled citation supports compound identity, not a standardized clinical sleep protocol.',
      ],
      verifyBeforeUse: [
        'Exact vial amount, route, lot, expiration, source, and container state from the label.',
        'Whether the product is DSIP alone, a blend, or a differently named sleep peptide.',
        'COA, purity, sterility/endotoxin documentation, storage instructions, and reconstitution details when available.',
      ],
      trackInApp: [
        'Vial inventory with vial amount, BAC volume, concentration, reconstitution date, and active vial status.',
        'User-entered schedule, missed logs, sleep timing, sleep quality notes, next-day notes, and tolerability notes.',
        'Source-quality and evidence-gap flags when the label, lot, amount, or documentation is incomplete.',
      ],
      realityCheck: 'DSIP is not a shortcut to sleep advice. PeptideOS should make sleep experiments auditable without implying clinical certainty.',
    },
    reviewSummary: 'DSIP is included as a research peptide with PubChem-backed identity metadata and sleep-context logging support.',
    mechanismTargets: [
      'sleep research context',
      'stress and neuroendocrine research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for sleep-peptide tracking',
        finding: 'PubChem supports identity and naming metadata for Delta sleep-inducing peptide.',
        citationIds: ['pubchem-dsip'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users logging DSIP vials or intranasal research products',
        finding: 'Reliable tracking requires confirmed vial amount or concentration, route, lot, source, storage, and reconstitution details.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is practical tracking context, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish approved-label safety context.',
      'Sleep logs can be confounded by caffeine, alcohol, training load, stress, medication changes, and stack changes.',
      'Research-market products can create identity, purity, sterility, concentration, and storage uncertainty.',
    ],
    practicalNotes: [
      'Capture sleep context alongside dose logs so summaries do not over-attribute changes.',
      'Require vial amount and BAC volume before concentration math for reconstituted products.',
      'Keep intranasal and reconstituted-vial inventory workflows distinct.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety, sleep efficacy, or protocol claims.',
      'Real-world products may differ from the reference identity record in form, purity, concentration, and handling.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats DSIP as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment depends on product claims, formulation, and source; PeptideOS does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add DSIP vials or containers to inventory after user confirmation.',
      'Ask for vial amount, BAC volume, concentration, route, lot, source, expiration, and storage details when missing.',
      'Build schedules only from user-entered instructions and attach logs to the active inventory item.',
      'Track sleep timing, sleep quality notes, next-day notes, tolerability, adherence, and inventory depletion.',
      'Flag confounders and source-quality gaps in Peppi summaries.',
    ],
  },
  citations: [
    {
      id: 'pubchem-dsip',
      title: 'Delta sleep-inducing peptide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/68816',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
