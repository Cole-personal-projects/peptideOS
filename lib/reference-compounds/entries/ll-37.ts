import type { ReferenceCompound } from '../schema';

export const ll37: ReferenceCompound = {
  id: 'll-37',
  name: 'LL-37',
  aliases: ['Cathelicidin LL-37', 'hCAP-18 peptide fragment'],
  compoundType: 'peptide',
  category: 'immune',
  defaultRoute: 'topical',
  supportedRoutes: ['topical', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Inventory preset for common research-container tracking; verify against the actual vial label.',
      citationIds: ['pubchem-ll-37'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'An antimicrobial cathelicidin peptide tracked in immune and skin-barrier research contexts.',
  researcherDetails: 'LL-37 is represented as a peptide reference compound with identity and vial metadata for research tracking only.',
  mechanism: 'Studied in innate immune signaling, antimicrobial activity, and epithelial barrier contexts.',
  safety: 'Research peptide. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and supplier handling; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'identity-only',
    biohackerBrief: {
      headline: 'LL-37 is an immune/barrier research peptide where PeptideOS should be strict about route, vial identity, and high-uncertainty source flags.',
      whyPeopleCare: [
        'It is discussed around cathelicidin, antimicrobial peptide, innate immune, skin, and epithelial-barrier research.',
        'Products may appear as topical preparations, lyophilized vials, or research-market blends.',
        'The practical app value is exact label capture, route separation, concentration math, and transparent uncertainty.',
      ],
      verifyBeforeUse: [
        'Exact label name, route/formulation, vial amount or container amount, lot, source, expiration, and storage language.',
        'Whether the product is LL-37 alone, a cathelicidin fragment, topical product, injectable vial, or blend.',
        'For vials, COA, sterility/endotoxin documentation, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Topical container or vial inventory with amount, BAC volume when relevant, concentration, reconstitution date, and active-container state.',
        'Schedule adherence, missed doses, site/location notes, irritation notes, skin/barrier notes, and user-entered context notes.',
        'High-uncertainty flags when source, sterility, route, amount, or identity is unclear.',
      ],
      realityCheck: 'LL-37 is biologically interesting and high-uncertainty in consumer research contexts. PeptideOS should make records precise without implying safety, efficacy, or protocol certainty.',
    },
    reviewSummary: 'LL-37 is tracked as a cathelicidin antimicrobial peptide reference compound for immune/skin-barrier research contexts. The bundled source set supports identity and practical tracking, not clinical guidance.',
    mechanismTargets: [
      'cathelicidin peptide identity context',
      'innate immune signaling context',
      'antimicrobial and epithelial-barrier research context',
    ],
    clinicalEvidence: [
      {
        design: 'compound-identity-record',
        population: 'Reference identity and alias matching for topical or vial inventory',
        finding: 'PubChem supports LL-37 identity and naming metadata used by PeptideOS for reference-library records.',
        citationIds: ['pubchem-ll-37'],
        sourceQuality: 'source-backed',
        limitations: 'The bundled source set does not establish approved-product status or protocol guidance.',
      },
      {
        design: 'route-and-product-verification-context',
        population: 'Users adding LL-37 topical products, lyophilized vials, kits, or blends to inventory',
        finding: 'Identity metadata supports cathelicidin LL-37 name matching, while route, formulation, amount, lot, source, sterility documentation, and blend status must come from the exact product.',
        citationIds: ['pubchem-ll-37'],
        sourceQuality: 'source-backed',
        limitations: 'Reference identity does not validate a specific product, route claim, concentration, sterility, or clinical use.',
      },
    ],
    safetySignals: [
      'Immune/barrier research compounds can be easy to over-interpret without product-specific and context-specific records.',
      'Injectable research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Topical and injectable uses must be tracked separately and should not share assumptions.',
    ],
    practicalNotes: [
      'Ask whether the product is topical, injectable, pre-mixed, lyophilized, or blended before saving inventory.',
      'Calculate concentration only for confirmed vial workflows with known amount and diluent volume.',
      'Keep user-entered symptom, skin, site, or irritation notes as logs rather than app conclusions.',
    ],
    evidenceGaps: [
      'No US approved-product label is attached to this bundled reference entry.',
      'The app source set does not establish clinical outcome certainty or a recommended protocol.',
      'Community-market material may not match expected identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats LL-37 as research-use tracking context with identity metadata from PubChem.',
      citationIds: ['pubchem-ll-37'],
      sourceQuality: 'source-backed',
      limitations: 'Identity sourcing does not validate legality, sourcing quality, sterility, or clinical use.',
    },
    peptideOSActions: [
      'Add LL-37 topical containers, vials, or kits to inventory after user confirms route and label details.',
      'Ask for amount, lot, source, expiration, route, blend status, and container state before saving.',
      'Calculate concentration from confirmed vial amount and diluent volume when relevant.',
      'Build schedules only from user-entered instructions and tie logs to the active container.',
      'Flag missing identity, source, sterility documentation, vial amount, BAC volume, or route details.',
    ],
  },
  citations: [
    {
      id: 'pubchem-ll-37',
      title: 'LL-37 compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16198951',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
