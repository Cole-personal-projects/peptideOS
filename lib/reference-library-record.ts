import { parse } from 'yaml';
import type {
  Citation,
  CompoundDosePreset,
  CompoundCategory,
  ConcentrationMode,
  CompoundType,
  DoseUnit,
  InventoryContainerType,
  ReferenceClinicalEvidence,
  ReferenceEvidenceTier,
  ReferenceSourceQuality,
  Route,
  ScheduleFrequency,
  ScheduleRecurrence,
} from './types';
import type { ReferenceCompound } from './reference-compounds';
import { validateReferenceCompound } from './reference-compounds';
import { buildBundledReferenceSnapshot, type ReferenceLibrarySnapshot } from './reference-library-snapshot';

type RecordStatus = 'draft' | 'approved' | 'rejected';
type RecordEvidenceTier =
  | 'identity_only'
  | 'preclinical'
  | 'human_limited'
  | 'human_strong'
  | 'phase_3_topline'
  | 'phase_3_active'
  | 'approved_label';
type RecordEvidenceLevel =
  | 'identity'
  | 'preclinical'
  | 'human_limited'
  | 'human_strong'
  | 'approved_label'
  | 'theoretical'
  | 'unknown';
type ClaimType = 'identity' | 'mechanism' | 'evidence' | 'risk' | 'formulation' | 'interaction' | 'regulatory' | 'tracking';
type SourceType = 'database' | 'publication' | 'review' | 'label' | 'trial' | 'regulatory' | 'other';
const bannedRecommendationLanguage = /\b(recommended dose|should take|safe dose|dose recommendation|frequency recommendation|duration recommendation|treatment recommendation|personal-use recommendation)\b/i;
const serializedObjectPlaceholder = /\[object Object\]/;
const allowedEvidenceTiers = new Set<RecordEvidenceTier>([
  'identity_only',
  'preclinical',
  'human_limited',
  'human_strong',
  'phase_3_topline',
  'phase_3_active',
  'approved_label',
]);
const allowedSourceTypes = new Set<SourceType>([
  'database',
  'publication',
  'review',
  'label',
  'trial',
  'regulatory',
  'other',
]);

export interface ReferenceLibraryRecord {
  schema_version: 1 | 2;
  compound_id: string;
  status: RecordStatus;
  updated_at: string;
  identity: {
    name: string;
    aliases: string[];
    non_aliases: string[];
    compound_type: CompoundType;
    categories?: CompoundCategory[];
  };
  classification?: {
    primary_category: CompoundCategory;
    category_group: string;
    secondary_categories: string[];
    protocol_categories: string[];
  };
  forms: {
    primary_route: Route;
    supported_routes: Route[];
    excluded_routes: Array<{ route: Route; reason: string }>;
    primary_unit?: DoseUnit;
    concentration_mode?: ConcentrationMode;
    form_factors: string[];
    verification_fields: string[];
  };
  mechanism?: {
    plain_english: string;
    targets: string[];
  };
  positioning: {
    why_use_this_compound: string[];
    who_is_tracking_this: string[];
    common_user_goals: string[];
  };
  evidence: {
    tier: RecordEvidenceTier;
    mechanism_targets: string[];
    claim_summary: string[];
    evidence_gaps: string[];
    clinical_evidence?: Array<{
      design: string;
      population: string;
      finding: string;
      citation_ids: string[];
      source_quality?: ReferenceSourceQuality;
      limitations?: string;
    }>;
    regulatory_status?: {
      status: 'approved' | 'investigational' | 'research-use' | 'unknown';
      region: string;
      summary: string;
      citation_ids: string[];
      source_quality?: ReferenceSourceQuality;
      limitations?: string;
    };
  };
  risks: {
    by_route: Partial<Record<Route, RouteRisks>>;
  };
  tracking: {
    useful_logs: string[];
    inventory_fields: string[];
    peppi_actions: string[];
  };
  handling?: {
    storage?: string[];
  };
  storage?: {
    handling?: string[];
  };
  calculator_profile?: {
    reconstitution_compatible: boolean;
    typical_vial_amounts: Array<{ value: number; unit: DoseUnit }>;
    typical_bac_water_ml: number[];
    syringe_types: string[];
    notes: string[];
  };
  inventory_profile?: {
    container_types: InventoryContainerType[];
    default_package_unit: 'vial' | 'kit';
    default_vial_count: number;
    required_fields: string[];
    optional_fields: string[];
  };
  protocol_templates?: Array<{
    id: string;
    name: string;
    category: string;
    difficulty: 'simple' | 'standard' | 'advanced' | 'custom';
    summary: string;
    compound_ids: string[];
    default_compound_id: string;
    dose_chips: Array<{ value: number; unit: DoseUnit; label: string }>;
    default_dose: { value: number; unit: DoseUnit };
    schedule: {
      frequency: ScheduleFrequency;
      times_of_day: string[];
      weekdays?: number[];
      interval_days?: number;
      cycle_on_days?: number;
      cycle_off_days?: number;
    };
    titration: Array<{ dose_value: number; dose_unit: DoseUnit; duration_weeks: number }>;
    warnings: string[];
    important_notes: string[];
  }>;
  peppi_actions?: Array<{
    id: string;
    type:
      | 'build_protocol_preview'
      | 'create_inventory_from_label'
      | 'calculate_reconstitution'
      | 'summarize_tracking'
      | 'answer_compound_question';
    label: string;
    requires_confirmation: boolean;
  }>;
  app_profile: {
    headline: string;
    summary: string;
    why_people_care: string[];
    what_to_verify: string[];
    what_to_track: string[];
    reality_check: string;
  };
  sources: ReferenceLibrarySource[];
  claims: ReferenceLibraryClaim[];
}

