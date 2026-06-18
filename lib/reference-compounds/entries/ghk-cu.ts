import type { ReferenceCompound } from '../schema';

export const ghkCu: ReferenceCompound = {
  id: 'ghk-cu',
  name: 'GHK-Cu',
  aliases: ['Copper peptide GHK-Cu', 'Glycyl-L-histidyl-L-lysine copper', 'Copper tripeptide-1'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'subq',
  supportedRoutes: ['subq', 'topical'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '50 mg lyophilized vial',
      totalAmount: { value: 50, unit: 'mg' },
      sourceNote: 'Common vial-size preset for inventory math; verify against the actual container label.',
      citationIds: ['pmc-ghk-cu-skin-regeneration'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 50, unit: 'mg' }],
    typicalBacWaterMl: [2, 5],
  },
  beginnerSummary: 'A copper-binding tripeptide commonly tracked in skin, hair, and tissue-repair research contexts.',
  researcherDetails: 'GHK-Cu is a glycyl-histidyl-lysine copper complex discussed in dermatology and tissue-remodeling literature. This entry supports identity, route, and vial tracking metadata.',
  mechanism: 'Studied for copper binding, extracellular matrix remodeling, collagen-related signaling, and skin-regeneration pathways.',
  safety: 'Research peptide. Topical and injectable contexts are distinct; this entry is not medical advice or use guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual vial.',
  referenceProfile: {
    evidenceTier: 'preclinical',
    biohackerBrief: {
      headline: 'GHK-Cu is a skin-and-repair copper peptide where PeptideOS should separate topical, injectable, and cosmetic formulations while keeping vial math clean.',
      whyPeopleCare: [
        'It is widely discussed for skin, hair, extracellular matrix, collagen-related, and tissue-remodeling contexts.',
        'Products may be topical serums, cosmetic containers, lyophilized vials, or blends with other recovery compounds.',
        'Route and formulation matter because topical and injectable tracking workflows are not interchangeable.',
      ],
      verifyBeforeUse: [
        'Exact label name, copper peptide form, route/formulation, amount, concentration if listed, lot, source, and expiration.',
        'Whether the product is GHK-Cu alone, plain GHK, AHK-Cu, or a blend.',
        'For injectable vials, COA, sterility/endotoxin documentation, vial amount, and storage instructions when available.',
      ],
      trackInApp: [
        'Topical inventory by container amount/concentration or injectable inventory by vial amount, BAC volume, and active-vial state.',
        'Skin/hair/recovery notes, site/location notes, schedule adherence, irritation notes, and user-entered photo markers.',
        'Route-specific source-quality flags so topical products are not treated like sterile injectables.',
      ],
      realityCheck: 'GHK-Cu has useful mechanistic and dermatology-adjacent literature, but product form matters. PeptideOS should be excellent at tracking exactly what the user has.',
    },
    reviewSummary: 'GHK-Cu has source-backed skin-regeneration and anti-aging literature context, but PeptideOS treats product-specific route, formulation, sterility, and concentration as user-confirmed inventory facts.',
    mechanismTargets: [
      'copper-binding peptide context',
      'extracellular matrix remodeling',
      'collagen and skin-regeneration signaling context',
    ],
    clinicalEvidence: [
      {
        design: 'mechanistic-and-review-literature',
        population: 'Skin-regeneration and cellular-pathway research contexts',
        finding: 'Review literature discusses GHK and GHK-Cu as modulators of multiple cellular pathways relevant to skin-regeneration research.',
        citationIds: ['pmc-ghk-cu-skin-regeneration'],
        sourceQuality: 'source-backed',
      },
      {
        design: 'review-literature',
        population: 'Anti-aging and regenerative research contexts',
        finding: 'Review literature describes GHK as an anti-aging peptide candidate while leaving product-specific use and quality outside the app source set.',
        citationIds: ['pmc-ghk-cu-anti-aging'],
        sourceQuality: 'source-backed',
        limitations: 'Literature context does not validate any specific topical serum, injectable vial, concentration, or blend.',
      },
    ],
    safetySignals: [
      'Topical and injectable routes require separate tracking assumptions.',
      'Injectable research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Copper-peptide products may be mislabeled, blended, or confused with GHK or AHK-Cu.',
    ],
    practicalNotes: [
      'Ask route/formulation first: topical container, cosmetic product, lyophilized vial, or blend.',
      'For injectable inventory, calculate concentration only from confirmed vial amount and diluent volume.',
      'Store progress photos or user-entered skin/hair notes as personal tracking data, not app conclusions.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'Product-specific concentration, sterility, and stability cannot be inferred from review literature.',
      'Topical cosmetic claims and injectable research-vial claims should not be treated as equivalent.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats GHK-Cu as research/cosmetic-context tracking unless the user supplies a specific labeled product record.',
      citationIds: ['pmc-ghk-cu-skin-regeneration', 'pmc-ghk-cu-anti-aging'],
      sourceQuality: 'source-backed',
      limitations: 'Literature sourcing does not validate legality, sourcing quality, sterility, or clinical use for a specific product.',
    },
    peptideOSActions: [
      'Add GHK-Cu topical containers, vials, or kits to inventory after user confirms route and label details.',
      'Ask whether the product is GHK-Cu, GHK, AHK-Cu, or a blend before saving.',
      'Calculate concentration for reconstituted vials from confirmed vial amount and diluent volume.',
      'Track skin/hair/recovery notes, site notes, adherence, and inventory depletion.',
      'Flag route mismatch, missing amount, missing source, missing lot, or missing container state.',
    ],
  },
  citations: [
    {
      id: 'pmc-ghk-cu-skin-regeneration',
      title: 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4508379/',
      source: 'PMC',
      year: 2015,
    },
    {
      id: 'pmc-ghk-cu-anti-aging',
      title: 'The potential of GHK as an anti-aging peptide',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8789089/',
      source: 'PMC',
      year: 2022,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
