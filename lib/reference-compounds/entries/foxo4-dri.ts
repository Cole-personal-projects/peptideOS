import type { ReferenceCompound } from '../schema';

export const foxo4Dri: ReferenceCompound = {
  id: 'foxo4-dri',
  name: 'FOXO4-DRI',
  aliases: ['FOXO4 D-retro-inverso peptide', 'FOXO4-DRI peptide'],
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
      sourceNote: 'Inventory preset for tracking only; verify against the actual vial label.',
      citationIds: ['pubchem-foxo4-dri'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A senescence-research peptide commonly tracked in longevity research contexts.',
  researcherDetails: 'FOXO4-DRI is indexed by PubChem as a defined peptide compound. PeptideOS tracks identity and inventory metadata only.',
  mechanism: 'Studied in cellular senescence research contexts involving FOXO4 and p53 interaction pathways.',
  safety: 'Research peptide context. This entry is not medical advice or use guidance.',
  storage: 'Follow the actual vial or material-label storage instructions.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'FOXO4-DRI is a senescence-research peptide where PeptideOS should prioritize vial verification, source quality, and aggressive uncertainty labeling.',
      whyPeopleCare: [
        'It is discussed in longevity communities because of FOXO4/p53 and cellular-senescence research interest.',
        'Users may see lyophilized research vials where identity, amount, and purity are especially important.',
        'The bundled source set supports identity metadata and does not establish a consumer or clinical protocol.',
      ],
      verifyBeforeUse: [
        'Exact label name, vial amount, route, lot, expiration, source, and container state.',
        'Whether the label specifies FOXO4-DRI, D-retro-inverso peptide, a blend, or another senescence-related compound.',
        'COA, purity, sequence/identity documentation, sterility/endotoxin documentation, and storage instructions when available.',
      ],
      trackInApp: [
        'Vial or kit inventory with total amount, BAC volume, concentration, reconstitution date, and active vial status.',
        'User-entered schedule, adherence, tolerability notes, recovery/longevity context notes, and stack changes.',
        'Source-quality flags for missing identity documentation, lot, amount, storage, or sterility information.',
      ],
      realityCheck: 'FOXO4-DRI is a high-uncertainty longevity research compound. PeptideOS should support audit-grade records and avoid implying proven outcomes.',
    },
    reviewSummary: 'FOXO4-DRI is included as a research peptide with PubChem-backed identity metadata and explicit senescence-research uncertainty flags.',
    mechanismTargets: [
      'FOXO4 and p53 interaction research',
      'cellular senescence context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for senescence peptide tracking',
        finding: 'PubChem supports identity and naming metadata for FOXO4-DRI.',
        citationIds: ['pubchem-foxo4-dri'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-vial-tracking-context',
        population: 'Users logging FOXO4-DRI lyophilized vials or kits',
        finding: 'Reliable tracking depends on confirmed sequence/identity documentation, vial amount, source, lot, storage, and reconstitution details.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This describes product-quality and tracking uncertainty, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish approved-label safety context.',
      'Research vials can introduce identity, sequence, purity, sterility, endotoxin, amount, and storage uncertainty.',
      'Longevity notes are highly confounded by other compounds, training, diet, sleep, illness, and subjective expectations.',
    ],
    practicalNotes: [
      'Capture sequence or identity documentation when available, not just the marketing label.',
      'Require vial amount and BAC volume before concentration math.',
      'Keep logs tied to the exact vial or kit because source quality is a central uncertainty.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety or efficacy claims.',
      'Research-market material may not match the reference identity record in sequence, purity, form, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats FOXO4-DRI as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment depends on product claims and source; this entry does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add FOXO4-DRI vials or kits to inventory after user confirmation.',
      'Calculate concentration from confirmed vial amount and BAC water volume.',
      'Ask for identity documentation, lot, source, expiration, storage, container state, and sterility documentation when missing.',
      'Track adherence, tolerability notes, longevity-context notes, stack changes, reconstitution history, and inventory depletion.',
      'Surface high-uncertainty and source-quality flags in Peppi summaries.',
    ],
  },
  citations: [
    {
      id: 'pubchem-foxo4-dri',
      title: 'FOXO4-DRI compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/167312269',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
