import { buildReferenceLibrarySnapshotFromRegistrySeed } from './reference-library-export';
import type { ReferenceLibrarySnapshot } from './reference-library-snapshot';
import { validateReferenceSnapshot } from './reference-library-snapshot';
import type { ReferenceLibraryReleaseRow, ReferenceRegistrySeed } from './reference-registry-seed';
import type {
  ReferenceAliasRow,
  ReferenceCategoryRow,
  ReferenceCompoundCitationRow,
  ReferenceCompoundRow,
  ReferenceContentBlockRow,
  ReferenceCitationRow,
  ReferenceDosePresetRow,
  ReferenceFormRow,
  ReferenceLibraryReleaseItemRow,
  ReferenceVialPresetRow,
  ReferenceWorkflowMetadataRow,
} from './reference-registry-seed';

export interface ReferenceLibraryRegistryReader {
  listLibraryReleases: () => Promise<ReferenceLibraryReleaseRow[]>;
  getRegistrySeedForRelease: (releaseVersion: string) => Promise<ReferenceRegistrySeed | null>;
}

export interface ReleasedReferenceLibraryOptions {
  fallbackSnapshot: ReferenceLibrarySnapshot;
  exportedFrom: string;
}

export interface ReleasedReferenceLibrary {
  source: 'supabase' | 'bundled-fallback';
  snapshot: ReferenceLibrarySnapshot;
  fallbackReason?: string;
}

interface SupabaseQuery<T> extends PromiseLike<{ data: T[] | null; error: { message: string } | null }> {
  eq: (column: string, value: unknown) => SupabaseQuery<T>;
  in: (column: string, values: unknown[]) => SupabaseQuery<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQuery<T>;
}

export interface SupabaseReferenceLibraryClient {
  from: (tableName: string) => {
    select: (columns?: string) => SupabaseQuery<Record<string, unknown>>;
  };
}

export async function getReleasedReferenceLibrary(
  reader: ReferenceLibraryRegistryReader,
  options: ReleasedReferenceLibraryOptions,
): Promise<ReleasedReferenceLibrary> {
  try {
    const releases = await reader.listLibraryReleases();
    const latestRelease = [...releases].sort(compareReleaseRowsDescending)[0];

    if (!latestRelease) {
      return toBundledFallback(options.fallbackSnapshot, 'No published reference library release found.');
    }

    const seed = await reader.getRegistrySeedForRelease(latestRelease.release_version);

    if (!seed) {
      return toBundledFallback(
        options.fallbackSnapshot,
        `Reference library release "${latestRelease.release_version}" could not be loaded.`,
      );
    }

    const snapshot = buildReferenceLibrarySnapshotFromRegistrySeed(seed, {
      exportedAt: latestRelease.published_at,
      exportedFrom: options.exportedFrom,
    });
    const issues = validateReferenceSnapshot(snapshot);

    if (issues.length > 0) {
      return toBundledFallback(
        options.fallbackSnapshot,
        `Reference library release "${latestRelease.release_version}" failed validation.`,
      );
    }

    return {
      source: 'supabase',
      snapshot,
    };
  } catch {
    return toBundledFallback(options.fallbackSnapshot, 'Reference library release failed validation.');
  }
}

function toBundledFallback(snapshot: ReferenceLibrarySnapshot, reason: string): ReleasedReferenceLibrary {
  return {
    source: 'bundled-fallback',
    snapshot,
    fallbackReason: reason,
  };
}

function compareReleaseRowsDescending(a: ReferenceLibraryReleaseRow, b: ReferenceLibraryReleaseRow) {
  const publishedAtCompare = b.published_at.localeCompare(a.published_at);
  if (publishedAtCompare !== 0) return publishedAtCompare;

  return b.release_version.localeCompare(a.release_version);
}

