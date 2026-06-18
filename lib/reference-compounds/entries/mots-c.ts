import type { ReferenceCompound } from '../schema';

export const motsC: ReferenceCompound = {
  id: 'mots-c',
  name: 'MOTS-c',
  aliases: ['Mitochondrial open reading frame of the 12S rRNA-c', 'MOTS-c human'],
  compoundType: 'peptide',
  category: 'longevity',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-mots-c'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }, { value: 10, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A mitochondrial-derived peptide tracked in longevity, exercise-response, and metabolic research contexts.',
  researcherDetails: 'MOTS-c is a mitochondrial-derived peptide discussed in skeletal-muscle metabolism, insulin-sensitivity, and exercise-response research. PeptideOS treats it as research-use identity, vial, reconstitution, and logging context.',
  mechanism: 'Studied in mitochondrial signaling, skeletal-muscle metabolism, AMPK-related pathways, and exercise-response biology.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'early-human',
    biohackerBrief: {
      headline: 'MOTS-c is a metabolic-longevity research peptide where PeptideOS should make vial math, exercise/metabolic notes, and evidence limits easy to track.',
      whyPeopleCare: [
        'It is discussed as a mitochondrial-derived peptide connected to skeletal-muscle metabolism and insulin-sensitivity research.',
        'Human observational and exercise-response contexts make it interesting, but not equivalent to an approved metabolic drug label.',
        'Users commonly encounter lyophilized research vials, so amount, BAC volume, concentration, and active-vial state matter.',
      ],
      verifyBeforeUse: [
        'Exact vial amount, lot, source, label name, route, and whether the container is lyophilized or already liquid.',
        'Whether the supplier provides COA, sterility/endotoxin documentation, storage instructions, and expiration details.',
        'Whether the user is tracking MOTS-c alone or as part of a metabolic/longevity stack.',
      ],
      trackInApp: [
        'Inventory by vial or kit with vial amount, reconstitution date, BAC volume, concentration, and remaining amount.',
        'Metabolic context notes, energy/exercise notes, sleep/recovery notes, appetite notes, and user-entered biomarker context.',
        'Schedule adherence, missed doses, active vial state, and evidence/source flags over time.',
      ],
      realityCheck: 'MOTS-c is biologically interesting, but research interest is not an approved-product label. PeptideOS should help users track exactly what they have and what they logged without overstating certainty.',
    },
    reviewSummary: 'MOTS-c has mitochondrial and metabolic research context, including human biomarker/exercise-response literature and preclinical mechanism work. PeptideOS treats it as research-use vial, reconstitution, and pattern-tracking context.',
    mechanismTargets: [
      'mitochondrial-derived peptide signaling',
      'skeletal-muscle metabolism',
      'AMPK-related metabolic context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity users need for library search and vial matching',
        finding: 'PubChem supports identity and compound-level reference metadata for MOTS-c.',
        citationIds: ['pubchem-mots-c'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'early-human-metabolic-context',
        population: 'Human metabolic, exercise-response, or biomarker contexts discussed in the broader MOTS-c literature',
        finding: 'The app treats MOTS-c as early human/research context rather than an approved injectable-product evidence base.',
        citationIds: [],
        sourceQuality: 'uncited-emerging',
        limitations: 'The bundled source set does not attach an approved product label or strong human interventional evidence for user-entered MOTS-c vials.',
      },
    ],
    safetySignals: [
      'No approved US product label is attached to this MOTS-c reference entry.',
      'Research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Metabolic, appetite, sleep, exercise, and recovery notes can be noisy without consistent schedule and context logging.',
    ],
    practicalNotes: [
      'Capture vial amount and BAC volume before calculating concentration.',
      'Track exercise, sleep, appetite, energy, body-weight trend notes, and user-entered biomarker context separately from dose logs.',
      'Use grouped inventory for kits while preserving vial-level amount, lot, source, and active vial state.',
    ],
    evidenceGaps: [
      'No US approved product label is attached to this reference entry.',
      'Human efficacy and safety evidence for research-market MOTS-c injectable products is limited in the bundled source set.',
      'Community-market material may not match literature identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats MOTS-c as research-use tracking context with no approved US product label attached to this reference entry.',
      citationIds: [],
      sourceQuality: 'uncited-emerging',
      limitations: 'This app entry does not validate legality, sourcing, product quality, or clinical use.',
    },
    peptideOSActions: [
      'Add MOTS-c vials or kits to inventory from a label photo after user confirmation.',
      'Calculate concentration from user-confirmed vial amount and BAC water volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Track adherence, missed doses, metabolic notes, energy/exercise notes, appetite notes, and inventory depletion.',
      'Flag missing lot, source, vial amount, BAC volume, reconstitution date, or container state.',
    ],
  },
  citations: [
    {
      id: 'pubchem-mots-c',
      title: 'MOTS-c compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/146675088',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
