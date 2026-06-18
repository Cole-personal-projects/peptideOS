import type { ReferenceCompound } from '../schema';

export const bremelanotide: ReferenceCompound = {
  id: 'bremelanotide',
  name: 'PT-141 / Bremelanotide',
  aliases: ['PT-141', 'Vyleesi'],
  compoundType: 'peptide',
  category: 'sexual-reproductive',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Prefilled injector or labeled container',
      sourceNote: 'Reference container type only; amount and concentration must come from the actual product label.',
      citationIds: ['dailymed-bremelanotide'],
    },
  ],
  beginnerSummary: 'A melanocortin-pathway peptide tracked in sexual/reproductive compound logging contexts.',
  researcherDetails: 'Bremelanotide is represented as a peptide reference compound with identity, route, and labeled-container tracking metadata.',
  mechanism: 'Studied as a melanocortin receptor agonist.',
  safety: 'Prescription compound in some jurisdictions. This entry is for tracking metadata and is not treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the container.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'PT-141 / Bremelanotide is a label-backed melanocortin peptide where exact container type, route, and source verification keep the app useful and honest.',
      whyPeopleCare: [
        'Users know it as PT-141 in biohacking contexts and bremelanotide in label-backed product contexts, so alias handling matters.',
        'It may appear as a prefilled injector, labeled product, or research-market vial, which makes source quality and container type important.',
        'PeptideOS can organize logs, inventory, timing notes, and tolerability notes without turning sexual-function context into advice.',
      ],
      verifyBeforeUse: [
        'Exact label, source or prescription, lot, expiration, route, container type, strength, and whether it is PT-141 or labeled bremelanotide.',
        'Whether the item is a prefilled injector, pharmacy-labeled container, lyophilized vial, or research-market product.',
        'Product-specific storage and handling details from the actual label or source documentation.',
      ],
      trackInApp: [
        'Inventory by exact container, source, lot, expiration, route, and sealed or active state.',
        'Schedule/log entries, timing notes, missed entries, tolerability notes, and remaining supply.',
        'Alias-aware search, label photos, source-quality flags, and user-entered response notes.',
      ],
      realityCheck: 'Bremelanotide has label-backed context, but PT-141 market entries can vary widely; PeptideOS should ask what is actually on the label before saving or scheduling.',
    },
    reviewSummary: 'Bremelanotide is modeled as an approved-label sexual/reproductive peptide with alias-aware identity, container verification, and logging support for labeled and nonstandard presentations.',
    mechanismTargets: [
      'melanocortin receptors',
      'sexual-function signaling pathways',
    ],
    clinicalEvidence: [
      {
        design: 'label-candidate-reference',
        population: 'People using labeled bremelanotide products under product-specific prescribing contexts',
        finding: 'DailyMed label candidates provide product identity, route, safety, and handling context for bremelanotide products.',
        citationIds: ['dailymed-bremelanotide'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Users who need PT-141 and bremelanotide alias matching',
        finding: 'PubChem supports compound identity metadata for bremelanotide, helping PeptideOS connect PT-141 searches to the reviewed entry.',
        citationIds: ['pubchem-bremelanotide'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, route, and handling details.',
      'Flag missing source, strength, route, lot, expiration, or container type before creating inventory.',
      'Track user-entered tolerability notes, timing notes, and missed entries without offering sexual-health treatment guidance.',
    ],
    practicalNotes: [
      'Preserve both PT-141 and bremelanotide aliases while saving the exact product name from the label.',
      'Ask whether the item is a prefilled injector or vial because inventory math and container state differ.',
      'Peppi can build logs or schedules only from user-confirmed instructions and label details.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine whether bremelanotide is appropriate or how it should be used.',
      'Research-market PT-141 vials may not map to labeled bremelanotide products and need explicit source-quality flags.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label-candidate context for bremelanotide; PeptideOS uses this for identity and tracking metadata only.',
      citationIds: ['dailymed-bremelanotide'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a PT-141 or bremelanotide container to inventory after user confirmation.',
      'Ask for product name, route, strength, lot, expiration, source, container type, and storage state before saving.',
      'Build schedule or log entries from user-confirmed instructions without making sexual-health recommendations.',
      'Track inventory depletion, timing notes, tolerability notes, source-quality flags, and label photos.',
    ],
  },
  citations: [
    {
      id: 'pubchem-bremelanotide',
      title: 'Bremelanotide compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9941379',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-bremelanotide',
      title: 'DailyMed label candidates for Bremelanotide',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Bremelanotide',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
