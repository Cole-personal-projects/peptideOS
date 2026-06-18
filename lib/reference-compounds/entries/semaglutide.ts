import type { ReferenceCompound } from '../schema';

export const semaglutide: ReferenceCompound = {
  id: 'semaglutide',
  name: 'Semaglutide',
  aliases: ['Ozempic', 'Wegovy', 'Rybelsus'],
  compoundType: 'glp-1',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Prefilled pen or labeled container',
      sourceNote: 'Reference container type only; concentration and amount must come from the actual product label.',
      citationIds: ['dailymed-semaglutide'],
    },
  ],
  beginnerSummary: 'A GLP-1 receptor agonist tracked for labeled-product inventory, adherence, appetite, tolerability, and metabolic trend context.',
  researcherDetails: 'Semaglutide is represented as a label-backed GLP-1 receptor agonist reference with subcutaneous and oral product contexts. PeptideOS tracks identity, labeled containers, schedules, and user notes without encoding dosing guidance.',
  mechanism: 'GLP-1 receptor agonism with product-specific formulations and routes across semaglutide labels.',
  safety: 'Label-backed prescription metabolic compound. Use product-specific label details for tracking context; PeptideOS does not provide treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Semaglutide is the GLP-1 baseline users will compare against newer metabolic compounds, so PeptideOS needs clean label, route, inventory, and outcome tracking.',
      whyPeopleCare: [
        'It is a widely recognized GLP-1 receptor agonist across several branded product contexts.',
        'Users may encounter subcutaneous and oral semaglutide presentations, making route and label capture important.',
        'It creates repeated tracking needs around adherence, appetite, tolerability, weight trend notes, and active container status.',
      ],
      verifyBeforeUse: [
        'Exact brand or product name, route, strength, container type, lot, expiration, and source from the physical label.',
        'Whether the item is an injection pen, oral tablet, pharmacy-labeled container, or another labeled presentation.',
        'Product-specific storage and handling details from the exact label instead of another GLP-1 product.',
      ],
      trackInApp: [
        'Inventory by exact labeled item so oral, injectable, branded, and relabeled records do not blur together.',
        'Schedule adherence, missed-dose notes, appetite/tolerability notes, body-weight trend notes, and user-entered changes.',
        'Label photos and source documents so Peppi can resolve missing route, strength, lot, or expiration details.',
      ],
      realityCheck: 'Semaglutide has label-backed products, but app value comes from exact tracking. PeptideOS should not collapse different routes, products, or label contexts into one generic GLP-1 record.',
    },
    reviewSummary: 'Semaglutide has approved-label product context and a GLP-1 receptor mechanism class. PeptideOS treats it as a first-class tracking object for exact label identity, route, adherence, and user-entered outcome notes.',
    mechanismTargets: [
      'GLP-1 receptor',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled semaglutide products under product-specific prescribing contexts',
        finding: 'DailyMed labeling identifies semaglutide product contexts and provides product-specific route, prescribing, safety, and handling information.',
        citationIds: ['dailymed-semaglutide'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Reference chemistry and identity users need for library search and alias matching',
        finding: 'PubChem supports identity, naming, and compound-level reference metadata for semaglutide.',
        citationIds: ['pubchem-semaglutide'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, and handling details.',
      'Track appetite changes, gastrointestinal tolerability, missed doses, route-specific notes, and user-entered changes.',
      'Flag unclear source, missing route, missing lot, missing expiration, or mismatched product naming before adding inventory.',
    ],
    practicalNotes: [
      'Capture the route first because semaglutide can appear in injectable and oral product contexts.',
      'Peppi can build schedules only from user-confirmed label details or user-entered instructions.',
      'Keep branded aliases searchable while preserving the exact item name and route the user entered.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine whether a label-backed product is appropriate for a user.',
      'Compounded, relabeled, or research-market containers may not map cleanly to branded label assumptions and require explicit user confirmation.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label records for semaglutide products; PeptideOS uses this as label-backed tracking context only.',
      citationIds: ['dailymed-semaglutide'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a labeled Semaglutide pen, tablet, or container to inventory after user confirmation.',
      'Ask for route, strength, lot, expiration, source, and storage details when they are missing.',
      'Build a schedule from user-confirmed label details or user-entered instructions.',
      'Track adherence, missed doses, appetite notes, tolerability notes, weight trend notes, route notes, and inventory depletion.',
      'Summarize user-entered logs without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-semaglutide',
      title: 'Semaglutide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/56843331',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-semaglutide',
      title: 'DailyMed label candidates for Semaglutide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Semaglutide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
