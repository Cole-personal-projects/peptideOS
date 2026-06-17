import type { CompoundDosePreset, CompoundReferenceProfile, CompoundVialPreset, InventoryContainerType } from './types';
import type { ReferenceLibrarySnapshot } from './reference-library-snapshot';

export interface ReferenceRegistrySeed {
  sourceSnapshot: ReferenceLibrarySnapshot;
  compounds: ReferenceCompoundRow[];
  aliases: ReferenceAliasRow[];
  categories: ReferenceCategoryRow[];
  forms: ReferenceFormRow[];
  citations: ReferenceCitationRow[];
  compoundCitations: ReferenceCompoundCitationRow[];
  dosePresets: ReferenceDosePresetRow[];
  vialPresets: ReferenceVialPresetRow[];
  workflowMetadata: ReferenceWorkflowMetadataRow[];
  contentBlocks: ReferenceContentBlockRow[];
  libraryRelease: ReferenceLibraryReleaseRow;
  releaseItems: ReferenceLibraryReleaseItemRow[];
}

export interface ReferenceCompoundRow {
  slug: string;
  canonical_name: string;
  summary: string;
  compound_type: string;
  default_route: string;
  default_dose_unit: string;
  concentration_mode: string;
  review_status: 'reviewed';
  confidence_tier: 'limited' | 'moderate' | 'strong';
  source_notes: string;
}

export interface ReferenceAliasRow {
  compound_slug: string;
  alias: string;
  alias_type: 'synonym';
}

export interface ReferenceCategoryRow {
  compound_slug: string;
  category: string;
  primary_category: boolean;
}

export interface ReferenceFormRow {
  compound_slug: string;
  form_type: string;
  primary_unit: string;
  allowed_units: string[];
  reconstitution_compatible: boolean;
  container_type: InventoryContainerType;
  form_notes: string;
}

export interface ReferenceCitationRow {
  id: string;
  source_type: 'label' | 'database' | 'publication' | 'other';
  title: string;
  url: string;
  publisher: string;
  published_year: number | null;
}

export interface ReferenceCompoundCitationRow {
  compound_slug: string;
  citation_id: string;
  supports_field: string;
  note: string;
}

export interface ReferenceDosePresetRow {
  id: string;
  compound_slug: string;
  label: string;
  value: number;
  unit: string;
  intent: CompoundDosePreset['intent'];
  source_note: string;
  citation_ids: string[];
  sort_order: number;
}

export interface ReferenceVialPresetRow {
  id: string;
  compound_slug: string;
  label: string;
  total_amount_value: number | null;
  total_amount_unit: string | null;
  concentration_value: number | null;
  concentration_unit: string | null;
  volume_ml: number | null;
  source_note: string;
  citation_ids: string[];
  sort_order: number;
}

export interface ReferenceWorkflowMetadataRow {
  compound_slug: string;
  can_log_dose: boolean;
  can_add_to_stack: boolean;
  can_reconstitute: boolean;
  can_track_inventory: boolean;
  workflow_notes: string;
}

export interface ReferenceContentBlockRow {
  id: string;
  compound_slug: string;
  block_type: 'field_brief' | 'evidence_snapshot' | 'safety_watch' | 'regulatory_status';
  title: string;
  content: Record<string, unknown>;
  citation_ids: string[];
  review_status: 'reviewed';
  content_version: number;
}

export interface ReferenceLibraryReleaseRow {
  release_version: string;
  release_notes: string;
  source_snapshot_version: string;
  published_by: string;
}

export interface ReferenceLibraryReleaseItemRow {
  release_version: string;
  compound_slug: string;
  content_block_id: string;
  sort_order: number;
}

export function buildReferenceRegistrySeed(snapshot: ReferenceLibrarySnapshot): ReferenceRegistrySeed {
  const compounds = [...snapshot.compounds].sort((a, b) => a.id.localeCompare(b.id));
  const contentBlocks = compounds.flatMap((compound) => (
    compound.referenceProfile
      ? toContentBlockRows(compound.id, compound.referenceProfile)
      : []
  ));

  return {
    sourceSnapshot: snapshot,
    compounds: compounds.map((compound) => ({
      slug: compound.id,
      canonical_name: compound.name,
      summary: compound.beginnerSummary,
      compound_type: compound.compoundType,
      default_route: compound.defaultRoute,
      default_dose_unit: compound.defaultDoseUnit,
      concentration_mode: compound.concentrationMode,
      review_status: 'reviewed',
      confidence_tier: 'limited',
      source_notes: 'Imported from reviewed PeptideOS bundled reference library.',
    })),
    aliases: compounds.flatMap((compound) => compound.aliases.map((alias) => ({
      compound_slug: compound.id,
      alias,
      alias_type: 'synonym',
    }))),
    categories: compounds.map((compound) => ({
      compound_slug: compound.id,
      category: compound.category,
      primary_category: true,
    })),
    forms: compounds.map((compound) => ({
      compound_slug: compound.id,
      form_type: compound.concentrationMode,
      primary_unit: compound.defaultDoseUnit,
      allowed_units: [...new Set([
        compound.defaultDoseUnit,
        ...compound.dosePresets.map((preset) => preset.unit),
        ...compound.vialPresets.flatMap((preset) => preset.totalAmount?.unit ? [preset.totalAmount.unit] : []),
      ])].sort(),
      reconstitution_compatible: Boolean(compound.reconstitutionDefaults),
      container_type: getContainerType(compound.concentrationMode),
      form_notes: compound.storage,
    })),
    citations: snapshot.citations.map((citation) => ({
      id: citation.id,
      source_type: inferCitationSourceType(citation.source),
      title: citation.title,
      url: citation.url,
      publisher: citation.source,
      published_year: citation.year || null,
    })),
    compoundCitations: compounds.flatMap((compound) => compound.citations.map((citation) => ({
      compound_slug: compound.id,
      citation_id: citation.id,
      supports_field: 'overview',
      note: 'Supports reviewed reference entry.',
    }))),
    dosePresets: compounds.flatMap((compound) => compound.dosePresets.map((preset, index) => toDosePresetRow(compound.id, preset, index))),
    vialPresets: compounds.flatMap((compound) => compound.vialPresets.map((preset, index) => toVialPresetRow(compound.id, preset, index))),
    workflowMetadata: compounds.map((compound) => ({
      compound_slug: compound.id,
      can_log_dose: true,
      can_add_to_stack: true,
      can_reconstitute: Boolean(compound.reconstitutionDefaults),
      can_track_inventory: true,
      workflow_notes: 'Generated from reviewed PeptideOS bundled reference metadata.',
    })),
    contentBlocks,
    libraryRelease: {
      release_version: snapshot.libraryVersion,
      release_notes: 'Generated from reviewed PeptideOS bundled reference library.',
      source_snapshot_version: snapshot.libraryVersion,
      published_by: 'peptideos-bundled-export',
    },
    releaseItems: contentBlocks.map((block, index) => ({
      release_version: snapshot.libraryVersion,
      compound_slug: block.compound_slug,
      content_block_id: block.id,
      sort_order: index,
    })),
  };
}

