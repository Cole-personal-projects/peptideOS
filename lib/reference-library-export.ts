import type { ReferenceCompound } from './reference-compounds';
import type { ReferenceLibrarySnapshot } from './reference-library-snapshot';
import type {
  ReferenceContentBlockRow,
  ReferenceRegistrySeed,
} from './reference-registry-seed';
import type {
  CompoundBiohackerBrief,
  CompoundActionableProfile,
  CompoundReferenceProfile,
  ReferenceClinicalEvidence,
  ReferenceRegulatoryStatus,
} from './types';

export interface ReferenceLibraryExportOptions {
  exportedAt: string;
  exportedFrom: string;
}

export function buildReferenceLibrarySnapshotFromRegistrySeed(
  seed: ReferenceRegistrySeed,
  options: ReferenceLibraryExportOptions,
): ReferenceLibrarySnapshot {
  const issues = validateReferenceRegistrySeedForExport(seed);
  if (issues.length > 0) {
    throw new Error(`Reference registry export failed:\n${issues.join('\n')}`);
  }

  const compounds = seed.compounds.map((compoundRow): ReferenceCompound => {
    const aliases = seed.aliases
      .filter((alias) => alias.compound_slug === compoundRow.slug)
      .map((alias) => alias.alias)
      .sort();
    const categories = seed.categories.filter((category) => category.compound_slug === compoundRow.slug);
    const forms = seed.forms.filter((form) => form.compound_slug === compoundRow.slug);
    const primaryForm = forms[0];
    const dosePresets = seed.dosePresets
      .filter((preset) => preset.compound_slug === compoundRow.slug)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((preset) => ({
        label: preset.label,
        value: preset.value,
        unit: preset.unit as ReferenceCompound['defaultDoseUnit'],
        intent: preset.intent,
        sourceNote: preset.source_note,
        citationIds: [...preset.citation_ids],
      }));
    const vialPresets = seed.vialPresets
      .filter((preset) => preset.compound_slug === compoundRow.slug)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((preset) => ({
        label: preset.label,
        totalAmount: preset.total_amount_value && preset.total_amount_unit
          ? { value: preset.total_amount_value, unit: preset.total_amount_unit as ReferenceCompound['defaultDoseUnit'] }
          : undefined,
        concentration: preset.concentration_value && preset.concentration_unit
          ? { value: preset.concentration_value, unit: preset.concentration_unit as 'mg/ml' | 'iu/ml' }
          : undefined,
        volumeMl: preset.volume_ml ?? undefined,
        sourceNote: preset.source_note,
        citationIds: [...preset.citation_ids],
      }));
    const citationIds = seed.compoundCitations
      .filter((citation) => citation.compound_slug === compoundRow.slug)
      .map((citation) => citation.citation_id);
    const citations = seed.citations
      .filter((citation) => citationIds.includes(citation.id))
      .map((citation) => ({
        id: citation.id,
        title: citation.title,
        url: citation.url,
        source: citation.publisher,
        year: citation.published_year ?? 0,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return {
      id: compoundRow.slug,
      name: compoundRow.canonical_name,
      aliases,
      compoundType: compoundRow.compound_type as ReferenceCompound['compoundType'],
      category: (categories.find((category) => category.primary_category) ?? categories[0]).category as ReferenceCompound['category'],
      defaultRoute: compoundRow.default_route as ReferenceCompound['defaultRoute'],
      supportedRoutes: [compoundRow.default_route as ReferenceCompound['defaultRoute']],
      defaultDoseUnit: compoundRow.default_dose_unit as ReferenceCompound['defaultDoseUnit'],
      concentrationMode: compoundRow.concentration_mode as ReferenceCompound['concentrationMode'],
      dosePresets,
      vialPresets,
      reconstitutionDefaults: primaryForm?.reconstitution_compatible
        ? {
            typicalVialAmounts: primaryForm.typical_vial_amounts.map((amount) => ({
              value: amount.value,
              unit: amount.unit as ReferenceCompound['defaultDoseUnit'],
            })),
            typicalBacWaterMl: [...primaryForm.typical_bac_water_ml],
          }
        : undefined,
      beginnerSummary: compoundRow.summary,
      researcherDetails: compoundRow.source_notes,
      mechanism: undefined,
      safety: compoundRow.source_notes,
      storage: primaryForm?.form_notes ?? '',
      citations,
      referenceProfile: buildReferenceProfileFromContentBlocks(
        seed.contentBlocks.filter((block) => block.compound_slug === compoundRow.slug),
      ),
      actionableProfile: buildActionableProfileFromContentBlocks(
        seed.contentBlocks.filter((block) => block.compound_slug === compoundRow.slug),
      ),
      source: 'bundled',
      curationStatus: 'reviewed',
    };
  });

  return {
    libraryVersion: seed.libraryRelease.release_version,
    schemaVersion: 1,
    exportedAt: options.exportedAt,
    source: {
      kind: 'supabase-export',
      registry: 'peptideos-reference-registry',
      exportedFrom: options.exportedFrom,
    },
    validation: {
      policyVersion: 1,
      reviewedOnly: true,
    },
    compounds,
    citations: seed.citations.map((citation) => ({
      id: citation.id,
      title: citation.title,
      url: citation.url,
      source: citation.publisher,
      year: citation.published_year ?? 0,
    })).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function validateReferenceRegistrySeedForExport(seed: ReferenceRegistrySeed): string[] {
  const issues: string[] = [];

  if (seed.compounds.length === 0) {
    issues.push(`release ${seed.libraryRelease.release_version}: at least one compound is required`);
  }

  const contentBlockIds = new Set(seed.contentBlocks.map((block) => block.id));
  const compoundSlugs = new Set(seed.compounds.map((compound) => compound.slug));

  seed.releaseItems.forEach((item) => {
    if (item.release_version !== seed.libraryRelease.release_version) {
      issues.push(`release ${seed.libraryRelease.release_version}: release item uses unexpected version "${item.release_version}"`);
    }
    if (!compoundSlugs.has(item.compound_slug)) {
      issues.push(`release ${seed.libraryRelease.release_version}: release item references missing compound "${item.compound_slug}"`);
    }
    if (!contentBlockIds.has(item.content_block_id)) {
      issues.push(`release ${seed.libraryRelease.release_version}: release item references missing content block "${item.content_block_id}"`);
    }
  });

  seed.compounds.forEach((compound) => {
    if (compound.review_status !== 'reviewed') {
      issues.push(`${compound.slug}: release exports can only include reviewed compounds`);
    }
  });

  seed.contentBlocks.forEach((block) => {
    if (block.review_status !== 'reviewed') {
      issues.push(`${block.compound_slug}: content block "${block.id}" is not reviewed`);
    }
    block.citation_ids.forEach((citationId) => {
      if (!seed.citations.some((citation) => citation.id === citationId)) {
        issues.push(`${block.compound_slug}: content block "${block.id}" references missing citation "${citationId}"`);
      }
    });
  });

  return issues;
}

function buildReferenceProfileFromContentBlocks(blocks: ReferenceContentBlockRow[]): CompoundReferenceProfile | undefined {
  if (blocks.length === 0) return undefined;

  const fieldBrief = getBlockContent<CompoundBiohackerBrief>(blocks, 'field_brief');
  const evidenceSnapshot = getBlockContent<{
    evidenceTier: CompoundReferenceProfile['evidenceTier'];
    reviewSummary: string;
    mechanismTargets: string[];
    clinicalEvidence: ReferenceClinicalEvidence[];
    evidenceGaps: string[];
  }>(blocks, 'evidence_snapshot');
  const safetyWatch = getBlockContent<{
    safetySignals: string[];
    practicalNotes: string[];
    peptideOSActions: string[];
  }>(blocks, 'safety_watch');
  const regulatoryStatus = getBlockContent<ReferenceRegulatoryStatus>(blocks, 'regulatory_status');

  if (!fieldBrief || !evidenceSnapshot || !safetyWatch || !regulatoryStatus) return undefined;

  return {
    evidenceTier: evidenceSnapshot.evidenceTier,
    biohackerBrief: fieldBrief,
    reviewSummary: evidenceSnapshot.reviewSummary,
    mechanismTargets: evidenceSnapshot.mechanismTargets,
    clinicalEvidence: evidenceSnapshot.clinicalEvidence,
    safetySignals: safetyWatch.safetySignals,
    practicalNotes: safetyWatch.practicalNotes,
    evidenceGaps: evidenceSnapshot.evidenceGaps,
    regulatoryStatus,
    peptideOSActions: safetyWatch.peptideOSActions,
  };
}

function buildActionableProfileFromContentBlocks(blocks: ReferenceContentBlockRow[]): CompoundActionableProfile | undefined {
  return getBlockContent<CompoundActionableProfile>(blocks, 'actionable_profile');
}

function getBlockContent<T>(blocks: ReferenceContentBlockRow[], blockType: ReferenceContentBlockRow['block_type']): T | undefined {
  return blocks.find((block) => block.block_type === blockType)?.content as T | undefined;
}
