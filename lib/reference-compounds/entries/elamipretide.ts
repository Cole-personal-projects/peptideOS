import type { ReferenceCompound } from '../schema';

export const elamipretide: ReferenceCompound = {
  id: 'elamipretide',
  name: 'Elamipretide',
  aliases: ['SS-31', 'MTP-131', 'Bendavia'],
  compoundType: 'peptide',
  category: 'longevity',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg lyophilized vial',
      totalAmount: { value: 10, unit: 'mg' },
      sourceNote: 'Inventory preset for research tracking; verify against the actual container label.',
      citationIds: ['pubchem-elamipretide'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A mitochondria-targeted tetrapeptide commonly tracked in longevity and mitochondrial research contexts.',
  researcherDetails: 'Elamipretide is indexed by PubChem as a defined peptide compound. PeptideOS models it as a reference compound for identity, route, and inventory logging only.',
  mechanism: 'Studied for interactions with mitochondrial inner-membrane biology and cardiolipin-associated pathways.',
  safety: 'Research compound context. This entry is not medical advice or use guidance.',
  storage: 'Storage should follow the actual product or study-material label attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Elamipretide is a mitochondrial peptide where PeptideOS should track vial identity, cardiolipin-pathway context, and investigational uncertainty.',
      whyPeopleCare: [
        'It is discussed in mitochondrial health and longevity circles because of inner-membrane and cardiolipin biology.',
        'Users may encounter research vials or study-material style labels where amount, source, and container state matter.',
        'The bundled citation supports identity metadata, while broader clinical status must remain transparent unless stronger sources are added.',
      ],
      verifyBeforeUse: [
        'Exact label name, alias, vial amount, route, lot, expiration, source, and container state.',
        'Whether the product is Elamipretide, SS-31, MTP-131, Bendavia, a blend, or a vendor-specific label.',
        'COA, purity, sterility/endotoxin documentation, storage instructions, and any study-material documentation when available.',
      ],
      trackInApp: [
        'Vial inventory with total amount, BAC volume, concentration, reconstitution date, and active vial status.',
        'User-entered schedule, adherence, mitochondrial/fatigue context notes, exercise context, tolerability notes, and stack changes.',
        'Evidence and source-quality flags when source, lot, amount, or documentation is missing.',
      ],
      realityCheck: 'Elamipretide has serious mitochondrial-research interest, but this app entry should not overclaim beyond the bundled identity source.',
    },
    reviewSummary: 'Elamipretide is represented as a mitochondrial research peptide with PubChem-backed identity metadata and vial-tracking workflows.',
    mechanismTargets: [
      'mitochondrial inner membrane context',
      'cardiolipin-associated pathway research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for mitochondrial peptide tracking',
        finding: 'PubChem supports identity and naming metadata for Elamipretide.',
        citationIds: ['pubchem-elamipretide'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users logging Elamipretide research vials or labeled study-style containers',
        finding: 'PeptideOS needs confirmed vial amount, source, lot, storage, and reconstitution details before inventory and schedule tracking can be trusted.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is tracking and source-quality context, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish an approved-label safety profile.',
      'Research vials can introduce identity, purity, sterility, endotoxin, amount, and storage uncertainty.',
      'Fatigue or mitochondrial-context notes are highly confounded by sleep, training, illness, medications, and stack changes.',
    ],
    practicalNotes: [
      'Capture alias exactly because SS-31, MTP-131, Bendavia, and Elamipretide may appear on labels.',
      'Require vial amount and BAC volume before concentration math.',
      'Keep user notes tied to timing and stack changes so Peppi summaries stay grounded.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety or efficacy claims.',
      'Marketed research material may not match study material in identity, purity, formulation, concentration, or storage.',
    ],
    regulatoryStatus: {
      status: 'investigational',
      region: 'US',
      summary: 'PeptideOS treats Elamipretide as investigational/research context in this library entry, with PubChem identity metadata and no approved US product label attached here.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'This status is conservative app-context labeling; stronger regulatory sources should replace it when added to the curated source set.',
    },
    peptideOSActions: [
      'Add Elamipretide or SS-31 vials to inventory after user confirmation.',
      'Calculate concentration from confirmed vial amount and BAC water volume.',
      'Ask for alias, lot, source, expiration, storage, container state, and documentation when missing.',
      'Track adherence, fatigue/context notes, exercise context, tolerability notes, reconstitution history, and inventory depletion.',
      'Surface investigational and source-quality flags in Peppi summaries.',
    ],
  },
  citations: [
    {
      id: 'pubchem-elamipretide',
      title: 'Elamipretide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/11764719',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
