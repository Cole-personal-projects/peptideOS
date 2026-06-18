import type { ReferenceCompound } from '../schema';

export const bpc157: ReferenceCompound = {
  id: 'bpc-157',
  name: 'BPC-157',
  aliases: ['Body Protection Compound 157', 'Pentadecapeptide BPC 157', 'PL 14736'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'oral'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Common vial-size preset for inventory math; verify against the actual container label.',
      citationIds: ['pmc-bpc157-wound-healing'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A synthetic pentadecapeptide commonly tracked in healing/recovery research contexts.',
  researcherDetails: 'BPC-157 is described in preclinical literature as a stable gastric pentadecapeptide. PeptideOS treats it as a research compound reference entry for logging and inventory only.',
  mechanism: 'Studied in tissue-repair models with proposed links to vascular, nitric oxide, and cytoprotective pathways.',
  safety: 'Research peptide. Human evidence and regulatory status vary; this entry is not medical advice or use guidance.',
  storage: 'Lyophilized research peptides are commonly tracked with vial-specific storage notes; follow the actual container label.',
  referenceProfile: {
    evidenceTier: 'preclinical',
    biohackerBrief: {
      headline: 'BPC-157 is a high-interest recovery peptide where PeptideOS should be excellent at label capture, reconstitution math, inventory tracking, and uncertainty flags.',
      whyPeopleCare: [
        'It is heavily discussed for tissue, tendon, gut, and recovery contexts despite limited human-grade evidence.',
        'Preclinical literature describes wound-healing and cytoprotective models that users often reference.',
        'Most real-world products are lyophilized research vials, making vial amount, diluent volume, lot, source, and container state critical.',
      ],
      verifyBeforeUse: [
        'Exact vial amount, lot, source, label name, route, and whether the vial is lyophilized or already reconstituted.',
        'Whether the product is actually labeled BPC-157, a blend, or a vague research name.',
        'COA, sterility/endotoxin documentation, expiration, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Inventory by vial or kit, including vial amount, reconstitution date, BAC volume, concentration, and active vial status.',
        'Recovery context notes, site/location notes, schedule adherence, missed doses, and user-entered response patterns.',
        'Evidence and sourcing flags so Peppi can warn when vial amount, BAC volume, lot, or source is missing.',
      ],
      realityCheck: 'BPC-157 is not a settled clinical product. PeptideOS should help users avoid sloppy records and bad math, while making the human-evidence gap and product-quality uncertainty impossible to miss.',
    },
    reviewSummary: 'BPC-157 has high community interest and preclinical wound-healing literature, but lacks strong approved-label or large human clinical evidence. PeptideOS treats it as research-use inventory and math context, not as therapeutic guidance.',
    mechanismTargets: [
      'wound-healing models',
      'nitric oxide pathway context',
      'vascular and cytoprotective signaling context',
    ],
    clinicalEvidence: [
      {
        design: 'preclinical-and-review-literature',
        population: 'Animal and mechanistic models summarized in wound-healing literature',
        finding: 'Review literature describes BPC-157 wound-healing and tissue-repair models, while the app source set does not establish approved clinical use.',
        citationIds: ['pmc-bpc157-wound-healing'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'community-market-risk-context',
        population: 'Users encountering research-market BPC-157 vials',
        finding: 'The app should treat product identity, sterility, concentration, and source documentation as unresolved unless confirmed from the exact vial or supplier documentation.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is a transparent risk-context entry, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'Human safety and efficacy evidence is limited compared with approved products.',
      'Research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Reconstitution math errors can corrupt every later inventory, schedule, and log calculation.',
    ],
    practicalNotes: [
      'Always capture vial amount and BAC volume before calculating concentration.',
      'For kits, create grouped inventory records while retaining vial-level amount, lot, and container state.',
      'Peppi should ask clarifying questions before adding inventory when the label photo does not show amount, lot, or source.',
    ],
    evidenceGaps: [
      'No US approved product label is attached to this reference entry.',
      'Large, high-quality human efficacy and safety trials are not established in the bundled source set.',
      'Community-market material may not match research literature identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats BPC-157 as research-use context with no approved US product label attached to this reference entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory handling varies by market and product claims; this app entry does not validate legality, sourcing, or clinical use.',
    },
    peptideOSActions: [
      'Add BPC-157 vials or kits to inventory from a label photo after user confirmation.',
      'Calculate concentration from user-confirmed vial amount and BAC water volume.',
      'Build schedules only from user-entered instructions and keep them tied to a specific active vial.',
      'Flag missing lot, source, vial amount, BAC volume, reconstitution date, or container state.',
      'Summarize recovery notes, adherence, inventory depletion, and reconstitution history without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pmc-bpc157-wound-healing',
      title: 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8275860/',
      source: 'PMC',
      year: 2021,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