export function createSupabaseReferenceLibraryReader(client: SupabaseReferenceLibraryClient): ReferenceLibraryRegistryReader {
  return {
    async listLibraryReleases() {
      return queryRows<ReferenceLibraryReleaseRow>(
        client.from('reference_library_releases').select('*').order('published_at', { ascending: false }),
      );
    },

    async getRegistrySeedForRelease(releaseVersion: string) {
      const releases = await queryRows<ReferenceLibraryReleaseRow>(
        client.from('reference_library_releases').select('*').eq('release_version', releaseVersion),
      );
      const libraryRelease = releases[0];
      if (!libraryRelease) return null;

      const releaseItemsRaw = await queryRows<SupabaseReleaseItemRow>(
        client.from('reference_library_release_items').select('*').eq('release_version', releaseVersion),
      );
      const compoundsRaw = await queryRows<SupabaseCompoundRow>(
        client.from('reference_compounds').select('*').eq('review_status', 'reviewed'),
      );
      const compoundIds = unique(compoundsRaw.map((compound) => compound.id));
      const contentBlockIds = unique(releaseItemsRaw.map((item) => item.content_block_id));

      if (compoundIds.length === 0) return null;

      const [
        aliasesRaw,
        categoriesRaw,
        formsRaw,
        compoundCitationsRaw,
        dosePresetsRaw,
        vialPresetsRaw,
        workflowMetadataRaw,
        contentBlocksRaw,
      ] = await Promise.all([
        queryRows<SupabaseAliasRow>(client.from('reference_compound_aliases').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseCategoryRow>(client.from('reference_compound_categories').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseFormRow>(client.from('reference_compound_forms').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseCompoundCitationRow>(client.from('reference_compound_citations').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseDosePresetRow>(client.from('reference_dose_presets').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseVialPresetRow>(client.from('reference_vial_presets').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseWorkflowMetadataRow>(client.from('reference_workflow_metadata').select('*').in('compound_id', compoundIds)),
        queryRows<SupabaseContentBlockRow>(client.from('reference_content_blocks').select('*').in('id', contentBlockIds)),
      ]);

      const compoundSlugById = new Map(compoundsRaw.map((compound) => [compound.id, compound.slug]));
      const contentBlockById = new Map(contentBlocksRaw.map((block) => [block.id, block]));
      const citationIds = unique([
        ...compoundCitationsRaw.map((citation) => citation.citation_id),
        ...contentBlocksRaw.flatMap((block) => block.citation_ids),
      ]);
      const citations = citationIds.length > 0
        ? await queryRows<ReferenceCitationRow>(client.from('reference_citations').select('*').in('id', citationIds))
        : [];

      return {
        compounds: compoundsRaw.map(toReferenceCompoundRow),
        aliases: aliasesRaw.map((alias): ReferenceAliasRow => ({
          compound_slug: getSlug(compoundSlugById, alias.compound_id),
          alias: alias.alias,
          alias_type: alias.alias_type,
        })),
        categories: categoriesRaw.map((category): ReferenceCategoryRow => ({
          compound_slug: getSlug(compoundSlugById, category.compound_id),
          category: category.category,
          primary_category: category.primary_category,
        })),
        forms: formsRaw.map((form): ReferenceFormRow => ({
          compound_slug: getSlug(compoundSlugById, form.compound_id),
          form_type: form.form_type,
          primary_unit: form.primary_unit,
          allowed_units: form.allowed_units,
          reconstitution_compatible: form.reconstitution_compatible,
          typical_vial_amounts: normalizeVialAmounts(form.typical_vial_amounts),
          typical_bac_water_ml: form.typical_bac_water_ml.map(Number),
          container_type: form.container_type,
          form_notes: form.form_notes,
        })),
        citations,
        compoundCitations: compoundCitationsRaw.map((citation): ReferenceCompoundCitationRow => ({
          compound_slug: getSlug(compoundSlugById, citation.compound_id),
          citation_id: citation.citation_id,
          supports_field: citation.supports_field,
          note: citation.note,
        })),
        dosePresets: dosePresetsRaw.map((preset): ReferenceDosePresetRow => ({
          id: preset.id,
          compound_slug: getSlug(compoundSlugById, preset.compound_id),
          label: preset.label,
          value: Number(preset.value),
          unit: preset.unit,
          intent: preset.intent,
          source_note: preset.source_note,
          citation_ids: preset.citation_ids,
          sort_order: preset.sort_order,
        })),
        vialPresets: vialPresetsRaw.map((preset): ReferenceVialPresetRow => ({
          id: preset.id,
          compound_slug: getSlug(compoundSlugById, preset.compound_id),
          label: preset.label,
          total_amount_value: nullableNumber(preset.total_amount_value),
          total_amount_unit: preset.total_amount_unit,
          concentration_value: nullableNumber(preset.concentration_value),
          concentration_unit: preset.concentration_unit,
          volume_ml: nullableNumber(preset.volume_ml),
          source_note: preset.source_note,
          citation_ids: preset.citation_ids,
          sort_order: preset.sort_order,
        })),
        workflowMetadata: workflowMetadataRaw.map((metadata): ReferenceWorkflowMetadataRow => ({
          compound_slug: getSlug(compoundSlugById, metadata.compound_id),
          can_log_dose: metadata.can_log_dose,
          can_add_to_stack: metadata.can_add_to_stack,
          can_reconstitute: metadata.can_reconstitute,
          can_track_inventory: metadata.can_track_inventory,
          workflow_notes: metadata.workflow_notes,
        })),
        contentBlocks: contentBlocksRaw.map((block): ReferenceContentBlockRow => ({
          id: block.id,
          compound_slug: getSlug(compoundSlugById, block.compound_id),
          block_type: block.block_type,
          title: block.title,
          content: block.content,
          citation_ids: block.citation_ids,
          review_status: block.review_status,
          content_version: block.content_version,
        })),
        libraryRelease,
        releaseItems: releaseItemsRaw.map((item): ReferenceLibraryReleaseItemRow => ({
          release_version: item.release_version,
          compound_slug: getSlug(compoundSlugById, item.compound_id),
          content_block_id: contentBlockById.get(item.content_block_id)?.id ?? item.content_block_id,
          sort_order: item.sort_order,
        })),
      };
    },
  };
}

async function queryRows<T>(query: SupabaseQuery<Record<string, unknown>>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

function toReferenceCompoundRow(row: SupabaseCompoundRow): ReferenceCompoundRow {
  return {
    slug: row.slug,
    canonical_name: row.canonical_name,
    summary: row.summary,
    compound_type: row.compound_type,
    default_route: row.default_route,
    default_dose_unit: row.default_dose_unit,
    concentration_mode: row.concentration_mode,
    review_status: row.review_status,
    confidence_tier: row.confidence_tier,
    source_notes: row.source_notes,
  };
}

function getSlug(compoundSlugById: Map<string, string>, compoundId: string) {
  const slug = compoundSlugById.get(compoundId);
  if (!slug) throw new Error(`Missing reference compound for id "${compoundId}"`);
  return slug;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function nullableNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

function normalizeVialAmounts(value: Array<{ value: number | string; unit: string }>) {
  return value.map((amount) => ({
    value: Number(amount.value),
    unit: amount.unit,
  }));
}

interface SupabaseCompoundRow extends ReferenceCompoundRow {
  id: string;
}

interface SupabaseAliasRow {
  compound_id: string;
  alias: string;
  alias_type: ReferenceAliasRow['alias_type'];
}

interface SupabaseCategoryRow {
  compound_id: string;
  category: string;
  primary_category: boolean;
}

interface SupabaseFormRow {
  compound_id: string;
  form_type: string;
  primary_unit: string;
  allowed_units: string[];
  reconstitution_compatible: boolean;
  typical_vial_amounts: Array<{ value: number | string; unit: string }>;
  typical_bac_water_ml: Array<number | string>;
  container_type: ReferenceFormRow['container_type'];
  form_notes: string;
}

interface SupabaseCompoundCitationRow {
  compound_id: string;
  citation_id: string;
  supports_field: string;
  note: string;
}

interface SupabaseDosePresetRow extends Omit<ReferenceDosePresetRow, 'compound_slug' | 'value'> {
  compound_id: string;
  value: number | string;
}

interface SupabaseVialPresetRow extends Omit<ReferenceVialPresetRow, 'compound_slug' | 'total_amount_value' | 'concentration_value' | 'volume_ml'> {
  compound_id: string;
  total_amount_value: number | string | null;
  concentration_value: number | string | null;
  volume_ml: number | string | null;
}

interface SupabaseWorkflowMetadataRow {
  compound_id: string;
  can_log_dose: boolean;
  can_add_to_stack: boolean;
  can_reconstitute: boolean;
  can_track_inventory: boolean;
  workflow_notes: string;
}

interface SupabaseContentBlockRow extends Omit<ReferenceContentBlockRow, 'compound_slug'> {
  compound_id: string;
}

interface SupabaseReleaseItemRow {
  release_version: string;
  compound_id: string;
  content_block_id: string;
  sort_order: number;
}
