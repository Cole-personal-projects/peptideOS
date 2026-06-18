import type { ReferenceCompound } from '../schema';

export const tb500: ReferenceCompound = {
  id: 'tb-500',
  name: 'TB-500 / Thymosin Beta-4',
  aliases: ['TB-500', 'Thymosin beta-4', 'Tbeta4'],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [
    {
      label: '5 mg lyophilized vial',
      totalAmount: { value: 5, unit: 'mg' },
      sourceNote: 'Common vial-size preset for inventory math; verify against the actual container label.',
      citationIds: ['pmc-thymosin-beta4-wound-healing'],
    },
  ],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [1, 2],
  },
  beginnerSummary: 'A thymosin beta-4 related peptide reference entry for healing/recovery tracking contexts.',
  researcherDetails: 'Thymosin beta-4 is a 43-amino-acid peptide studied in wound repair and tissue-regeneration models. TB-500 naming is tracked as a practical alias for user logging.',
  mechanism: 'Studied for actin-binding, cell migration, angiogenesis, and repair signaling roles in wound models.',
  safety: 'Research peptide. This reference entry supports tracking context only and does not provide use guidance.',
  storage: 'Lyophilized research peptides are commonly tracked with vial-specific storage notes; follow the actual container label.',
  referenceProfile: {
    evidenceTier: 'early-human',
    biohackerBrief: {
      headline: 'TB-500 / thymosin beta-4 is a recovery-market entry where PeptideOS should separate label identity, vial math, and thymosin beta-4 evidence from unsupported product claims.',
      whyPeopleCare: [
        'Users associate TB-500 with thymosin beta-4 repair, cell-migration, angiogenesis, and wound-healing research.',
        'The marketplace name TB-500 may refer to fragments or products that are not identical to full thymosin beta-4 research materials.',
        'Most user workflows involve lyophilized vial inventory, reconstitution math, active-vial tracking, and recovery-note logging.',
      ],
      verifyBeforeUse: [
        'Exact label name, whether it says TB-500 or thymosin beta-4, vial amount, lot, source, and container state.',
        'Whether the product is a single compound or a blend with BPC-157, GHK-Cu, or other recovery-market compounds.',
        'COA, sterility/endotoxin documentation, expiration, storage instructions, and supplier handling notes when available.',
      ],
      trackInApp: [
        'Inventory by vial or kit with vial amount, reconstitution date, BAC volume, concentration, and active vial state.',
        'Recovery context notes, schedule adherence, missed doses, site/location notes, and user-entered response patterns.',
        'Evidence flags that distinguish full thymosin beta-4 literature from TB-500 marketplace claims.',
      ],
      realityCheck: 'TB-500 is not just a clean synonym for every thymosin beta-4 study. PeptideOS should track the exact product label and keep evidence limits visible while still handling vial math well.',
    },
    reviewSummary: 'TB-500 / thymosin beta-4 has repair-oriented research context and some human thymosin beta-4 study context, but marketplace TB-500 products require careful identity and quality tracking. PeptideOS treats it as research-use inventory and logging context.',
    mechanismTargets: [
      'actin-binding context',
      'cell migration',
      'angiogenesis and repair signaling context',
    ],
    clinicalEvidence: [
      {
        design: 'thymosin-beta-4-review-literature',
        population: 'Wound-healing and tissue-repair model literature',
        finding: 'Review literature describes thymosin beta-4 roles in wound repair and tissue-regeneration models relevant to why users track this compound family.',
        citationIds: ['pmc-thymosin-beta4-wound-healing'],
        sourceQuality: 'source-backed',
        limitations: 'This evidence is for thymosin beta-4 context and should not be treated as proof for every TB-500-labeled vial.',
      },
      {
        design: 'tb-500-market-identity-context',
        population: 'Users encountering TB-500-labeled research vials',
        finding: 'The exact peptide identity, amount, sterility, and concentration must come from the vial label and source documentation, not from thymosin beta-4 assumptions.',
        citationIds: [],
        sourceQuality: 'community-reported',
        limitations: 'This is practical product-risk context rather than clinical efficacy evidence.',
      },
    ],
    safetySignals: [
      'Human evidence for TB-500-labeled research products is not equivalent to approved-product evidence.',
      'Research-market vials can introduce identity, purity, sterility, endotoxin, storage, and concentration uncertainty.',
      'Blended recovery products can make schedule attribution and side-effect attribution unreliable without exact inventory records.',
    ],
    practicalNotes: [
      'Record whether the label says TB-500, thymosin beta-4, or a blend before saving inventory.',
      'Calculate concentration only from confirmed vial amount and BAC water volume.',
      'Keep vial-level records even when inventory is added as a kit so identical vials can still be depleted accurately.',
    ],
    evidenceGaps: [
      'No US approved product label is attached to this TB-500 reference entry.',
      'Full thymosin beta-4 literature does not automatically validate every TB-500-labeled research vial or fragment product.',
      'Community-market material may not match literature identity, purity, sterility, concentration, or stability.',
    ],
    regulatoryStatus: {
      status: 'research-use',
      region: 'US',
      summary: 'PeptideOS treats TB-500 / thymosin beta-4 as research-use tracking context with no approved US product label attached to this reference entry.',
      citationIds: [],
      sourceQuality: 'community-reported',
      limitations: 'Regulatory handling varies by product identity, market, and claims; this app entry does not validate legality, sourcing, or clinical use.',
    },
    peptideOSActions: [
      'Add TB-500 or thymosin beta-4 vials or kits to inventory from a label photo after user confirmation.',
      'Ask whether the product is single-compound or blended before creating inventory.',
      'Calculate concentration from user-confirmed vial amount and BAC water volume.',
      'Build schedules only from user-entered instructions and tie logs to the active vial.',
      'Flag missing lot, source, identity, vial amount, BAC volume, reconstitution date, or container state.',
    ],
  },
  citations: [
    {
      id: 'pmc-thymosin-beta4-wound-healing',
      title: 'Research advances on thymosin beta 4 in promoting wound healing',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11704510/',
      source: 'PMC',
      year: 2022,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
