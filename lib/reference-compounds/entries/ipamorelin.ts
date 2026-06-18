import type { ReferenceCompound } from '../schema';

export const ipamorelin: ReferenceCompound = {
  id: 'ipamorelin',
  name: 'Ipamorelin',
  aliases: ['NNC 26-0161', 'Ipamorelin acetate'],
  compoundType: 'peptide',
  category: 'growth-hormone',
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
      citationIds: ['pubchem-ipamorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A ghrelin-receptor agonist peptide tracked in growth-hormone secretagogue research contexts.',
  researcherDetails: 'Ipamorelin is represented as a peptide reference compound for identity, route, vial, and logging metadata. This entry avoids dosing or protocol claims.',
  mechanism: 'Studied as a growth hormone secretagogue with ghrelin receptor activity.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Ipamorelin is a GH-secretagogue research peptide where the app value is precise vial records, blend detection, and clean schedule logging.',
      whyPeopleCare: [
        'It is discussed as a ghrelin-receptor agonist in growth-hormone secretagogue contexts.',
        'Users often encounter it as a standalone vial or in GH-axis blends with CJC-1295 or other peptides.',
        'The day-to-day PeptideOS job is vial math, inventory grouping, adherence, and source-quality transparency.',
      ],
      verifyBeforeUse: [
        'Exact label name, vial amount, lot, source, expiration, and whether the vial is standalone or blended.',
        'Formulation state, storage instructions, and whether the vial has already been reconstituted.',
        'COA, sterility/endotoxin documentation, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with vial amount, BAC volume, concentration, reconstitution date, and active-vial state.',
        'Schedule adherence, missed doses, injection-site notes, sleep/recovery notes, hunger notes, and user-entered lab notes.',
        'Blend flags so logs remain tied to the actual product the user has.',
      ],
      realityCheck: 'Ipamorelin has strong community visibility but this bundled entry is identity-level. PeptideOS should keep the math solid and the evidence limits obvious.',
    },
    reviewSummary: 'Ipamorelin is tracked as a ghrelin-receptor/GH-secretagogue research compound with identity, vial, and logging metadata. PeptideOS does not encode protocol guidance for this entry.',
    mechanismTargets: [
      'ghrelin receptor context',
      'growth-hormone secretagogue context',
      'GH-axis logging context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for library search and inventory creation',
        finding: 'PubChem supports ipamorelin identity and naming metadata used by PeptideOS for reference-library records.',
        citationIds: ['pubchem-ipamorelin'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not establish approved-product status or a recommended protocol.',
      },
      {
        design: 'product-verification-context',
        population: 'Users adding ipamorelin standalone vials, kits, or blends to inventory',
        finding: 'Identity metadata supports alias matching, while vial amount, blend components, lot, source, and sterility documentation remain product-specific fields requiring user confirmation.',
        citationIds: ['pubchem-ipamorelin'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate a supplier, vial concentration, sterility, or clinical use.',
      },
    ],
    safetySignals: [
      'Research-market products can have identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Blended vials can obscure which compound is being logged unless the exact label is captured.',
      'GH-axis tracking can be misleading without consistent schedule, subjective notes, and user-entered lab context.',
    ],
    practicalNotes: [
      'Ask whether the product is standalone ipamorelin or a blend before saving inventory.',
      'Preserve vial-level records even when a kit contains multiple identical vials.',
      'Peppi should ask for vial amount and BAC volume before calculating concentration.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The source set does not establish human outcome certainty or dosing protocols.',
      'Community-market material may not match expected identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats ipamorelin as research-use tracking context with identity metadata from PubChem.',
      citationIds: ['pubchem-ipamorelin'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, or clinical use.',
    },
    peptideOSActions: [
      'Add ipamorelin vials or kits to inventory from a label photo after user confirmation.',
      'Detect and ask about blends before creating inventory or schedules.',
      'Calculate concentration from confirmed vial amount and diluent volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Summarize adherence, inventory depletion, subjective notes, and user-entered lab notes without recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-ipamorelin',
      title: 'Ipamorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9831659',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