function toContentBlockRows(compoundSlug: string, profile: CompoundReferenceProfile): ReferenceContentBlockRow[] {
  return [
    {
      id: `${compoundSlug}-field-brief-v1`,
      compound_slug: compoundSlug,
      block_type: 'field_brief',
      title: 'Field Brief',
      content: { ...profile.biohackerBrief },
      citation_ids: [],
      review_status: 'reviewed',
      content_version: 1,
    },
    {
      id: `${compoundSlug}-evidence-snapshot-v1`,
      compound_slug: compoundSlug,
      block_type: 'evidence_snapshot',
      title: 'Evidence Snapshot',
      content: {
        evidenceTier: profile.evidenceTier,
        reviewSummary: profile.reviewSummary,
        mechanismTargets: profile.mechanismTargets,
        clinicalEvidence: profile.clinicalEvidence,
        evidenceGaps: profile.evidenceGaps,
      },
      citation_ids: unique(profile.clinicalEvidence.flatMap((evidence) => evidence.citationIds)),
      review_status: 'reviewed',
      content_version: 1,
    },
    {
      id: `${compoundSlug}-safety-watch-v1`,
      compound_slug: compoundSlug,
      block_type: 'safety_watch',
      title: 'Safety Watch',
      content: {
        safetySignals: profile.safetySignals,
        practicalNotes: profile.practicalNotes,
        peptideOSActions: profile.peptideOSActions,
      },
      citation_ids: [],
      review_status: 'reviewed',
      content_version: 1,
    },
    {
      id: `${compoundSlug}-regulatory-status-v1`,
      compound_slug: compoundSlug,
      block_type: 'regulatory_status',
      title: 'Regulatory Status',
      content: { ...profile.regulatoryStatus },
      citation_ids: [...profile.regulatoryStatus.citationIds],
      review_status: 'reviewed',
      content_version: 1,
    },
  ];
}

function toDosePresetRow(compoundSlug: string, preset: CompoundDosePreset, index: number): ReferenceDosePresetRow {
  return {
    id: `${compoundSlug}-dose-preset-${index + 1}`,
    compound_slug: compoundSlug,
    label: preset.label,
    value: preset.value,
    unit: preset.unit,
    intent: preset.intent,
    source_note: preset.sourceNote,
    citation_ids: [...preset.citationIds],
    sort_order: index,
  };
}

function toVialPresetRow(compoundSlug: string, preset: CompoundVialPreset, index: number): ReferenceVialPresetRow {
  return {
    id: `${compoundSlug}-vial-preset-${index + 1}`,
    compound_slug: compoundSlug,
    label: preset.label,
    total_amount_value: preset.totalAmount?.value ?? null,
    total_amount_unit: preset.totalAmount?.unit ?? null,
    concentration_value: preset.concentration?.value ?? null,
    concentration_unit: preset.concentration?.unit ?? null,
    volume_ml: preset.volumeMl ?? null,
    source_note: preset.sourceNote,
    citation_ids: [...preset.citationIds],
    sort_order: index,
  };
}

function getContainerType(concentrationMode: string): InventoryContainerType {
  if (concentrationMode === 'reconstituted') return 'lyophilized-vial';
  if (concentrationMode === 'concentration') return 'multi-dose-vial';
  if (concentrationMode === 'prefilled') return 'prefilled-pen';
  return 'other';
}

function inferCitationSourceType(source: string): ReferenceCitationRow['source_type'] {
  const normalized = source.toLowerCase();

  if (normalized.includes('dailymed') || normalized.includes('fda')) return 'label';
  if (normalized.includes('pubchem')) return 'database';
  if (normalized.includes('pubmed') || normalized.includes('journal')) return 'publication';
  return 'other';
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
