import type { ReferenceCompound } from '../schema';

export const oxytocin: ReferenceCompound = {
  id: 'oxytocin',
  name: 'Oxytocin',
  aliases: ['Pitocin'],
  compoundType: 'hormone',
  category: 'sexual-reproductive',
  defaultRoute: 'im',
  supportedRoutes: ['im'],
  defaultDoseUnit: 'iu',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 USP units/mL injection',
      concentration: { value: 10, unit: 'iu/ml' },
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-oxytocin'],
    },
  ],
  beginnerSummary: 'A peptide hormone tracked in reproductive and endocrine contexts.',
  researcherDetails: 'Oxytocin is represented with PubChem identity metadata and DailyMed label context. PeptideOS models it as a hormone reference record.',
  mechanism: 'Acts through oxytocin receptors in reproductive, lactation, and neuroendocrine contexts.',
  safety: 'Hormone/endocrine compound with clinical safety constraints; this entry is not use guidance.',
  storage: 'Follow product-specific label storage instructions.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Oxytocin is a label-backed peptide hormone where PeptideOS should treat route, concentration, source, and clinical-context warnings as first-class data.',
      whyPeopleCare: [
        'Users may recognize oxytocin from both clinical labels and biohacking discussion, so label-backed context needs to stay prominent.',
        'It is concentration-based and hormone-like, making exact container identity and source verification critical.',
        'The app can help organize logs, inventory, and source documents while avoiding neuroendocrine or reproductive-use claims.',
      ],
      verifyBeforeUse: [
        'Exact label, source or prescription, lot, expiration, concentration, vial or ampule size, route, and container state.',
        'Whether the item is a labeled clinical product, pharmacy-labeled container, or nonstandard source.',
        'Storage and handling details from the actual product label, not a generic oxytocin summary.',
      ],
      trackInApp: [
        'Inventory by concentration, source, lot, expiration, and sealed or active container state.',
        'Schedule/log entries, missed entries, route metadata, and remaining container estimates when user-confirmed.',
        'Source-quality flags, label photos, user-entered context notes, and tolerability notes.',
      ],
      realityCheck: 'Oxytocin has approved label context, but PeptideOS should not translate that into reproductive, lactation, or behavioral guidance for the user.',
    },
    reviewSummary: 'Oxytocin is modeled as a label-backed peptide hormone with concentration-based inventory, route-sensitive logging, and strong source-verification requirements.',
    mechanismTargets: [
      'oxytocin receptor',
      'reproductive neuroendocrine signaling',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled oxytocin products under product-specific clinical contexts',
        finding: 'DailyMed labeling provides product identity, concentration, route, warnings, adverse reactions, and handling context for oxytocin injection.',
        citationIds: ['dailymed-oxytocin'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Users who need identity and alias matching for oxytocin products',
        finding: 'PubChem supports compound identity metadata for oxytocin.',
        citationIds: ['pubchem-oxytocin'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, route, and handling details.',
      'Flag missing concentration, route, source, lot, expiration, or clinical-context ambiguity before saving inventory.',
      'Track user-entered adverse notes and missed entries without producing reproductive, lactation, or behavioral recommendations.',
    ],
    practicalNotes: [
      'Keep oxytocin separate from research peptides because label-backed warnings and clinical context are central to the entry.',
      'Peppi can calculate volume only from user-confirmed concentration and user-entered amount.',
      'Ask for source and container type before creating a schedule or inventory record.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine oxytocin use cases, route decisions, or clinical appropriateness.',
      'Nonstandard or research-market containers may not match the approved-label context and need source-quality flags.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label context for oxytocin injection; PeptideOS uses this for tracking metadata only.',
      citationIds: ['dailymed-oxytocin'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add an oxytocin vial, ampule, or labeled container to inventory after user confirmation.',
      'Ask for concentration, lot, expiration, source, route, container type, and storage details before saving.',
      'Calculate volume from user-confirmed concentration and user-entered amount.',
      'Track schedule entries, inventory depletion, source-quality flags, label photos, and user-entered notes.',
    ],
  },
  citations: [
    {
      id: 'pubchem-oxytocin',
      title: 'Oxytocin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/439302',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-oxytocin',
      title: 'PITOCIN (OXYTOCIN) injection label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6e5a66fc-e507-497c-b5ce-44a8c95898ad',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
