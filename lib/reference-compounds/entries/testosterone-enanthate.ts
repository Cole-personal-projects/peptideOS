import type { ReferenceCompound } from '../schema';

export const testosteroneEnanthate: ReferenceCompound = {
  id: 'testosterone-enanthate',
  name: 'Testosterone Enanthate',
  aliases: ['Testosterone heptanoate', 'Testosterone enantate'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'im',
  supportedRoutes: ['im', 'subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: '200 mg/mL vial',
      concentration: { value: 200, unit: 'mg/ml' },
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-testosterone-enanthate'],
    },
  ],
  beginnerSummary: 'An injectable testosterone ester tracked as a hormone/endocrine compound rather than a peptide.',
  researcherDetails: 'Testosterone enanthate is an esterified testosterone preparation. Reference metadata focuses on identity, route, concentration units, and label-backed tracking fields.',
  mechanism: 'Acts as an androgen receptor ligand after ester cleavage to testosterone.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by manufacturer labeling; keep product-specific label instructions attached to the actual vial.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Testosterone Enanthate is a label-backed hormone entry that needs ester-specific inventory, concentration math, and clean separation from other testosterone forms.',
      whyPeopleCare: [
        'Users may track enanthate alongside other testosterone esters, making exact ester identity central to inventory and log quality.',
        'Concentration-based vials require volume math from the actual label rather than generic testosterone assumptions.',
        'Hormone tracking value comes from schedule history, vial depletion, lab dates, symptom notes, and source consistency over time.',
      ],
      verifyBeforeUse: [
        'Exact label, prescription or source, lot, expiration, concentration, vial size, route, ester name, and container condition.',
        'Whether the container is manufacturer-labeled, pharmacy-labeled, clinic supplied, or sourced outside a label-backed channel.',
        'Any user-entered lab or outcome context should be stored as personal notes, not interpreted by the app as treatment guidance.',
      ],
      trackInApp: [
        'Inventory grouped by enanthate ester, concentration, source, lot, expiration, and sealed or active vial state.',
        'Injection logs, schedule adherence, site rotation, missed entries, and remaining vial volume estimates.',
        'Optional personal notes for labs, symptoms, training, body composition, and source-quality comparisons.',
      ],
      realityCheck: 'Testosterone enanthate can be label-backed, but PeptideOS should not collapse it into generic testosterone or infer hormone decisions from user logs.',
    },
    reviewSummary: 'Testosterone enanthate is modeled as a label-backed hormone/endocrine compound with ester-specific identity, concentration-based inventory, and longitudinal logging support.',
    mechanismTargets: [
      'androgen receptor',
      'testosterone ester depot',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled testosterone enanthate products under product-specific prescribing contexts',
        finding: 'DailyMed labeling provides route, concentration, warnings, adverse reactions, and product-specific context for testosterone enanthate injection.',
        citationIds: ['dailymed-testosterone-enanthate'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Users who need ester-specific search, alias, and inventory matching',
        finding: 'PubChem supports compound identity metadata for testosterone enanthate so PeptideOS can distinguish it from other testosterone esters.',
        citationIds: ['pubchem-testosterone-enanthate'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, and route-specific handling.',
      'Flag missing concentration, vial volume, lot, expiration, source, or ester ambiguity before saving.',
      'Track user-entered site reactions, symptom notes, lab dates, and missed entries without producing treatment recommendations.',
    ],
    practicalNotes: [
      'Keep enanthate separate from cypionate and propionate in inventory grouping and Peppi summaries.',
      'Peppi can calculate volume only when concentration and target amount are both user-confirmed.',
      'Preserve route metadata because enanthate entries may appear with IM or subQ user workflows.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine dose, frequency, lab targets, or whether testosterone is appropriate for a user.',
      'Nonstandard, compounded, or relabeled containers may not map cleanly to approved product assumptions.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label context for testosterone enanthate injection; PeptideOS uses this as tracking metadata only.',
      citationIds: ['dailymed-testosterone-enanthate'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a testosterone enanthate vial to inventory after user confirmation.',
      'Ask for ester, concentration, vial size, lot, expiration, source, route, and container state before saving.',
      'Calculate injection volume from user-confirmed concentration and user-entered amount.',
      'Track adherence, injection sites, vial depletion, optional lab notes, symptom notes, and source-quality flags.',
    ],
  },
  citations: [
    {
      id: 'dailymed-testosterone-enanthate',
      title: 'TESTOSTERONE ENANTHATE injection, solution label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=82a98132-9d5f-40a5-8c4f-f52f2a5de60e',
      source: 'DailyMed',
      year: 2025,
    },
    {
      id: 'pubchem-testosterone-enanthate',
      title: 'Testosterone enanthate compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/9416',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
