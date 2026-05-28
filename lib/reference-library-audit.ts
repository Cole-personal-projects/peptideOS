import type { ReferenceCompound } from './reference-compounds';

const copiedProseMarkers = [
  'copied from',
  'all rights reserved',
  'retrieved from pubchem',
  'this record was downloaded',
];

export function collectReferenceLibraryAuditIssues(compounds: readonly ReferenceCompound[]): string[] {
  const issues: string[] = [];

  compounds.forEach((compound) => {
    const citationIds = new Set(compound.citations.map((citation) => citation.id));

    if (compound.citations.length === 0) {
      issues.push(`${compound.id}: at least one citation is required`);
    }

    compound.dosePresets.forEach((preset) => {
      if (!preset.sourceNote.trim()) {
        issues.push(`${compound.id}: dose preset "${preset.label}" requires a source note`);
      }

      preset.citationIds.forEach((citationId) => {
        if (!citationIds.has(citationId)) {
          issues.push(`${compound.id}: dose preset "${preset.label}" references missing citation "${citationId}"`);
        }
      });
    });

    compound.vialPresets.forEach((preset) => {
      if (!preset.sourceNote.trim()) {
        issues.push(`${compound.id}: vial preset "${preset.label}" requires a source note`);
      }

      preset.citationIds.forEach((citationId) => {
        if (!citationIds.has(citationId)) {
          issues.push(`${compound.id}: vial preset "${preset.label}" references missing citation "${citationId}"`);
        }
      });
    });

    const copy = [
      compound.beginnerSummary,
      compound.researcherDetails,
      compound.mechanism,
      compound.safety,
      compound.storage,
    ].join(' ').toLowerCase();

    copiedProseMarkers.forEach((marker) => {
      if (copy.includes(marker)) {
        issues.push(`${compound.id}: copy contains third-party database boilerplate marker "${marker}"`);
      }
    });
  });

  return issues;
}
