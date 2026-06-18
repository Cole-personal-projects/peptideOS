import type { ReferenceCompound } from '../schema';

export const nadPlus: ReferenceCompound = {
  id: 'nad-plus',
  name: 'NAD+',
  aliases: ['Nicotinamide adenine dinucleotide', 'NAD plus'],
  compoundType: 'supplement',
  category: 'longevity',
  defaultRoute: 'oral',
  supportedRoutes: ['oral', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or labeled container',
      sourceNote: 'Reference container type only; amount and concentration must come from the actual product label.',
      citationIds: ['pubchem-nad-plus'],
    },
  ],
  beginnerSummary: 'A nicotinamide adenine dinucleotide entry tracked as an adjacent longevity and mitochondrial-support compound.',
  researcherDetails: 'NAD+ is represented as an adjacent compound reference for identity, route, and inventory metadata. Formulations vary widely and are not normalized here.',
  mechanism: 'Central redox cofactor involved in cellular metabolism and nucleotide-related pathways.',
  safety: 'Supplement/adjacent compound context varies by formulation and jurisdiction. This entry is for tracking metadata only.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'NAD+ is an adjacent longevity compound where PeptideOS should distinguish supplement bottles, injection-style containers, and formulation-specific labels.',
      whyPeopleCare: [
        'It sits at the center of redox and cellular metabolism discussions in longevity communities.',
        'Users encounter wildly different forms, including capsules, powders, IV-clinic language, and injection-style products.',
        'The useful app job is tracking exact formulation and source details, not collapsing every NAD-related product into one assumption.',
      ],
      verifyBeforeUse: [
        'Exact product name, form, amount or concentration, route, lot, expiration, source, and container type.',
        'Whether the label is NAD+, a precursor, a blend, or a branded supplement formula.',
        'Storage instructions, excipients, COA or third-party testing, and sterility documentation for non-oral containers.',
      ],
      trackInApp: [
        'Inventory by formulation and route so capsules, powders, and labeled containers do not share incorrect math.',
        'User-entered schedule, adherence, energy notes, sleep notes, tolerability notes, and stack changes.',
        'Source-quality flags when the product form, amount, route, or documentation is unclear.',
      ],
      realityCheck: 'NAD+ is familiar but formulation-dependent. PeptideOS should make the exact product label do the work and avoid assuming equivalence across routes or products.',
    },
    reviewSummary: 'NAD+ is modeled as a supplement-adjacent longevity compound with PubChem-backed identity metadata and formulation-sensitive inventory tracking.',
    mechanismTargets: [
      'redox cofactor context',
      'cellular metabolism',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for NAD-related product tracking',
        finding: 'PubChem supports identity and naming metadata for NAD+.',
        citationIds: ['pubchem-nad-plus'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'formulation-tracking-context',
        population: 'Users logging supplement, powder, or labeled NAD+ containers',
        finding: 'PeptideOS needs route, form, amount or concentration, source, and container-state data from the exact product before inventory and schedule tracking are meaningful.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is practical product-tracking context, not clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'Formulation and route matter; oral supplements and sterile-labeled containers have different quality questions.',
      'The bundled source set does not establish a single safety profile across all NAD+ product forms.',
      'Source documentation, sterility, excipients, concentration, and storage can be unclear in real-world products.',
    ],
    practicalNotes: [
      'Record exact form and route before building inventory math.',
      'Keep NAD+ distinct from precursors or blends unless the user explicitly labels the product that way.',
      'Ask for testing or sterility documentation when the container is not an ordinary oral supplement.',
    ],
    evidenceGaps: [
      'No approved US product label is attached to this reference entry.',
      'The bundled citation does not establish standardized human protocol or formulation equivalence.',
      'Products sold under NAD-related names can vary in ingredient identity, route, amount, and quality controls.',
    ],
    regulatoryStatus: {
      status: 'unknown',
      region: 'US',
      summary: 'PeptideOS treats NAD+ product status as formulation-dependent; this entry has PubChem identity metadata but no single approved US label attached.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory treatment depends on product form, claims, route, and source; the app entry does not validate legality or use.',
    },
    peptideOSActions: [
      'Add NAD+ products to inventory by exact formulation, route, and container type after user confirmation.',
      'Ask for amount, concentration, form, route, lot, expiration, source, storage, and testing details when missing.',
      'Build schedules only from user-entered instructions tied to the exact product.',
      'Track adherence, energy notes, sleep notes, tolerability notes, stack changes, and remaining supply.',
      'Warn when a product may be a precursor, blend, or non-equivalent formulation.',
    ],
  },
  citations: [
    {
      id: 'pubchem-nad-plus',
      title: 'NAD+ compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5892',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
