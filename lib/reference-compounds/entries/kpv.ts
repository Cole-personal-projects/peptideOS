import type { ReferenceCompound } from '../schema';

export const kpv: ReferenceCompound = {
  id: 'kpv',
  name: 'KPV',
  aliases: ['Lys-Pro-Val', 'L-Lysyl-L-prolyl-L-valine'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'oral',
  supportedRoutes: ['oral', 'topical'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or labeled container',
      sourceNote: 'Reference container type only; amount and form must come from the actual product label.',
      citationIds: ['pubchem-kpv'],
    },
  ],
  beginnerSummary: 'A short tripeptide tracked in healing and inflammation-adjacent research contexts.',
  researcherDetails: 'KPV is represented as a peptide reference compound for identity, route, and container tracking metadata. PeptideOS does not encode protocol guidance for this entry.',
  mechanism: 'Studied as a short peptide motif in inflammation and barrier-related research contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'KPV is a short inflammation-adjacent peptide where PeptideOS should support oral/topical container tracking and make evidence limits clear.',
      whyPeopleCare: [
        'It is discussed in barrier, gut, skin, and inflammation-adjacent research contexts.',
        'Users may encounter capsules, topical products, powders, sprays, or labeled containers rather than standard injection vials.',
        'The useful app workflow is exact product identity, form, amount-per-unit, schedule adherence, and response-note tracking.',
      ],
      verifyBeforeUse: [
        'Exact label name, form, amount per unit or container amount, lot, source, expiration, and route.',
        'Whether the product is KPV alone, a blend, a cosmetic/topical product, or an oral supplement-style container.',
        'Any COA or supplier documentation supporting identity and amount.',
      ],
      trackInApp: [
        'Container inventory with form, amount, unit count, lot, source, expiration, and route.',
        'Schedule adherence, missed doses, gut/skin/barrier notes, irritation notes, and user-entered context notes.',
        'Source-quality flags when amount per unit, route, lot, or blend status is missing.',
      ],
      realityCheck: 'KPV is a biohacking-market compound with identity-level bundled sourcing. PeptideOS should help users track what they bought and what they logged, not imply clinical certainty.',
    },
    reviewSummary: 'KPV is tracked as a short peptide reference compound for oral/topical inventory and user-entered inflammation-adjacent notes. The bundled source set supports identity and alias matching only.',
    mechanismTargets: [
      'short peptide motif identity context',
      'barrier and inflammation-adjacent research context',
      'oral/topical container tracking',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for container inventory',
        finding: 'PubChem supports KPV identity and naming metadata used by PeptideOS for reference-library records.',
        citationIds: ['pubchem-kpv'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not establish approved-product status or protocol guidance.',
      },
      {
        design: 'container-verification-context',
        population: 'Users adding KPV capsules, topical products, powders, sprays, or blends to inventory',
        finding: 'Identity metadata supports name matching, while route, form, amount per unit, unit count, lot, source, and blend status must come from the user-confirmed product label.',
        citationIds: ['pubchem-kpv'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate a specific product, amount per unit, purity, stability, or clinical use.',
      },
    ],
    safetySignals: [
      'Oral, topical, spray, and powder products have different inventory assumptions.',
      'Blends can make logs hard to interpret unless every component is captured.',
      'Amount-per-unit, purity, stability, and source quality may be unclear in community-market products.',
    ],
    practicalNotes: [
      'Ask route and product form before choosing inventory fields.',
      'Capture amount per capsule, serving, pump, gram, or container when available from the label.',
      'Keep user-entered gut, skin, or irritation notes separate from app conclusions.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The source set does not establish clinical outcome certainty or a recommended protocol.',
      'Community-market products may not match expected identity, amount, purity, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats KPV as research-use tracking context with identity metadata from PubChem.',
      citationIds: ['pubchem-kpv'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, product claims, or clinical use.',
    },
    peptideOSActions: [
      'Add KPV oral, topical, spray, powder, or labeled containers after user confirmation.',
      'Ask for route, form, amount per unit, unit count, lot, source, expiration, and blend status before saving.',
      'Build schedules only from user-entered instructions.',
      'Track adherence, remaining units, gut/skin/barrier notes, and source-quality flags.',
      'Summarize user-entered patterns without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-kpv',
      title: 'Lys-Pro-Val compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/125672',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
