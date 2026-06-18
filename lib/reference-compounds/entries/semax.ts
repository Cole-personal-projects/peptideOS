import type { ReferenceCompound } from '../schema';

export const semax: ReferenceCompound = {
  id: 'semax',
  name: 'Semax',
  aliases: ['ACTH 4-7 Pro-Gly-Pro', 'MEHFPGP'],
  compoundType: 'peptide',
  category: 'cognitive',
  defaultRoute: 'intranasal',
  supportedRoutes: ['intranasal', 'subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Intranasal solution container',
      concentration: { value: 10, unit: 'mg/ml' },
      sourceNote: 'Concentration placeholder for inventory math only; verify against the actual container label.',
      citationIds: ['pubchem-semax'],
    },
  ],
  beginnerSummary: 'A peptide tracked in cognitive and neuropeptide research contexts.',
  researcherDetails: 'Semax is represented as a peptide reference compound for identity, route, and concentration-container tracking metadata.',
  mechanism: 'Studied as an ACTH fragment analog in neuropeptide and cognitive research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Semax is a cognitive peptide entry where PeptideOS needs clean concentration capture, nasal-container logging, and transparent evidence flags.',
      whyPeopleCare: [
        'It is commonly discussed in nootropic and neuropeptide research circles.',
        'Users often encounter it as a nasal solution, which makes concentration, sprays-per-bottle, and container state more important than vial math.',
        'The bundled source set supports identity and alias matching, not a settled clinical protocol.',
      ],
      verifyBeforeUse: [
        'Exact label name, concentration, bottle volume, route, lot, source, and expiration from the container.',
        'Whether the product is Semax alone, a blend, or a vendor-specific analog name.',
        'COA, storage instructions, and any spray-volume information when the user wants inventory depletion tracking.',
      ],
      trackInApp: [
        'Concentration-container inventory with bottle volume, active container state, and source notes.',
        'User-entered schedule, missed entries, cognitive context notes, sleep notes, and tolerability notes.',
        'Evidence/source flags when concentration, lot, bottle volume, or supplier documentation is missing.',
      ],
      realityCheck: 'Semax has strong community interest, but this app entry is identity-backed tracking context. PeptideOS should preserve the uncertainty instead of turning a label into advice.',
    },
    reviewSummary: 'Semax is modeled as a research peptide with PubChem-backed identity metadata and high practical need for concentration-container tracking.',
    mechanismTargets: [
      'ACTH fragment analog context',
      'neuropeptide signaling research',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference chemistry and alias matching for cognitive-peptide library users',
        finding: 'PubChem supports identity and naming metadata for Semax.',
        citationIds: ['pubchem-semax'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-market-tracking-context',
        population: 'Users logging Semax nasal solutions or research containers',
        finding: 'Product concentration, bottle volume, route, and source quality must be confirmed from the exact container before PeptideOS can produce reliable tracking math.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is a product-quality and tracking context note, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'Human-use assumptions are not established by the bundled citation set.',
      'Nasal solutions can vary by concentration, volume, preservative system, and spray output.',
      'Identity, purity, storage, and sterility are unresolved unless documented by the exact product source.',
    ],
    practicalNotes: [
      'Store concentration and bottle volume separately so inventory depletion does not depend on vague product names.',
      'Ask for spray-volume information only when the user wants spray-based depletion tracking.',
      'Keep Semax aliases searchable while preserving the exact label text entered by the user.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled source set does not establish standardized human protocol, safety, or efficacy claims.',
      'Vendor products may differ from the reference identity record in purity, concentration, stability, and route presentation.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Semax as research-use context with PubChem-backed identity metadata and no approved US label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory handling can vary by formulation, claim, and source; this app entry does not validate legality or clinical use.',
    },
    peptideOSActions: [
      'Add a Semax nasal bottle or container to inventory after user confirmation.',
      'Ask for missing concentration, volume, lot, expiration, source, route, or spray-output details before saving.',
      'Build schedules only from user-entered instructions and tie logs to the active container.',
      'Track cognitive notes, sleep notes, tolerability notes, adherence, and remaining-container estimates.',
      'Summarize user-entered patterns without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-semax',
      title: 'Semax compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9811102',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
