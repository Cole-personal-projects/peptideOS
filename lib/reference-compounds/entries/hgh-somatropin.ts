import type { ReferenceCompound } from '../schema';

export const hghSomatropin: ReferenceCompound = {
  id: 'hgh-somatropin',
  name: 'hGH / Somatropin',
  aliases: ['Somatropin', 'Recombinant human growth hormone', 'rhGH'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'iu',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg / 1.5 mL cartridge',
      concentration: { value: 6.67, unit: 'mg/ml' },
      volumeMl: 1.5,
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-norditropin'],
    },
  ],
  conversion: {
    iuPerMg: 3,
    notes: 'Biological activity conversions are product-specific; PeptideOS stores IU selections without generic substitution.',
  },
  beginnerSummary: 'Recombinant human growth hormone is a hormone/endocrine compound tracked separately from peptide research compounds.',
  researcherDetails: 'Somatropin is recombinant human growth hormone. Reference metadata focuses on identity, route, labeling units, and storage context for tracking.',
  mechanism: 'Binds growth hormone receptors and supports downstream endocrine signaling including IGF-1 mediated pathways.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by product labeling; keep product-specific label instructions attached to the actual container.',
  referenceProfile: {
    evidenceTier: 'approved-label',
    biohackerBrief: {
      headline: 'hGH / Somatropin is a label-backed hormone entry where exact brand, cartridge, IU-to-mg context, and cold-chain handling matter more than generic peptide assumptions.',
      whyPeopleCare: [
        'Users often log somatropin in IU while labels may also expose mg, cartridge volume, and device-specific presentation details.',
        'It sits in the growth-hormone axis, so users want schedule, inventory, and outcome notes separated from research peptides.',
        'Product identity can vary by brand, device, cartridge, or pharmacy label, which makes container-level tracking valuable.',
      ],
      verifyBeforeUse: [
        'Exact product label, brand, lot, expiration, source, concentration, container type, and whether the item is a cartridge, pen, or vial.',
        'User-confirmed unit basis before logging because IU and mg conversions are product-specific and should not be guessed.',
        'Storage instructions and current container state from the actual label, especially if the product is opened or in active use.',
      ],
      trackInApp: [
        'Inventory by exact cartridge, pen, or vial with label photos and active-container status.',
        'Schedule adherence, missed entries, user-entered IU or mg amounts, and source/lot metadata.',
        'User-entered notes around sleep, recovery, training, body-composition trends, and any lab markers they choose to track.',
      ],
      realityCheck: 'Somatropin has label-backed products, but PeptideOS should treat every entry as a user-confirmed container record and avoid converting or interpreting endocrine care decisions.',
    },
    reviewSummary: 'Somatropin is represented as an approved-label hormone/endocrine compound with explicit IU-aware inventory and schedule tracking. PeptideOS should keep product identity, device state, and user-entered outcome notes separate from generic growth-hormone peptide workflows.',
    mechanismTargets: [
      'growth hormone receptor',
      'IGF-1 axis',
    ],
    clinicalEvidence: [
      {
        design: 'approved-product-label',
        population: 'People using labeled somatropin products under product-specific prescribing contexts',
        finding: 'DailyMed labeling provides product identity, route, strength, device presentation, warnings, and handling context for a somatropin product.',
        citationIds: ['dailymed-norditropin'],
        sourceQuality: 'label-backed',
      },
      {
        design: 'label-unit-and-container-reference',
        population: 'PeptideOS users entering cartridge, pen, vial, IU, mg, and concentration details',
        finding: 'The label supports product-specific tracking of concentration, container presentation, and storage fields rather than generic somatropin assumptions.',
        citationIds: ['dailymed-norditropin'],
        sourceQuality: 'label-backed',
        limitations: 'A single branded label does not cover every somatropin product or device format.',
      },
    ],
    safetySignals: [
      'Use the exact product label for contraindications, warnings, adverse reactions, and storage requirements.',
      'Flag missing lot, expiration, source, concentration, or unclear IU-to-mg context before saving inventory.',
      'Track user-entered tolerability notes, missed doses, active-container age, and any lab/result notes without interpreting treatment decisions.',
    ],
    practicalNotes: [
      'Ask whether the user is entering a pen, cartridge, vial, or pharmacy-labeled container before creating inventory.',
      'Keep IU and mg fields explicit so Peppi can calculate only from user-confirmed product data.',
      'Group inventory by exact label, strength, source, and lot so multiple cartridges do not collapse into a vague hGH bucket.',
    ],
    evidenceGaps: [
      'PeptideOS does not determine whether somatropin is appropriate for a user or interpret endocrine lab results.',
      'Non-label research-market containers require extra source-quality flags because they may not match approved product labeling.',
    ],
    regulatoryStatus: {
      status: 'approved',
      region: 'US',
      summary: 'DailyMed provides US label context for somatropin products; PeptideOS uses this for identity, inventory, and handling metadata only.',
      citationIds: ['dailymed-norditropin'],
      sourceQuality: 'label-backed',
    },
    peptideOSActions: [
      'Add a somatropin pen, cartridge, vial, or labeled container to inventory after user confirmation.',
      'Ask for missing product name, strength, lot, expiration, source, unit basis, and storage state before saving.',
      'Build a schedule from user-confirmed label details or user-entered instructions.',
      'Track adherence, active-container status, inventory depletion, user-entered outcome notes, and label photos without giving medical recommendations.',
    ],
  },
  citations: [
    {
      id: 'dailymed-norditropin',
      title: 'NORDITROPIN- somatropin injection, solution label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1058e17c-9261-459c-a3e6-fae38d196c14',
      source: 'DailyMed',
      year: 2025,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
