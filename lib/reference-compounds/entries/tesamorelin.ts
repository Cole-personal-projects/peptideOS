import type { ReferenceCompound } from '../schema';

export const tesamorelin: ReferenceCompound = {
  id: 'tesamorelin',
  name: 'Tesamorelin',
  aliases: ['Egrifta', 'GHRH 1-44'],
  compoundType: 'peptide',
  category: 'growth-hormone',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '1 mg lyophilized vial',
      totalAmount: { value: 1, unit: 'mg' },
      sourceNote: 'Container preset for label-oriented tracking; verify against the actual product label.',
      citationIds: ['dailymed-tesamorelin'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 1, unit: 'mg' }, { value: 2, unit: 'mg' }],
    typicalBacWaterMl: [0.5, 1],
  },
  beginnerSummary: 'A synthetic GHRH analog tracked in growth-hormone axis and endocrine research contexts.',
  researcherDetails: 'Tesamorelin is represented as a peptide reference compound with identity and container metadata from public compound and label sources.',
  mechanism: 'Acts through growth-hormone-releasing hormone receptor signaling.',
  safety: 'Prescription/endocrine compound in some jurisdictions. This entry is for tracking metadata and is not treatment guidance.',
  storage: 'Storage varies by labeled product and container state; keep product-specific label instructions attached to the vial.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'Tesamorelin is a label-backed GHRH analog where PeptideOS should handle exact product identity, vial math, and endocrine tracking without turning labels into advice.',
      whyPeopleCare: [
        'It sits in the growth-hormone-releasing hormone category rather than the ghrelin-secretagogue category.',
        'Users may encounter labeled products and research-market vials with different strengths, sources, and handling expectations.',
        'The practical app need is clean inventory, reconstitution, schedule adherence, and user-entered body-composition or lab-note tracking.',
      ],
      verifyBeforeUse: [
        'Exact product name, vial amount, lot, expiration, source, route, and whether the container is labeled product or research material.',
        'Any label-specific storage, mixing, and discard-window language attached to the exact vial.',
        'Whether the user is logging tesamorelin alone or a blend marketed around GH-axis support.',
      ],
      trackInApp: [
        'Vial or kit inventory with vial amount, BAC volume, concentration, reconstitution date, and active-vial state.',
        'Schedule adherence, missed doses, injection-site notes, side-effect notes, and user-entered lab or body-composition notes.',
        'Photos and label metadata so Peppi can ask for missing strength, lot, source, expiration, or storage details.',
      ],
      realityCheck: 'Tesamorelin has label-backed context, but PeptideOS still records user-confirmed facts only. It should not infer eligibility, dose changes, or medical decisions.',
    },
    reviewSummary: 'Tesamorelin has label-backed identity context and a clear GHRH receptor mechanism class. PeptideOS treats it as endocrine inventory and logging context with user-confirmed vial and schedule details.',
    mechanismTargets: [
      'growth-hormone-releasing hormone receptor',
      'GH-axis signaling context',
      'IGF-1 tracking context',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled tesamorelin products under product-specific prescribing contexts',
        finding: 'DailyMed label candidates provide product-specific identity, safety, route, and handling context for tesamorelin products.',
        citationIds: ['dailymed-tesamorelin'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'compound-identity-record',
        population: 'Reference chemistry and alias matching for library search and inventory creation',
        finding: 'PubChem supports compound identity and naming metadata for tesamorelin.',
        citationIds: ['pubchem-tesamorelin'],
        sourceQuality: 'source-backed',
      },
    ],
    safetySignals: [
      'Use exact label language for contraindications, warnings, adverse reactions, and handling details.',
      'Endocrine-axis compounds make lab-note timing, user-entered symptom notes, and schedule adherence important for records.',
      'Flag missing lot, expiration, vial amount, source, or storage language before saving inventory.',
    ],
    practicalNotes: [
      'Keep labeled-product inventory separate from research-market vial inventory.',
      'Calculate concentration only from user-confirmed vial amount and diluent volume.',
      'Peppi can ask whether the entry should be tracked as a labeled product, research vial, or historical log.',
    ],
    evidenceGaps: [
      'PeptideOS does not decide whether tesamorelin is appropriate for any user.',
      'Research-market containers may not map cleanly to DailyMed label assumptions.',
      'Outcome attribution can be weak without consistent schedule, lab, body-composition, and side-effect notes.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label candidates for tesamorelin products; PeptideOS uses this as label-backed tracking context only.',
      citationIds: ['dailymed-tesamorelin'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a tesamorelin vial or labeled container to inventory after user confirmation.',
      'Ask for missing strength, lot, expiration, route, source, storage, or container-state details before saving.',
      'Calculate concentration from confirmed vial amount and diluent volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Summarize adherence, inventory depletion, lab notes, and user-entered tolerability notes without medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'pubchem-tesamorelin',
      title: 'Tesamorelin compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/16137828',
      source: 'PubChem',
      year: 2026,
    },
    {
      id: 'dailymed-tesamorelin',
      title: 'DailyMed label candidates for Tesamorelin',
      url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Tesamorelin',
      source: 'DailyMed',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
