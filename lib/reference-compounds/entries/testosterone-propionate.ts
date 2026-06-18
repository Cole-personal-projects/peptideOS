import type { ReferenceCompound } from '../schema';

export const testosteronePropionate: ReferenceCompound = {
  id: 'testosterone-propionate',
  name: 'Testosterone Propionate',
  aliases: ['Testosterone 17-propionate', 'Testosterone propanoate'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'im',
  supportedRoutes: ['im'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Concentration-based oil solution',
      concentration: { value: 100, unit: 'mg/ml' },
      sourceNote: 'Historical oil-solution concentration placeholder for logging; verify against the actual container label.',
      citationIds: ['pubchem-testosterone-propionate'],
    },
  ],
  beginnerSummary: 'A shorter ester testosterone compound tracked as a hormone/endocrine compound rather than a peptide.',
  researcherDetails: 'Testosterone propionate is an esterified testosterone compound. Reference metadata captures identity and concentration-compatible tracking fields without protocol guidance.',
  mechanism: 'Acts as an androgen receptor ligand after ester cleavage to testosterone.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on product labeling; keep product-specific label instructions attached to the actual container.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Testosterone Propionate is a shorter-ester testosterone entry where source quality, concentration verification, and ester-specific logging need extra transparency.',
      whyPeopleCare: [
        'Users may encounter propionate in research or compounded-style contexts even when the app has identity metadata rather than a current bundled label.',
        'It should stay distinct from cypionate and enanthate because ester identity affects inventory, search, and log interpretation.',
        'The app value is clean concentration math, vial grouping, source flags, and longitudinal injection history without care advice.',
      ],
      verifyBeforeUse: [
        'Exact container label, source, lot, expiration, concentration, vial volume, ester name, route, and any prescription or COA documentation.',
        'Whether the item is pharmacy-labeled, manufacturer-labeled, compounded, imported, or research-market before Peppi saves inventory.',
        'Any mismatch between the label, source paperwork, and user-entered compound name should be resolved before scheduling.',
      ],
      trackInApp: [
        'Inventory grouped by propionate ester, concentration, source, lot, expiration, and sealed or active state.',
        'Injection logs, schedule adherence, site rotation, missed entries, and remaining vial estimates.',
        'Source-quality flags, label photos, optional user-entered lab dates, symptom notes, and tolerability notes.',
      ],
      realityCheck: 'PeptideOS currently treats testosterone propionate as identity-backed in the bundled data; it should be transparent when a user container is not supported by a label citation.',
    },
    reviewSummary: 'Testosterone propionate is represented as an identity-backed hormone/endocrine compound. PeptideOS supports ester-specific inventory and logging while clearly flagging that the bundled entry uses compound identity metadata rather than a current label record.',
    mechanismTargets: [
      'androgen receptor',
      'testosterone ester depot',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Users who need ester-specific search and inventory matching',
        finding: 'PubChem supports identity metadata for testosterone propionate so PeptideOS can distinguish this ester from other testosterone forms.',
        citationIds: ['pubchem-testosterone-propionate'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'inventory-and-source-transparency-reference',
        population: 'Users entering concentration-based propionate containers',
        finding: 'The bundled record supports identity and concentration-compatible fields, but container quality must come from the user-confirmed label and source documents.',
        citationIds: ['pubchem-testosterone-propionate'],
        sourceQuality: 'source-backed',
        limitations: 'No bundled DailyMed label citation is attached to this entry.',
      },
    ],
    safetySignals: [
      'Flag missing concentration, source, lot, expiration, route, or ester confirmation before saving inventory.',
      'Use source-quality warnings when the container is not tied to a label-backed or prescription source.',
      'Track user-entered adverse notes, site reactions, lab dates, and missed entries without interpreting hormone management.',
    ],
    practicalNotes: [
      'Keep propionate separate from enanthate and cypionate in library search, inventory grouping, and Peppi summaries.',
      'Peppi can calculate volume only from user-confirmed concentration and user-entered amount.',
      'Ask for label photos or COA/source notes when the item is not manufacturer or pharmacy labeled.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine dose, frequency, lab targets, or whether testosterone is appropriate for a user.',
      'This bundled entry lacks a label-backed citation, so product-specific safety and handling details must come from the user-provided label.',
    ],
    regulatoryStatus: {
      status: 'unknown',
      region: 'US',
      summary: 'The bundled propionate entry is identity-backed by PubChem only; PeptideOS should require user-confirmed container and source details for tracking.',
      citationIds: ['pubchem-testosterone-propionate'],
      sourceQuality: 'source-backed',
      limitations: 'No bundled US product label citation is attached.',
    },
    peptideOSActions: [
      'Add a testosterone propionate vial only after the user confirms ester, concentration, source, lot, expiration, and route.',
      'Attach source-quality flags and label photos when source documentation is incomplete.',
      'Calculate injection volume from user-confirmed concentration and user-entered amount.',
      'Track adherence, injection sites, vial depletion, optional lab notes, symptom notes, and source-quality context.',
    ],
  },
  citations: [
    {
      id: 'pubchem-testosterone-propionate',
      title: 'Testosterone Propionate compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5995',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
