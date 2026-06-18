import type { ReferenceCompound } from '../schema';

export const kisspeptin10: ReferenceCompound = {
  id: 'kisspeptin-10',
  name: 'Kisspeptin-10',
  aliases: ['Metastin 45-54', 'KP-10'],
  compoundType: 'peptide',
  category: 'sexual-reproductive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Common tracking preset for inventory math; verify against the actual vial label.',
      citationIds: ['pubchem-kisspeptin-10'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A kisspeptin fragment tracked in reproductive-axis research contexts.',
  researcherDetails: 'Kisspeptin-10 is a short peptide indexed by PubChem. PeptideOS treats it as sexual/reproductive reference metadata for local logging only.',
  mechanism: 'Studied as a kisspeptin receptor ligand related to hypothalamic-pituitary-gonadal axis signaling.',
  safety: 'Research peptide context. This entry does not provide administration or treatment guidance.',
  storage: 'Follow the storage instructions on the actual material label.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Kisspeptin-10 is a reproductive-axis research peptide where PeptideOS should emphasize source transparency, vial math, and clear separation from label-backed hormones.',
      whyPeopleCare: [
        'Biohacking users may group Kisspeptin-10 with GnRH, HCG, and testosterone-adjacent experiments, so identity matching matters.',
        'Research-market vials often need explicit source, COA, lot, vial amount, and reconstitution capture before any schedule exists.',
        'The practical app value is clean inventory, schedule history, and transparency around limited label-backed evidence.',
      ],
      verifyBeforeUse: [
        'Exact label, source, lot, expiration, vial amount, purity or COA if available, diluent volume, route, and container state.',
        'Whether the vial is actually Kisspeptin-10/KP-10 rather than another kisspeptin fragment or reproductive peptide.',
        'Source documentation and label photos before Peppi creates inventory or schedule entries.',
      ],
      trackInApp: [
        'Inventory by vial or kit with total mg, BAC water volume, source, lot, expiration, and sealed or active state.',
        'Schedule adherence, missed entries, remaining vial estimate, and user-entered response notes.',
        'Source-quality flags, evidence-tier warnings, COA/photo attachments, and reproductive-axis context notes.',
      ],
      realityCheck: 'Kisspeptin-10 is identity-backed in this library, not label-backed; PeptideOS should be useful for organization while being blunt about evidence and source limits.',
    },
    reviewSummary: 'Kisspeptin-10 is represented as an identity-backed research peptide. PeptideOS supports transparent source capture, reconstitution math, and schedule logging without implying clinical validation.',
    mechanismTargets: [
      'kisspeptin receptor',
      'hypothalamic-pituitary-gonadal axis',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Users who need alias, identity, and search matching for KP-10',
        finding: 'PubChem supports compound identity metadata for Kisspeptin-10.',
        citationIds: ['pubchem-kisspeptin-10'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-inventory-transparency-reference',
        population: 'Users entering Kisspeptin-10 research vials',
        finding: 'The bundled record supports identity and vial-math fields, but product quality and route context must come from user-confirmed source documentation.',
        citationIds: ['pubchem-kisspeptin-10'],
        sourceQuality: 'source-backed',
        limitations: 'No bundled label-backed clinical source is attached to this entry.',
      },
    ],
    safetySignals: [
      'Flag missing source, COA, lot, expiration, vial amount, or route before saving inventory.',
      'Keep research-use transparency visible when the item is not tied to an approved label.',
      'Track user-entered tolerability notes, missed entries, and active-vial age without making endocrine claims.',
    ],
    practicalNotes: [
      'Ask for label photos and COA/source notes as first-class inventory fields.',
      'Peppi can calculate concentration only from user-confirmed vial amount and diluent volume.',
      'Group identical vials only when compound name, vial amount, source, lot, and expiration match.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine protocols, endocrine outcomes, or whether Kisspeptin-10 is appropriate for a user.',
      'The bundled entry lacks label-backed product context, so user containers need explicit source-quality flags.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Kisspeptin-10 as a research-use identity-backed compound in the bundled library.',
      citationIds: ['pubchem-kisspeptin-10'],
      sourceQuality: 'source-backed',
      limitations: 'No bundled US approved-label citation is attached.',
    },
    peptideOSActions: [
      'Add Kisspeptin-10 vials only after the user confirms label, source, amount, lot, expiration, and route.',
      'Request COA/source documentation and label photos when quality details are missing.',
      'Calculate concentration from user-confirmed vial amount and diluent volume.',
      'Track schedule adherence, active-vial age, inventory depletion, user notes, and research-use transparency flags.',
    ],
  },
  citations: [
    {
      id: 'pubchem-kisspeptin-10',
      title: 'Kisspeptin-10 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/25240297',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
