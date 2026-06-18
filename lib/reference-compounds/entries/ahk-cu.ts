import type { ReferenceCompound } from '../schema';

export const ahkCu: ReferenceCompound = {
  id: 'ahk-cu',
  name: 'AHK-Cu',
  aliases: ['Copper peptide AHK-Cu', 'Ala-His-Lys copper complex'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'topical',
  supportedRoutes: ['topical', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '50 mg lyophilized vial',
      totalAmount: { value: 50, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-ahk-cu'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 50, unit: 'mg' }],
    typicalBacWaterMl: [2, 5],
  },
  beginnerSummary: 'A copper-binding peptide tracked in skin and hair research contexts.',
  researcherDetails: 'AHK-Cu is represented as a peptide reference compound with identity, route, and vial metadata for tracking only.',
  mechanism: 'Studied as a copper peptide in skin, hair, and extracellular-matrix research contexts.',
  safety: 'Research peptide. Topical and injectable contexts are distinct; this entry is not medical advice or use guidance.',
  storage: 'Storage varies by formulation and container; keep product-specific label instructions attached to the actual product.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'AHK-Cu is a copper-peptide hair/skin research entry where PeptideOS should prevent GHK-Cu confusion and keep route-specific inventory clear.',
      whyPeopleCare: [
        'It is discussed in hair, skin, and extracellular-matrix research contexts.',
        'Users may confuse AHK-Cu with GHK-Cu or buy blends that contain multiple copper peptides.',
        'The important app workflow is exact label capture, route/formulation tracking, and inventory math when vials are used.',
      ],
      verifyBeforeUse: [
        'Exact label name, whether it says AHK-Cu or another copper peptide, route/formulation, amount, lot, source, and expiration.',
        'Whether the product is topical, injectable, lyophilized, pre-mixed, or blended.',
        'For injectable vials, COA, sterility/endotoxin documentation, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Topical container inventory or vial inventory with amount, BAC volume, concentration, reconstitution date, and active-vial state.',
        'Hair/skin notes, site/location notes, irritation notes, schedule adherence, and user-entered photo markers.',
        'Identity flags when AHK-Cu, GHK-Cu, or generic copper peptide labeling is ambiguous.',
      ],
      realityCheck: 'AHK-Cu has identity-level bundled sourcing. PeptideOS should support serious tracking while making product identity and evidence limits explicit.',
    },
    reviewSummary: 'AHK-Cu is tracked as a copper-peptide reference compound for route-specific inventory, identity verification, and user-entered skin/hair notes. The bundled source set supports identity, not clinical protocol guidance.',
    mechanismTargets: [
      'copper-peptide identity context',
      'skin and hair research context',
      'extracellular-matrix tracking context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for inventory creation',
        finding: 'PubChem supports AHK-Cu identity and naming metadata used by PeptideOS for library and inventory records.',
        citationIds: ['pubchem-ahk-cu'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not establish approved-product status or protocol guidance.',
      },
      {
        design: 'copper-peptide-product-verification-context',
        population: 'Users adding AHK-Cu topical products, vials, kits, or copper-peptide blends',
        finding: 'Identity metadata supports AHK-Cu name matching, while exact copper-peptide form, route, amount, lot, source, and blend status must come from the user-confirmed label.',
        citationIds: ['pubchem-ahk-cu'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate a specific topical product, injectable vial, sterility, concentration, or clinical use.',
      },
    ],
    safetySignals: [
      'Topical and injectable formulations require different tracking assumptions.',
      'Research-market injectable vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Generic copper-peptide labels can obscure whether the product is AHK-Cu, GHK-Cu, or a blend.',
    ],
    practicalNotes: [
      'Ask the user to confirm exact copper-peptide identity before saving inventory.',
      'Use topical container fields when the product is a cosmetic/topical product.',
      'Use vial amount and BAC volume only when the user confirms a reconstituted vial workflow.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The app source set does not establish clinical outcome certainty or a recommended protocol.',
      'Product-specific identity, concentration, sterility, and stability cannot be inferred from PubChem identity metadata.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats AHK-Cu as research/cosmetic-context tracking with identity metadata from PubChem.',
      citationIds: ['pubchem-ahk-cu'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, sterility, or clinical use.',
    },
    peptideOSActions: [
      'Add AHK-Cu topical containers, vials, or kits to inventory after user confirms route and label details.',
      'Ask whether the product is AHK-Cu, GHK-Cu, generic copper peptide, or a blend before saving.',
      'Calculate concentration for reconstituted vials from confirmed vial amount and diluent volume.',
      'Track hair/skin notes, site notes, adherence, and inventory depletion.',
      'Flag route mismatch, missing amount, missing lot, missing source, or unclear copper-peptide identity.',
    ],
  },
  citations: [
    {
      id: 'pubchem-ahk-cu',
      title: 'AHK-Cu compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/168431292',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
