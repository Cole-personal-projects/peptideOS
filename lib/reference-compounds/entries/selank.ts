import type { ReferenceCompound } from '../schema';

export const selank: ReferenceCompound = {
  id: 'selank',
  name: 'Selank',
  aliases: ['Thr-Lys-Pro-Arg-Pro-Gly-Pro', 'Tuftsin analog Selank'],
  compoundType: 'peptide',
  category: 'cognitive',
  defaultRoute: 'intranasal',
  supportedRoutes: ['intranasal', 'subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Intranasal solution container',
      concentration: { value: 10, unit: 'mg/ml' },
      sourceNote: 'Concentration placeholder for inventory math only; verify against the actual container label.',
      citationIds: ['pubchem-selank'],
    },
  ],
  beginnerSummary: 'A peptide tracked in cognitive and neuropeptide research contexts.',
  researcherDetails: 'Selank is represented as a peptide reference compound for identity, route, and concentration-container tracking metadata.',
  mechanism: 'Studied as a tuftsin-related peptide analog in neuropeptide research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Selank is a cognitive peptide entry where the useful app job is identity capture, nasal-solution tracking, and honest weak-evidence labeling.',
      whyPeopleCare: [
        'It is frequently discussed for stress, focus, and nootropic research contexts.',
        'Users commonly see it as a nasal solution, so concentration, bottle volume, route, and container state drive useful tracking.',
        'The current bundled citation supports compound identity rather than a standardized clinical-use model.',
      ],
      verifyBeforeUse: [
        'Exact label name, concentration, bottle volume, route, lot, expiration, and source from the product.',
        'Whether the item is Selank alone, a blend, or another tuftsin-related analog.',
        'Supplier documentation, COA, storage language, and spray-output details when available.',
      ],
      trackInApp: [
        'Inventory by nasal bottle or labeled container with concentration, active state, and source flags.',
        'User-entered schedule, missed logs, cognitive context notes, mood/stress notes, sleep notes, and tolerability notes.',
        'Open questions Peppi needs resolved before saving, especially missing concentration, lot, source, or container volume.',
      ],
      realityCheck: 'Selank belongs in a biohacker library, but the app should call out the evidence limits and make the tracking math depend only on confirmed label data.',
    },
    reviewSummary: 'Selank is represented as a research peptide with PubChem-backed identity metadata and practical support for concentration-based container tracking.',
    mechanismTargets: [
      'tuftsin analog context',
      'neuropeptide signaling research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for cognitive peptide tracking',
        finding: 'PubChem supports identity and naming metadata for Selank.',
        citationIds: ['pubchem-selank'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-market-tracking-context',
        population: 'Users logging Selank nasal solutions or research containers',
        finding: 'PeptideOS needs exact concentration, volume, source, and route data from the container before it can support reliable inventory and schedule tracking.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This records product-quality uncertainty and app tracking needs, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish a label-backed human safety profile.',
      'Nasal solution concentration and spray output can vary by vendor and container.',
      'Source quality, identity, purity, sterility, and storage conditions are unresolved without product-specific documentation.',
    ],
    practicalNotes: [
      'Capture concentration and bottle volume before estimating remaining supply.',
      'Keep route and formulation visible because nasal solution and injectable research vial workflows differ.',
      'Let Peppi ask for missing label photos or COA details before adding inventory.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized dosing, safety, or efficacy claims.',
      'Research-market products may not match the reference identity record or label concentration.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Selank as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory status can vary by product claims, formulation, and source; PeptideOS does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add Selank containers from label text or photo after user confirmation.',
      'Ask for concentration, bottle volume, route, lot, expiration, source, and storage details when missing.',
      'Build schedules only from user-entered instructions and attach logs to a specific active container.',
      'Track cognitive notes, stress notes, sleep notes, tolerability notes, adherence, and remaining supply.',
      'Surface weak-evidence and source-quality flags in summaries.',
    ],
  },
  citations: [
    {
      id: 'pubchem-selank',
      title: 'Selank compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/11765600',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
