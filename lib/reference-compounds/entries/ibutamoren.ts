import type { ReferenceCompound } from '../schema';

export const ibutamoren: ReferenceCompound = {
  id: 'ibutamoren',
  name: 'MK-677 / Ibutamoren',
  aliases: ['MK-677', 'Ibutamoren mesylate'],
  compoundType: 'small-molecule',
  category: 'growth-hormone',
  defaultRoute: 'oral',
  supportedRoutes: ['oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or powder container',
      sourceNote: 'Container preset for inventory tracking only; verify amount and form from the actual container label.',
      citationIds: ['pubchem-ibutamoren'],
    },
  ],
  beginnerSummary: 'An oral small molecule tracked in growth-hormone secretagogue research contexts.',
  researcherDetails: 'Ibutamoren is represented as a small-molecule reference entry for identity, route, and container tracking metadata.',
  mechanism: 'Studied as a ghrelin receptor agonist and growth hormone secretagogue.',
  safety: 'Research small molecule. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'MK-677 / Ibutamoren is an oral GH-secretagogue research compound where PeptideOS should track container identity, capsule counts, schedule logs, and appetite/sleep notes.',
      whyPeopleCare: [
        'It is discussed as an oral ghrelin-receptor agonist rather than an injectable peptide vial.',
        'Users often track it alongside GH-axis compounds, sleep/recovery notes, appetite notes, and body-composition context.',
        'Inventory workflows are bottle, capsule, tablet, powder, or solution based instead of BAC-water vial math.',
      ],
      verifyBeforeUse: [
        'Exact label name, form, amount per unit, unit count, lot, source, expiration, and storage language.',
        'Whether the product is ibutamoren alone or combined with other research compounds.',
        'Any COA or supplier documentation that supports identity and amount.',
      ],
      trackInApp: [
        'Container inventory with form, amount per capsule or measured unit, count remaining, source, lot, and expiration.',
        'Schedule adherence, missed doses, appetite notes, sleep/recovery notes, water-retention notes, and user-entered lab notes.',
        'Source-quality flags when amount per unit, unit count, lot, or compound identity is unclear.',
      ],
      realityCheck: 'Ibutamoren is not a peptide vial workflow and this bundled entry is identity-level. PeptideOS should make oral-container tracking strong without creating protocol advice.',
    },
    reviewSummary: 'Ibutamoren is tracked as an oral ghrelin-receptor/GH-secretagogue research compound with identity and container metadata. PeptideOS focuses on exact product records, adherence, and user-entered notes.',
    mechanismTargets: [
      'ghrelin receptor context',
      'growth-hormone secretagogue context',
      'oral-container inventory tracking',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for oral container inventory',
        finding: 'PubChem supports ibutamoren identity and naming metadata used by PeptideOS for library and inventory records.',
        citationIds: ['pubchem-ibutamoren'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not establish approved-product status or dosing protocol guidance.',
      },
      {
        design: 'oral-product-verification-context',
        population: 'Users adding capsule bottles, powder containers, or oral blends to inventory',
        finding: 'Identity metadata supports name matching, while amount per unit, unit count, form, lot, source, and blend status must come from the user-confirmed label.',
        citationIds: ['pubchem-ibutamoren'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate a specific oral product, supplier, amount per unit, purity, or clinical use.',
      },
    ],
    safetySignals: [
      'Oral products can have amount-per-unit, capsule-count, blend, purity, and labeling uncertainty.',
      'Appetite, sleep, water-retention, and glucose-related notes may be relevant user-entered tracking domains, not app conclusions.',
      'Powder containers require user-confirmed amount and measurement method before inventory math is meaningful.',
    ],
    practicalNotes: [
      'Use capsule-bottle or other oral container inventory rather than reconstitution fields by default.',
      'Ask for amount per unit and unit count before saving inventory.',
      'Keep blends explicit so Peppi can avoid attributing logs to ibutamoren alone.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The app source set does not establish clinical outcome certainty or a recommended protocol.',
      'Community-market products may not match expected identity, amount, purity, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats MK-677 / Ibutamoren as research-use tracking context with identity metadata from PubChem.',
      citationIds: ['pubchem-ibutamoren'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, or clinical use.',
    },
    peptideOSActions: [
      'Add an ibutamoren capsule bottle, powder container, or labeled oral product after user confirmation.',
      'Ask for amount per unit, unit count, lot, source, expiration, and blend status before saving.',
      'Build schedules only from user-entered instructions.',
      'Track adherence, remaining units, appetite notes, sleep/recovery notes, and user-entered lab notes.',
      'Summarize user-entered patterns without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-ibutamoren',
      title: 'Ibutamoren compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/178024',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
