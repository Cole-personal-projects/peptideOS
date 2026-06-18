import type { ReferenceCompound } from '../schema';

export const cjc1295: ReferenceCompound = {
  id: 'cjc-1295',
  name: 'CJC-1295',
  aliases: ['Modified GRF 1-29', 'GRF 1-29 CJC1295'],
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
      citationIds: ['pubchem-cjc-1295'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 2, unit: 'mg' }, { value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A growth-hormone secretagogue peptide tracked in GH-axis research contexts.',
  researcherDetails: 'CJC-1295 is represented as a peptide reference compound for identity, vial, route, and logging metadata. PeptideOS does not encode protocol guidance for this entry.',
  mechanism: 'Studied as a growth-hormone-releasing hormone analog interacting with GHRH receptor signaling.',
  safety: 'Research peptide. Regulatory status and evidence base vary by context; this entry is for tracking metadata only.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'CJC-1295 is a GH-axis research peptide where PeptideOS should distinguish exact label identity, DAC ambiguity, blends, and vial math.',
      whyPeopleCare: [
        'Users often discuss CJC-1295 alongside modified GRF 1-29, DAC/non-DAC naming, and GH-secretagogue stacks.',
        'The label may not clearly distinguish CJC-1295 variants or blends, which matters for record quality.',
        'Inventory, concentration, active-vial state, and schedule logs are the practical high-value workflows.',
      ],
      verifyBeforeUse: [
        'Exact label text, whether DAC status is stated, vial amount, lot, source, expiration, and route.',
        'Whether the product is CJC-1295 alone, modified GRF 1-29, or a blend with ipamorelin or another secretagogue.',
        'COA, sterility/endotoxin documentation, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with compound label, DAC/variant note, vial amount, BAC volume, concentration, and active-vial state.',
        'Schedule adherence, missed doses, injection-site notes, sleep/recovery notes, and user-entered lab notes.',
        'Ambiguity flags when the label does not clearly state variant, blend components, lot, or amount.',
      ],
      realityCheck: 'CJC-1295 naming is messy in the marketplace. PeptideOS should capture exactly what is on the vial and avoid converting community shorthand into medical certainty.',
    },
    reviewSummary: 'CJC-1295 is tracked as a GHRH-analog research compound with important identity ambiguity around variant naming and blends. PeptideOS focuses on exact label capture, vial math, and transparent uncertainty.',
    mechanismTargets: [
      'growth-hormone-releasing hormone receptor context',
      'GH-axis signaling context',
      'variant and blend identity tracking',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for inventory creation',
        finding: 'PubChem supports CJC-1295 identity and naming metadata used for library search and app records.',
        citationIds: ['pubchem-cjc-1295'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not resolve DAC/non-DAC marketplace ambiguity or establish protocol guidance.',
      },
      {
        design: 'variant-and-product-verification-context',
        population: 'Users adding CJC-1295, modified GRF, DAC-labeled, non-DAC, or blended vials to inventory',
        finding: 'Identity metadata can anchor the reference entry, but variant status, blend components, vial amount, lot, source, and sterility documentation must be captured from the exact product.',
        citationIds: ['pubchem-cjc-1295'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate marketplace shorthand, supplier quality, concentration, sterility, or clinical use.',
      },
    ],
    safetySignals: [
      'Unclear variant naming can corrupt schedule interpretation and user records.',
      'Blended vials require component-level capture before inventory, schedule, or log creation.',
      'Research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
    ],
    practicalNotes: [
      'Ask the user to confirm DAC status or mark it unknown rather than guessing.',
      'Keep blend components explicit if the vial contains ipamorelin or another compound.',
      'Calculate concentration only after vial amount and BAC volume are confirmed.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The source set does not establish clinical outcome certainty or dosing protocols.',
      'Marketplace naming may not match the exact compound identity represented in reference databases.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats CJC-1295 as research-use tracking context with identity metadata from PubChem.',
      citationIds: ['pubchem-cjc-1295'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, variant identity, or clinical use.',
    },
    peptideOSActions: [
      'Add CJC-1295 vials or kits to inventory after user confirms exact label text and variant details.',
      'Ask whether DAC status is known and whether the vial is blended before saving.',
      'Calculate concentration from confirmed vial amount and diluent volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Flag missing lot, source, variant, vial amount, BAC volume, reconstitution date, or container state.',
    ],
  },
  citations: [
    {
      id: 'pubchem-cjc-1295',
      title: 'CJC-1295 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/91971820',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