interface RouteRisks {
  known_contraindications: string[];
  caution_populations: string[];
  negative_stack_flags: string[];
  formulation_risks: string[];
  unknowns: string[];
}

type RouteRiskInput = Partial<RouteRisks> | string[] | null | undefined;

interface ReferenceLibrarySource {
  id: string;
  title: string;
  url: string;
  source_type: SourceType;
  publisher: string;
  year: number;
}

interface ReferenceLibraryClaim {
  id: string;
  text: string;
  claim_type: ClaimType;
  evidence_level: RecordEvidenceLevel;
  route_scope: Route[];
  source_ids: string[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
}

export function parseReferenceLibraryRecord(raw: string): ReferenceLibraryRecord {
  return parse(raw) as ReferenceLibraryRecord;
}

export function validateReferenceLibraryRecord(record: ReferenceLibraryRecord): string[] {
  const issues: string[] = [];
  const sourceIds = new Set(record.sources.map((source) => source.id));
  const supportedRoutes = new Set(record.forms.supported_routes);
  const allowedDoseUnits: DoseUnit[] = ['mcg', 'mg', 'iu'];

  if (!allowedEvidenceTiers.has(record.evidence.tier)) {
    issues.push(`${record.compound_id}: evidence.tier "${record.evidence.tier}" is invalid`);
  }

  if (!supportedRoutes.has(record.forms.primary_route)) {
    issues.push(`${record.compound_id}: forms.primary_route must be listed in forms.supported_routes`);
  }

  Object.keys(record.risks.by_route).forEach((route) => {
    if (!supportedRoutes.has(route as Route)) {
      issues.push(`${record.compound_id}: risks.by_route "${route}" must be listed in forms.supported_routes`);
    }
  });

  record.claims.forEach((claim) => {
    const allowsUncitedClaim = claim.evidence_level === 'unknown'
      || claim.evidence_level === 'theoretical'
      || (claim.confidence === 'low' && claim.limitations.length > 0);
    if (claim.source_ids.length === 0 && !allowsUncitedClaim) {
      issues.push(
        `${record.compound_id}: claim "${claim.id}" requires source_ids unless evidence_level is unknown/theoretical or the claim is low-confidence with limitations`,
      );
    }

    claim.source_ids.forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) {
        issues.push(`${record.compound_id}: claim "${claim.id}" references unknown source "${sourceId}"`);
      }
    });

