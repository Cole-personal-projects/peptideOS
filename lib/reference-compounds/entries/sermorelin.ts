import type { ReferenceCompound } from '../schema';

export const sermorelin: ReferenceCompound = {
  id: 'sermorelin',
  name: 'Sermorelin',
  aliases: ['GRF 1-29', 'Sermorelin acetate'],
  compoundType: 'peptide',
  category: 'growth-hormone',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '2 mg lyophilized vial',
      totalAmount: { value: 2, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-sermorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 2, unit: 'mg' }, { value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A GHRH analog peptide tracked in growth-hormone axis research contexts.',
  researcherDetails: 'Sermorelin is represented as a peptide reference compound for identity, route, vial, and logging metadata.',
  mechanism: 'Studied as a growth-hormone-releasing hormone analog in GH-axis research.',
  safety: 'Peptide/endocrine compound context varies by jurisdiction. This entry supports tracking metadata only.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Sermorelin is a GH-axis research peptide where PeptideOS should be strict about vial identity, reconstitution math, and uncertainty flags.',
      whyPeopleCare: [
        'It is discussed as a GHRH analog, which makes users think in GH-axis, sleep, recovery, and lab-note contexts.',
        'Most app workflows are practical: vial amount, BAC volume, concentration, active vial, and schedule adherence.',
        'The bundled source set is identity-focused, so the app should not overstate clinical certainty.',
      ],
      verifyBeforeUse: [
        'Exact vial label, amount, lot, source, expiration, and whether it is sermorelin alone or a blend.',
        'Formulation state, storage instructions, and whether the vial has already been reconstituted.',
        'Any COA, sterility/endotoxin documentation, or supplier handling notes the user has.',
      ],
      trackInApp: [
        'Vial or kit inventory with amount, BAC volume, concentration, reconstitution date, and active-vial state.',
        'Schedule adherence, missed doses, sleep/recovery notes, injection-site notes, and user-entered lab notes.',
        'Source-quality flags when the entry is missing label photos, lot, expiration, or supplier documentation.',
      ],
      realityCheck: 'Sermorelin is represented here with identity-level bundled sourcing. PeptideOS should make the records clean and the evidence limits visible.',
    },
    reviewSummary: 'Sermorelin is tracked as a GHRH analog reference compound with identity, vial, and logging metadata. The bundled source set supports identity and practical tracking, not protocol recommendations.',
    mechanismTargets: [
      'growth-hormone-releasing hormone receptor context',
      'GH-axis signaling context',
      'IGF-1 tracking context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for inventory creation',
        finding: 'PubChem supports sermorelin identity and naming metadata used for library search and app records.',
        citationIds: ['pubchem-sermorelin'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not provide a current approved-product label or dosing protocol evidence.',
      },
      {
        design: 'product-verification-context',
        population: 'Users adding sermorelin vials, kits, or blends to inventory',
        finding: 'Identity metadata supports name matching, but vial amount, lot, source, sterility documentation, and blend status must come from the user-confirmed product label.',
        citationIds: ['pubchem-sermorelin'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate any specific vial, supplier, concentration, or route claim.',
      },
    ],
    safetySignals: [
      'Research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Blends can make dose math and effect attribution unreliable unless every component is captured.',
      'Missing vial amount or BAC volume prevents reliable concentration and inventory-depletion math.',
    ],
    practicalNotes: [
      'Ask whether the label says sermorelin alone or a blend before creating inventory.',
      'For kits, group inventory while preserving vial-level amount, lot, and container state.',
      'Use Peppi to identify missing fields from label photos, then require user approval before saving.',
    ],
    evidenceGaps: [
      'No current US approved-product label is attached to this bundled entry.',
      'The app source set does not establish comparative clinical outcomes or a recommended protocol.',
      'Community-market products may not match literature identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats sermorelin as research-use tracking context unless the user supplies a specific labeled product record.',
      citationIds: ['pubchem-sermorelin'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, or clinical use.',
    },
    peptideOSActions: [
      'Add sermorelin vials or kits to inventory from a label photo after user confirmation.',
      'Ask for missing vial amount, lot, source, expiration, storage, BAC volume, or reconstitution date.',
      'Calculate concentration from confirmed vial amount and diluent volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Summarize adherence, sleep/recovery notes, lab notes, and inventory depletion without medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-sermorelin',
      title: 'Sermorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16132413',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
