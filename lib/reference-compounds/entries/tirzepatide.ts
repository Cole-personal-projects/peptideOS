import type { ReferenceCompound } from '../schema';

export const tirzepatide: ReferenceCompound = {
  id: 'tirzepatide',
  name: 'Tirzepatide',
  aliases: ['Mounjaro', 'Zepbound'],
  compoundType: 'glp-1',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Prefilled pen or labeled container',
      sourceNote: 'Reference container type only; concentration and amount must come from the actual product label.',
      citationIds: ['dailymed-tirzepatide'],
    },
  ],
  beginnerSummary: 'A dual-incretin metabolic compound tracked for labeled-product inventory, schedule, adherence, appetite, tolerability, and outcome context.',
  researcherDetails: 'Tirzepatide is a GIP receptor and GLP-1 receptor agonist represented in PeptideOS as a label-backed metabolic reference. The app tracks container identity, schedule, inventory depletion, and user-entered notes without converting labels into advice.',
  mechanism: 'Dual incretin agonism: GIP receptor and GLP-1 receptor activation with albumin-binding chemistry that prolongs exposure.',
  safety: 'Label-backed prescription metabolic compound. Track only user-confirmed label details, tolerability notes, and inventory metadata; PeptideOS does not provide treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Tirzepatide is the dual-incretin benchmark users will expect PeptideOS to handle cleanly: exact pen/container tracking, schedule adherence, and metabolic trend notes.',
      whyPeopleCare: [
        'It activates GIP and GLP-1 receptor pathways rather than GLP-1 alone.',
        'Users commonly encounter it as labeled products with distinct brand, indication, strength, and pen/container details.',
        'It creates practical tracking needs around adherence, missed doses, inventory depletion, appetite notes, body-weight trends, and tolerability.',
      ],
      verifyBeforeUse: [
        'Exact product name, labeled strength, container type, lot, expiration, source, and route from the physical label.',
        'Whether the user is logging a prefilled pen, pharmacy-labeled container, or another labeled presentation.',
        'Any label-specific storage and handling language attached to that exact container.',
      ],
      trackInApp: [
        'Inventory by exact pen or labeled container so remaining supply and active container state stay clear.',
        'Schedule adherence, missed-dose notes, appetite/tolerability notes, weight trend notes, and user-entered dose changes over time.',
        'Source documents and label photos so Peppi can ask for missing strength, lot, expiration, or container-state details.',
      ],
      realityCheck: 'Tirzepatide is label-backed, but PeptideOS still needs user-confirmed label data. The app should track what is on the container and what the user logged, not infer care decisions.',
    },
    reviewSummary: 'Tirzepatide has FDA-label-backed product context and a clear GIP/GLP-1 mechanism class. PeptideOS treats it as a first-class tracking object for labeled inventory, adherence, and user-entered outcome notes.',
    mechanismTargets: [
      'GIP receptor',
      'GLP-1 receptor',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled tirzepatide products under product-specific prescribing contexts',
        finding: 'DailyMed labeling identifies tirzepatide as a GIP receptor and GLP-1 receptor agonist and provides product-specific prescribing, safety, and handling context.',
        citationIds: ['dailymed-tirzepatide'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Reference chemistry and identity users need for library search and alias matching',
        finding: 'PubChem supports identity, naming, and compound-level reference metadata for tirzepatide.',
        citationIds: ['pubchem-tirzepatide'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, and handling details.',
      'Track gastrointestinal tolerability, appetite changes, missed doses, and user-entered dose changes as personal notes.',
      'Flag unclear source, missing lot, missing expiration, or mismatched product naming before adding inventory.',
    ],
    practicalNotes: [
      'Create inventory from the physical label or photo, then ask the user to confirm strength, lot, expiration, and container state.',
      'Peppi can build a schedule only from user-confirmed label details or user-entered instructions.',
      'Keep branded-product aliases searchable while preserving the exact item name the user entered.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine whether a label-backed product is appropriate for a user.',
      'Compounded or relabeled containers may not map cleanly to brand-label assumptions and require explicit user confirmation.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label records for tirzepatide products; PeptideOS uses this as label-backed tracking context only.',
      citationIds: ['dailymed-tirzepatide'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a labeled Tirzepatide pen or container to inventory after user confirmation.',
      'Ask for missing strength, lot, expiration, route, source, or storage details before saving inventory.',
      'Build a schedule from user-confirmed label details or user-entered instructions.',
      'Track adherence, missed doses, appetite notes, tolerability notes, weight trend notes, and inventory depletion.',
      'Summarize user-entered logs without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-tirzepatide',
      title: 'Tirzepatide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/166567236',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-tirzepatide',
      title: 'DailyMed label candidates for Tirzepatide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Tirzepatide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
