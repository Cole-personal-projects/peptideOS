import type { Citation } from './types';
import type { ReferenceCompound } from './reference-compounds';
import { validateReferenceCompound } from './reference-compounds';

export interface ReferenceSnapshotSource {
  kind: 'bundled' | 'supabase-export';
  registry: 'peptideos-reference-registry';
  exportedFrom?: string;
}

export interface ReferenceSnapshotValidationPolicy {
  policyVersion: number;
  reviewedOnly: boolean;
}

export interface ReferenceLibrarySnapshot {
  libraryVersion: string;
  schemaVersion: number;
  exportedAt: string;
  source: ReferenceSnapshotSource;
  validation: ReferenceSnapshotValidationPolicy;
  compounds: ReferenceCompound[];
  citations: Citation[];
}

export function buildBundledReferenceSnapshot(compounds: readonly ReferenceCompound[]): ReferenceLibrarySnapshot {
  return {
    libraryVersion: '2026.05.0',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    source: {
      kind: 'bundled',
      registry: 'peptideos-reference-registry',
    },
    validation: {
      policyVersion: 1,
      reviewedOnly: true,
    },
    compounds: [...compounds],
    citations: collectUniqueCitations(compounds),
  };
}

export function validateReferenceSnapshot(snapshot: ReferenceLibrarySnapshot): string[] {
  const issues: string[] = [];

  if (!/^\d{4}\.\d{2}\.\d+$/.test(snapshot.libraryVersion)) {
    issues.push('snapshot: libraryVersion must use YYYY.MM.patch format');
  }
  if (snapshot.schemaVersion !== 1) {
    issues.push('snapshot: unsupported schemaVersion');
  }
  if (snapshot.source.registry !== 'peptideos-reference-registry') {
    issues.push('snapshot: invalid reference registry');
  }
  if (snapshot.source.kind === 'supabase-export' && !snapshot.source.exportedFrom?.trim()) {
    issues.push('snapshot: Supabase exports must identify exportedFrom');
  }
  if (snapshot.validation.reviewedOnly !== true) {
    issues.push('snapshot: reviewedOnly validation policy is required');
  }
  if (Number.isNaN(Date.parse(snapshot.exportedAt))) {
    issues.push('snapshot: exportedAt must be an ISO timestamp');
  }

  const compoundIds = snapshot.compounds.map((compound) => compound.id);
  findDuplicates(compoundIds).forEach((id) => {
    issues.push(`snapshot: duplicate compound id "${id}"`);
  });

  const searchableNames = snapshot.compounds.flatMap((compound) => [
    compound.name.toLowerCase(),
    ...compound.aliases.map((alias) => alias.toLowerCase()),
  ]);
  findDuplicates(searchableNames).forEach((name) => {
    issues.push(`snapshot: duplicate compound name or alias "${name}"`);
  });

  snapshot.compounds.forEach((compound) => {
    issues.push(...validateReferenceCompound(compound));
    if (compound.curationStatus !== 'reviewed') {
      issues.push(`${compound.id}: snapshot can only include reviewed compounds`);
    }
  });

  const citationIds = new Set(snapshot.citations.map((citation) => citation.id));
  snapshot.compounds.forEach((compound) => {
    compound.citations.forEach((citation) => {
      if (!citationIds.has(citation.id)) {
        issues.push(`${compound.id}: citation "${citation.id}" is missing from snapshot citation index`);
      }
    });
    compound.dosePresets.forEach((preset) => {
      preset.citationIds.forEach((citationId) => {
        if (!citationIds.has(citationId)) {
          issues.push(`${compound.id}: dose preset "${preset.label}" references missing snapshot citation "${citationId}"`);
        }
      });
    });
    compound.vialPresets.forEach((preset) => {
      preset.citationIds.forEach((citationId) => {
        if (!citationIds.has(citationId)) {
          issues.push(`${compound.id}: vial preset "${preset.label}" references missing snapshot citation "${citationId}"`);
        }
      });
    });
  });

  return issues;
}

function collectUniqueCitations(compounds: readonly ReferenceCompound[]): Citation[] {
  const citationsById = new Map<string, Citation>();

  compounds.forEach((compound) => {
    compound.citations.forEach((citation) => {
      citationsById.set(citation.id, citation);
    });
  });

  return [...citationsById.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return [...duplicates];
}
