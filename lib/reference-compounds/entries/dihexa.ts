import type { ReferenceCompound } from '../schema';

export const dihexa: ReferenceCompound = {
  id: 'dihexa',
  name: 'Dihexa',
  aliases: ['N-hexanoic-Tyr-Ile aminohexanoic amide', 'PNB-0408'],
  compoundType: 'small-molecule',
  category: 'cognitive',
  defaultRoute: 'oral',
  supportedRoutes: ['oral', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or powder container',
      sourceNote: 'Reference container type only; amount and form must come from the actual product label.',
      citationIds: ['pubchem-dihexa'],
    },
  ],
  beginnerSummary: 'A small molecule tracked in cognitive and neurotrophic research contexts.',
  researcherDetails: 'Dihexa is represented as a small-molecule reference compound for identity, route, and container tracking metadata.',
  mechanism: 'Studied in neurotrophic and hepatocyte growth factor pathway research contexts.',
  safety: 'Research small molecule. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'Dihexa is a high-uncertainty cognitive research compound where PeptideOS should emphasize identity, source quality, and conservative logging.',
      whyPeopleCare: [
        'It is discussed in neurotrophic and cognitive research communities because of HGF-pathway interest.',
        'Users may encounter capsules, powders, or labeled research containers with very different practical tracking needs.',
        'The bundled source set supports compound identity, not a validated human-use protocol.',
      ],
      verifyBeforeUse: [
        'Exact label name, form, amount per capsule or container, lot, expiration, source, and route from the product.',
        'Whether the product is Dihexa alone, a blend, or a vendor-specific cognitive formula.',
        'COA, purity, storage instructions, and supplier documentation before treating the inventory record as source-backed.',
      ],
      trackInApp: [
        'Inventory by capsule bottle, powder container, or labeled package with amount and source notes.',
        'User-entered schedule, missed logs, cognitive context notes, sleep notes, tolerability notes, and reason-for-use tags.',
        'Identity and source-quality flags when form, amount, lot, or documentation is incomplete.',
      ],
      realityCheck: 'Dihexa is interesting but not label-backed in this library. PeptideOS should make it easy to log and hard to overstate.',
    },
    reviewSummary: 'Dihexa is included as a research small molecule with PubChem-backed identity metadata and explicit evidence limitations.',
    mechanismTargets: [
      'hepatocyte growth factor pathway research',
      'neurotrophic signaling context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for cognitive research compound tracking',
        finding: 'PubChem supports identity and naming metadata for Dihexa.',
        citationIds: ['pubchem-dihexa'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'research-market-tracking-context',
        population: 'Users logging Dihexa capsules, powders, or research containers',
        finding: 'Product form, amount, purity, and source documentation must be confirmed from the exact item before PeptideOS can support reliable inventory tracking.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This describes tracking risk and product-quality uncertainty, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'The bundled source set does not establish a label-backed safety profile.',
      'Capsule and powder products can create identity, purity, amount-per-unit, and contamination uncertainty.',
      'Cognitive-effect notes are subjective and need context such as sleep, stimulants, stack changes, and timing.',
    ],
    practicalNotes: [
      'Separate form, amount per unit, and package count so inventory math stays auditable.',
      'Prompt for COA or supplier documentation when the source is unclear.',
      'Keep Dihexa logs separate from other nootropic stack changes to reduce attribution confusion.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human safety or efficacy claims.',
      'Marketed products may differ from the reference identity record in purity, excipients, form, and amount.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats Dihexa as research-use context with PubChem identity metadata and no approved US product label attached to this entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment depends on product claims, formulation, and source; this entry does not validate legality or use.',
    },
    peptideOSActions: [
      'Add Dihexa bottles, powders, or containers after the user confirms label details.',
      'Ask for form, amount per unit, package count, lot, expiration, source, and documentation when missing.',
      'Build schedules only from user-entered instructions and keep logs tied to the exact inventory item.',
      'Track cognitive notes, sleep notes, tolerability notes, stack changes, adherence, and remaining supply.',
      'Show research-use and source-quality flags in Peppi summaries.',
    ],
  },
  citations: [
    {
      id: 'pubchem-dihexa',
      title: 'Dihexa compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/129010512',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