    claim.route_scope.forEach((route) => {
      if (!supportedRoutes.has(route)) {
        issues.push(`${record.compound_id}: claim "${claim.id}" route_scope "${route}" must be listed in forms.supported_routes`);
      }
    });
  });

  record.sources.forEach((source) => {
    if (!allowedSourceTypes.has(source.source_type)) {
      issues.push(`${record.compound_id}: source "${source.id}" has invalid source_type "${source.source_type}"`);
    }
  });

  record.protocol_templates?.forEach((template) => {
    if (!template.compound_ids.includes(record.compound_id)) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" must include compound_id`);
    }
    if (!template.compound_ids.includes(template.default_compound_id)) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" default_compound_id must be listed in compound_ids`);
    }
    template.dose_chips.forEach((chip) => {
      if (!allowedDoseUnits.includes(chip.unit)) {
        issues.push(`${record.compound_id}: protocol template "${template.id}" has invalid dose chip unit "${chip.unit}"`);
      }
    });
    if (!allowedDoseUnits.includes(template.default_dose.unit)) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" has invalid default dose unit "${template.default_dose.unit}"`);
    }
    if (template.schedule.frequency !== 'weekly' && template.schedule.weekdays && template.schedule.weekdays.length > 0) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" weekly weekdays are only valid with weekly frequency`);
    }
    if (template.schedule.frequency === 'weekly' && (!template.schedule.weekdays || template.schedule.weekdays.length === 0)) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" weekly schedules require weekdays`);
    }
    if (template.schedule.frequency !== 'interval' && template.schedule.interval_days !== undefined) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" interval_days is only valid with interval frequency`);
    }
    if (template.schedule.frequency !== 'cycle' && (template.schedule.cycle_on_days !== undefined || template.schedule.cycle_off_days !== undefined)) {
      issues.push(`${record.compound_id}: protocol template "${template.id}" cycle fields are only valid with cycle frequency`);
    }
    template.titration.forEach((step) => {
      if (!allowedDoseUnits.includes(step.dose_unit)) {
        issues.push(`${record.compound_id}: protocol template "${template.id}" has invalid titration unit "${step.dose_unit}"`);
      }
    });
  });

  if (record.calculator_profile?.reconstitution_compatible && record.calculator_profile.typical_vial_amounts.length === 0) {
    issues.push(`${record.compound_id}: calculator_profile.typical_vial_amounts is required when reconstitution_compatible is true`);
  }

  if (record.inventory_profile && record.inventory_profile.default_vial_count < 1) {
    issues.push(`${record.compound_id}: inventory_profile.default_vial_count must be at least 1`);
  }

  if (bannedRecommendationLanguage.test(JSON.stringify(record))) {
    issues.push(`${record.compound_id}: contains banned recommendation language`);
  }

  if (serializedObjectPlaceholder.test(JSON.stringify(record))) {
    issues.push(`${record.compound_id}: contains serialized object placeholder text`);
  }

  return issues;
}

export function buildReferenceLibrarySnapshotFromRecords(
  records: readonly ReferenceLibraryRecord[],
  options: { exportedAt?: string } = {},
): ReferenceLibrarySnapshot {
  const approvedRecords = records.filter((record) => record.status === 'approved');
  const compounds = approvedRecords.map(referenceLibraryRecordToCompound);

  const snapshot = buildBundledReferenceSnapshot(compounds);
  return {
    ...snapshot,
    exportedAt: options.exportedAt ?? snapshot.exportedAt,
  };
}

