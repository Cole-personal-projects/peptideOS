import type { ReleasedReferenceLibrary } from './reference-library-source';

export interface ReferenceLibraryStatus {
  source: ReleasedReferenceLibrary['source'];
  version: string;
  loadedAt: string;
  fallbackReason?: string;
}

export function buildReferenceLibraryStatus(
  library: ReleasedReferenceLibrary,
  loadedAt: string,
): ReferenceLibraryStatus {
  return {
    source: library.source,
    version: library.snapshot.libraryVersion,
    loadedAt,
    fallbackReason: library.fallbackReason,
  };
}

export function formatReferenceLibraryStatus(status: ReferenceLibraryStatus): { label: string; detail: string } {
  const label = status.source === 'supabase'
    ? `Supabase release ${status.version}`
    : `Bundled fallback ${status.version}`;

  return {
    label,
    detail: status.fallbackReason ?? `Loaded ${formatUtcTimestamp(status.loadedAt)}`,
  };
}

function formatUtcTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}
