import type { ReferenceCompound } from '../schema';

export const testosteroneCypionate: ReferenceCompound = {
  id: 'testosterone-cypionate',
  name: 'Testosterone Cypionate',
  aliases: ['Testosterone cyclopentylpropionate', 'Depo-Testosterone'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'im',
  supportedRoutes: ['im'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'concentration',
  dosePresets: [],
  vialPresets: [
    {
      label: '200 mg/mL multi-dose vial',
      concentration: { value: 200, unit: 'mg/ml' },
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-testosterone-cypionate'],
    },
  ],
  beginnerSummary: 'An injectable testosterone ester tracked as a hormone/endocrine compound rather than a peptide.',
  researcherDetails: 'Testosterone cypionate is an esterified testosterone preparation. Reference metadata focuses on identity, route, concentration units, and label-backed tracking fields.',
  mechanism: 'Acts as an androgen receptor ligand after ester cleavage to testosterone.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by manufacturer labeling; keep product-specific label instructions attached to the actual vial.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Testosterone Cypionate is a label-backed hormone entry where ester, concentration, oil vial identity, and lab-context logging need to stay precise.',
      whyPeopleCare: [
        'Users expect testosterone esters to be tracked separately because cypionate, enanthate, and propionate are not interchangeable inventory records.',
        'The practical app problem is concentration math, injection log history, lot/source tracking, and separating prescribed products from gray-market containers.',
        'Hormone users often want longitudinal notes around labs, symptoms, adherence, vial depletion, and source consistency.',
      ],
      verifyBeforeUse: [
        'Exact label, prescription or source, lot, expiration, concentration, vial size, route, ester name, and carrier-oil/product notes when present.',
        'Whether the container is a pharmacy label, manufacturer label, clinic supply, or nonstandard source before Peppi creates inventory.',
        'Any user-entered lab markers or outcome notes should be clearly separated from product identity and not interpreted as care advice.',
      ],
      trackInApp: [
        'Inventory grouped by ester, concentration, source, lot, vial size, and active/sealed state.',
        'Injection logs, schedule adherence, site rotation, vial depletion, and missed-dose notes.',
        'Optional user-entered lab dates, symptom notes, and source-quality flags for personal trend review.',
      ],
      realityCheck: 'Testosterone cypionate can be label-backed, but PeptideOS should track the container and user-entered logs, not prescribe, optimize, or interpret hormone therapy.',
    },
    reviewSummary: 'Testosterone cypionate is modeled as an approved-label hormone/endocrine compound with concentration-based inventory math and ester-specific logging. The app should make identity verification, source quality, and schedule history explicit.',
    mechanismTargets: [
      'androgen receptor',
      'testosterone ester depot',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled testosterone cypionate products under product-specific prescribing contexts',
        finding: 'DailyMed labeling provides route, concentration, warnings, adverse reactions, and product-specific handling context for testosterone cypionate injection.',
        citationIds: ['dailymed-testosterone-cypionate'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Users who need ester-specific search, alias, and identity matching',
        finding: 'PubChem supports compound identity metadata for testosterone cypionate so the library can distinguish this ester from other testosterone forms.',
        citationIds: ['pubchem-testosterone-cypionate'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, and route-specific handling.',
      'Flag missing concentration, lot, expiration, source, or ester ambiguity before creating inventory.',
      'Track user-entered labs, symptoms, adverse notes, and site reactions as logs without interpreting or optimizing therapy.',
    ],
    practicalNotes: [
      'Keep cypionate separate from enanthate and propionate in search, inventory grouping, and schedule summaries.',
      'Peppi can calculate volume only from user-confirmed concentration and user-entered amount.',
      'Group duplicate vials by same ester, concentration, source, lot, and expiration while preserving individual container counts.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine dose, frequency, lab targets, or whether testosterone is appropriate for a user.',
      'Research-market or relabeled containers may not match approved labeling and should carry explicit source-quality flags.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label context for testosterone cypionate injection; PeptideOS uses this as tracking metadata only.',
      citationIds: ['dailymed-testosterone-cypionate'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a testosterone cypionate vial to inventory after user confirmation.',
      'Ask for concentration, vial volume, lot, expiration, source, route, and ester confirmation before saving.',
      'Calculate injection volume from user-confirmed concentration and user-entered amount.',
      'Track schedule adherence, injection sites, vial depletion, user-entered labs, symptom notes, and source-quality flags.',
    ],
  },
  citations: [
    {
      id: 'dailymed-testosterone-cypionate',
      title: 'TESTOSTERONE CYPIONATE injection, solution label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3653a602-4551-4e6c-84a7-31861f5dc482',
      source: 'DailyMed',
      year: 2025,
    },
    {
      id: 'pubchem-testosterone-cypionate',
      title: 'Testosterone Cypionate compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/441404',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