export function referenceLibraryRecordToCompound(record: ReferenceLibraryRecord): ReferenceCompound {
  const recordIssues = validateReferenceLibraryRecord(record);
  if (recordIssues.length > 0) {
    throw new Error(`Reference library record "${record.compound_id}" failed validation:\n${recordIssues.join('\n')}`);
  }

  const citations = record.sources.map(sourceToCitation);
  const safetySignals = collectSafetySignals(record);
  const clinicalEvidence = record.evidence.clinical_evidence?.map((evidenceItem) => ({
    design: evidenceItem.design,
    population: evidenceItem.population,
    finding: evidenceItem.finding,
    citationIds: evidenceItem.citation_ids,
    sourceQuality: evidenceItem.source_quality,
    limitations: evidenceItem.limitations,
  })) ?? record.claims.map(claimToClinicalEvidence);

  const compound: ReferenceCompound = {
    id: record.compound_id,
    name: record.identity.name,
    aliases: record.identity.aliases,
    compoundType: record.identity.compound_type,
    category: record.classification?.primary_category ?? record.identity.categories?.[0] ?? 'custom',
    defaultRoute: record.forms.primary_route,
    supportedRoutes: record.forms.supported_routes,
    defaultDoseUnit: record.forms.primary_unit ?? 'mg',
    concentrationMode: record.forms.concentration_mode ?? 'none',
    dosePresets: buildDosePresets(record),
    vialPresets: buildVialPresets(record),
    ...(record.calculator_profile?.reconstitution_compatible ? {
      reconstitutionDefaults: {
        typicalVialAmounts: record.calculator_profile.typical_vial_amounts,
        typicalBacWaterMl: record.calculator_profile.typical_bac_water_ml,
      },
    } : {}),
    beginnerSummary: record.app_profile.summary,
    researcherDetails: record.app_profile.summary,
    mechanism: record.mechanism?.plain_english ?? record.evidence.mechanism_targets.join(', '),
    safety: safetySignals.join(' ') || 'No route-scoped risks were asserted in the reviewed record.',
    storage: buildStorageSummary(record),
    citations,
    referenceProfile: {
      evidenceTier: mapEvidenceTier(record.evidence.tier),
      biohackerBrief: {
        headline: record.app_profile.headline,
        whyPeopleCare: record.app_profile.why_people_care,
        verifyBeforeUse: record.app_profile.what_to_verify,
        trackInApp: record.app_profile.what_to_track,
        realityCheck: record.app_profile.reality_check,
      },
      reviewSummary: record.app_profile.summary,
      mechanismTargets: record.evidence.mechanism_targets,
      clinicalEvidence,
      safetySignals,
      practicalNotes: [
        ...record.positioning.why_use_this_compound,
        ...record.positioning.who_is_tracking_this,
        ...record.positioning.common_user_goals,
        ...record.tracking.useful_logs,
        ...record.tracking.inventory_fields.map((field) => `Inventory field: ${field}`),
      ],
      evidenceGaps: record.evidence.evidence_gaps,
      regulatoryStatus: {
        status: record.evidence.regulatory_status?.status ?? (record.evidence.tier === 'approved_label' ? 'approved' : 'unknown'),
        region: record.evidence.regulatory_status?.region ?? 'US',
        summary: record.evidence.regulatory_status?.summary ?? (record.evidence.tier === 'approved_label'
          ? 'Approved-label status is asserted by this source-backed record.'
          : 'No approved-label status is asserted by this source-backed record.'),
        citationIds: record.evidence.regulatory_status?.citation_ids ?? [],
        sourceQuality: record.evidence.regulatory_status?.source_quality ?? 'uncited-emerging',
        limitations: record.evidence.regulatory_status?.limitations ?? 'Regulatory status must be verified from source-backed records before display as approved.',
      },
      peptideOSActions: record.tracking.peppi_actions,
    },
    ...(record.classification ? {
      libraryClassification: {
        categoryGroup: record.classification.category_group,
        secondaryCategories: record.classification.secondary_categories,
        protocolCategories: record.classification.protocol_categories,
      },
    } : {}),
    ...(record.inventory_profile ? {
      inventoryProfile: {
        containerTypes: record.inventory_profile.container_types,
        defaultPackageUnit: record.inventory_profile.default_package_unit,
        defaultVialCount: record.inventory_profile.default_vial_count,
        requiredFields: record.inventory_profile.required_fields,
        optionalFields: record.inventory_profile.optional_fields,
      },
    } : {}),
    ...(record.calculator_profile ? {
      calculatorProfile: {
        reconstitutionCompatible: record.calculator_profile.reconstitution_compatible,
        typicalVialAmounts: record.calculator_profile.typical_vial_amounts,
        typicalBacWaterMl: record.calculator_profile.typical_bac_water_ml,
        syringeTypes: record.calculator_profile.syringe_types,
        notes: record.calculator_profile.notes,
      },
    } : {}),
    ...(record.protocol_templates ? {
      protocolTemplates: record.protocol_templates.map(toProtocolTemplate),
    } : {}),
    ...(record.peppi_actions ? {
      peppiActions: record.peppi_actions.map((action) => ({
        id: action.id,
        type: action.type,
        label: action.label,
        requiresConfirmation: action.requires_confirmation,
      })),
    } : {}),
    source: 'bundled',
    curationStatus: 'reviewed',
    updatedAt: record.updated_at,
  };

  const issues = validateReferenceCompound(compound);
  if (issues.length > 0) {
    throw new Error(`Reference library record "${record.compound_id}" did not convert to a valid app compound:\n${issues.join('\n')}`);
  }

  return compound;
}

function buildStorageSummary(record: ReferenceLibraryRecord): string {
  const storageNotes = [
    ...(record.handling?.storage ?? []),
    ...(record.storage?.handling ?? []),
  ].filter((note) => note.trim().length > 0);
  if (storageNotes.length > 0) {
    return storageNotes.join(' ');
  }

  return 'Verify storage and handling from the labeled product or source-backed container details.';
}

function buildVialPresets(record: ReferenceLibraryRecord): ReferenceCompound['vialPresets'] {
  if (!record.calculator_profile?.typical_vial_amounts.length) return [];

  return record.calculator_profile.typical_vial_amounts.map((amount) => ({
    label: `${amount.value} ${amount.unit} vial`,
    totalAmount: amount,
    sourceNote: 'Protocol-ready tracking default from reviewed compound intelligence record; verify against the actual vial label.',
    citationIds: record.sources.slice(0, 1).map((source) => source.id),
  }));
}

