import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { buildReferenceLibraryStatus, formatReferenceLibraryStatus } from './reference-library-status';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';
import type { ReleasedReferenceLibrary } from './reference-library-source';

describe('reference library status', () => {
  test('records a successful Supabase release for app diagnostics', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const library: ReleasedReferenceLibrary = {
      source: 'supabase',
      snapshot: {
        ...snapshot,
        libraryVersion: '2026.06.0',
      },
    };

    expect(buildReferenceLibraryStatus(library, '2026-06-17T17:30:00.000Z')).toEqual({
      source: 'supabase',
      version: '2026.06.0',
      loadedAt: '2026-06-17T17:30:00.000Z',
      fallbackReason: undefined,
    });
  });

  test('records bundled fallback reason when DB release cannot be used', () => {
    const snapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const library: ReleasedReferenceLibrary = {
      source: 'bundled-fallback',
      snapshot,
      fallbackReason: 'Reference library release failed validation.',
    };

    expect(buildReferenceLibraryStatus(library, '2026-06-17T17:31:00.000Z')).toEqual({
      source: 'bundled-fallback',
      version: snapshot.libraryVersion,
      loadedAt: '2026-06-17T17:31:00.000Z',
      fallbackReason: 'Reference library release failed validation.',
    });
  });

  test('formats compact labels for settings diagnostics', () => {
    expect(formatReferenceLibraryStatus({
      source: 'supabase',
      version: '2026.06.0',
      loadedAt: '2026-06-17T17:30:00.000Z',
    })).toEqual({
      label: 'Supabase release 2026.06.0',
      detail: 'Loaded Jun 17, 2026, 5:30 PM UTC',
    });

    expect(formatReferenceLibraryStatus({
      source: 'bundled-fallback',
      version: '2026.05.0',
      loadedAt: '2026-06-17T17:31:00.000Z',
      fallbackReason: 'Reference library release failed validation.',
    })).toEqual({
      label: 'Bundled fallback 2026.05.0',
      detail: 'Reference library release failed validation.',
    });
  });
});