function buildDosePresets(record: ReferenceLibraryRecord): CompoundDosePreset[] {
  const citationIds = record.sources.slice(0, 1).map((source) => source.id);
  const seen = new Set<string>();

  return (record.protocol_templates ?? []).flatMap((template) => template.dose_chips).reduce<CompoundDosePreset[]>((presets, chip) => {
    const key = `${chip.value}:${chip.unit}`;
    if (seen.has(key)) return presets;
    seen.add(key);

    presets.push({
      label: `${chip.label} ${chip.unit}`,
      value: chip.value,
      unit: chip.unit,
      intent: 'commonResearchRange',
      sourceNote: 'Protocol-ready tracking preset from the reviewed compound intelligence record; included for user-confirmed logging context, not as guidance.',
      citationIds,
    });

    return presets;
  }, []);
}

function toProtocolTemplate(template: NonNullable<ReferenceLibraryRecord['protocol_templates']>[number]): NonNullable<ReferenceCompound['protocolTemplates']>[number] {
  const schedule: ScheduleRecurrence = {
    frequency: template.schedule.frequency,
    timesOfDay: template.schedule.times_of_day,
    ...(template.schedule.weekdays ? { weekdays: template.schedule.weekdays } : {}),
    ...(template.schedule.interval_days ? { intervalDays: template.schedule.interval_days } : {}),
    ...(template.schedule.cycle_on_days ? { cycleOnDays: template.schedule.cycle_on_days } : {}),
    ...(template.schedule.cycle_off_days ? { cycleOffDays: template.schedule.cycle_off_days } : {}),
  };

  return {
    id: template.id,
    name: template.name,
    category: template.category,
    difficulty: template.difficulty,
    summary: template.summary,
    compoundIds: template.compound_ids,
    defaultCompoundId: template.default_compound_id,
    doseChips: template.dose_chips,
    defaultDose: template.default_dose,
    schedule,
    titration: template.titration.map((step) => ({
      doseValue: step.dose_value,
      doseUnit: step.dose_unit,
      durationWeeks: step.duration_weeks,
    })),
    warnings: template.warnings,
    importantNotes: template.important_notes,
  };
}

function sourceToCitation(source: ReferenceLibrarySource): Citation {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    source: source.publisher,
    year: source.year,
  };
}

function claimToClinicalEvidence(claim: ReferenceLibraryClaim): ReferenceClinicalEvidence {
  const hasCitations = claim.source_ids.length > 0;
  return {
    design: claim.claim_type,
    population: claim.route_scope.join(', '),
    finding: claim.text,
    citationIds: claim.source_ids,
    sourceQuality: hasCitations ? mapSourceQuality(claim.evidence_level) : 'uncited-emerging',
    limitations: claim.limitations.join(' '),
  };
}

function mapEvidenceTier(tier: RecordEvidenceTier): ReferenceEvidenceTier {
  switch (tier) {
    case 'identity_only':
      return 'identity-only';
    case 'preclinical':
      return 'preclinical';
    case 'human_limited':
      return 'early-human';
    case 'human_strong':
      return 'phase-2-published';
    case 'phase_3_topline':
      return 'phase-3-topline';
    case 'phase_3_active':
      return 'phase-3-active';
    case 'approved_label':
      return 'approved-label';
  }
}

function mapSourceQuality(level: RecordEvidenceLevel): ReferenceSourceQuality {
  switch (level) {
    case 'approved_label':
      return 'label-backed';
    case 'human_strong':
    case 'human_limited':
    case 'preclinical':
    case 'identity':
      return 'source-backed';
    case 'theoretical':
    case 'unknown':
      return 'uncited-emerging';
  }
}

function collectSafetySignals(record: ReferenceLibraryRecord): string[] {
  return Object.entries(record.risks.by_route).flatMap(([route, risks]) => {
    const normalized = normalizeRouteRisks(risks);
    return [
      ...normalized.known_contraindications,
      ...normalized.caution_populations,
      ...normalized.negative_stack_flags,
      ...normalized.formulation_risks,
      ...normalized.unknowns,
    ].map((risk) => `${route}: ${risk}`);
  });
}

function normalizeRouteRisks(risks: RouteRiskInput): RouteRisks {
  if (Array.isArray(risks)) {
    return {
      known_contraindications: [],
      caution_populations: [],
      negative_stack_flags: [],
      formulation_risks: risks,
      unknowns: [],
    };
  }

  return {
    known_contraindications: risks?.known_contraindications ?? [],
    caution_populations: risks?.caution_populations ?? [],
    negative_stack_flags: risks?.negative_stack_flags ?? [],
    formulation_risks: risks?.formulation_risks ?? [],
    unknowns: risks?.unknowns ?? [],
  };
}
