import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import {
  createSupabaseReferenceLibraryReader,
  getReleasedReferenceLibrary,
  type ReferenceLibraryRegistryReader,
} from './reference-library-source';
import { buildBundledReferenceSnapshot } from './reference-library-snapshot';
import { buildReferenceRegistrySeed, type ReferenceRegistrySeed } from './reference-registry-seed';

describe('released reference library source', () => {
  test('loads the newest published reviewed release from registry rows', async () => {
    const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const oldSeed = withReleaseVersion(
      buildReferenceRegistrySeed(bundledSnapshot),
      '2026.05.0',
      '2026-05-30T00:00:00.000Z',
    );
    const newSeed = withReleaseVersion(
      buildReferenceRegistrySeed(bundledSnapshot),
      '2026.06.0',
      '2026-06-17T00:00:00.000Z',
    );
    const retatrutideFieldBrief = newSeed.contentBlocks.find((block) => (
      block.compound_slug === 'retatrutide' && block.block_type === 'field_brief'
    ));

    if (retatrutideFieldBrief) {
      retatrutideFieldBrief.content = {
        ...retatrutideFieldBrief.content,
        headline: 'DB-backed Retatrutide release keeps the triple-agonist field brief current.',
      };
    }

    const reader: ReferenceLibraryRegistryReader = {
      listLibraryReleases: async () => [oldSeed.libraryRelease, newSeed.libraryRelease],
      getRegistrySeedForRelease: async (releaseVersion) => (
        releaseVersion === newSeed.libraryRelease.release_version ? newSeed : oldSeed
      ),
    };

    const library = await getReleasedReferenceLibrary(reader, {
      fallbackSnapshot: bundledSnapshot,
      exportedFrom: 'test-supabase',
    });
    const retatrutide = library.snapshot.compounds.find((compound) => compound.id === 'retatrutide');

    expect(library.source).toBe('supabase');
    expect(library.snapshot.libraryVersion).toBe('2026.06.0');
    expect(library.snapshot.source).toEqual({
      kind: 'supabase-export',
      registry: 'peptideos-reference-registry',
      exportedFrom: 'test-supabase',
    });
    expect(retatrutide?.referenceProfile?.biohackerBrief.headline).toBe(
      'DB-backed Retatrutide release keeps the triple-agonist field brief current.',
    );
  });

  test('falls back to bundled library when the latest release is malformed', async () => {
    const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const brokenSeed = withReleaseVersion(
      buildReferenceRegistrySeed(bundledSnapshot),
      '2026.06.0',
      '2026-06-17T00:00:00.000Z',
    );
    brokenSeed.releaseItems = [
      ...brokenSeed.releaseItems,
      {
        release_version: brokenSeed.libraryRelease.release_version,
        compound_slug: 'retatrutide',
        content_block_id: 'missing-content-block',
        sort_order: 999,
      },
    ];
    const reader: ReferenceLibraryRegistryReader = {
      listLibraryReleases: async () => [brokenSeed.libraryRelease],
      getRegistrySeedForRelease: async () => brokenSeed,
    };

    const library = await getReleasedReferenceLibrary(reader, {
      fallbackSnapshot: bundledSnapshot,
      exportedFrom: 'test-supabase',
    });

    expect(library.source).toBe('bundled-fallback');
    expect(library.snapshot).toBe(bundledSnapshot);
    expect(library.fallbackReason).toContain('failed validation');
  });

  test('falls back to bundled library when a release includes draft content', async () => {
    const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const draftSeed = withReleaseVersion(
      buildReferenceRegistrySeed(bundledSnapshot),
      '2026.06.0',
      '2026-06-17T00:00:00.000Z',
    );
    draftSeed.contentBlocks = draftSeed.contentBlocks.map((block) => (
      block.compound_slug === 'retatrutide' && block.block_type === 'field_brief'
        ? { ...block, review_status: 'draft' as 'reviewed' }
        : block
    ));
    const reader: ReferenceLibraryRegistryReader = {
      listLibraryReleases: async () => [draftSeed.libraryRelease],
      getRegistrySeedForRelease: async () => draftSeed,
    };

    const library = await getReleasedReferenceLibrary(reader, {
      fallbackSnapshot: bundledSnapshot,
      exportedFrom: 'test-supabase',
    });

    expect(library.source).toBe('bundled-fallback');
    expect(library.snapshot).toBe(bundledSnapshot);
    expect(library.fallbackReason).toContain('failed validation');
  });

  test('maps Supabase registry tables into a released reference library', async () => {
    const bundledSnapshot = buildBundledReferenceSnapshot(referenceCompounds);
    const seed = withReleaseVersion(
      buildReferenceRegistrySeed(bundledSnapshot),
      '2026.06.0',
      '2026-06-17T00:00:00.000Z',
    );
    const retatrutideFieldBrief = seed.contentBlocks.find((block) => (
      block.compound_slug === 'retatrutide' && block.block_type === 'field_brief'
    ));

    if (retatrutideFieldBrief) {
      retatrutideFieldBrief.content = {
        ...retatrutideFieldBrief.content,
        headline: 'Supabase rows drive the Retatrutide triple-agonist field brief.',
      };
    }

    const reader = createSupabaseReferenceLibraryReader(createFakeSupabaseClient(toSupabaseTables(seed)));

    const library = await getReleasedReferenceLibrary(reader, {
      fallbackSnapshot: bundledSnapshot,
      exportedFrom: 'fake-supabase',
    });
    const retatrutide = library.snapshot.compounds.find((compound) => compound.id === 'retatrutide');
    const bpc157 = library.snapshot.compounds.find((compound) => compound.id === 'bpc-157');

    expect(library.source).toBe('supabase');
    expect(library.snapshot.libraryVersion).toBe('2026.06.0');
    expect(retatrutide?.referenceProfile?.biohackerBrief.headline).toBe(
      'Supabase rows drive the Retatrutide triple-agonist field brief.',
    );
    expect(bpc157?.reconstitutionDefaults?.typicalVialAmounts.length).toBeGreaterThan(0);
  });
});

function withReleaseVersion(seed: ReferenceRegistrySeed, releaseVersion: string, publishedAt: string): ReferenceRegistrySeed {
  return {
    ...seed,
    libraryRelease: {
      ...seed.libraryRelease,
      release_version: releaseVersion,
      published_at: publishedAt,
    },
    releaseItems: seed.releaseItems.map((item) => ({
      ...item,
      release_version: releaseVersion,
    })),
  };
}

function toSupabaseTables(seed: ReferenceRegistrySeed) {
  const compoundIdBySlug = new Map(seed.compounds.map((compound) => [compound.slug, `compound-${compound.slug}`]));

  return {
    reference_library_releases: [seed.libraryRelease],
    reference_compounds: seed.compounds.map((compound) => ({
      id: compoundIdBySlug.get(compound.slug),
      ...compound,
    })),
    reference_compound_aliases: seed.aliases.map((alias) => ({
      ...alias,
      compound_id: compoundIdBySlug.get(alias.compound_slug),
    })),
    reference_compound_categories: seed.categories.map((category) => ({
      ...category,
      compound_id: compoundIdBySlug.get(category.compound_slug),
    })),
    reference_compound_forms: seed.forms.map((form) => ({
      ...form,
      compound_id: compoundIdBySlug.get(form.compound_slug),
    })),
    reference_citations: seed.citations,
    reference_compound_citations: seed.compoundCitations.map((citation) => ({
      ...citation,
      compound_id: compoundIdBySlug.get(citation.compound_slug),
    })),
    reference_dose_presets: seed.dosePresets.map((preset) => ({
      ...preset,
      compound_id: compoundIdBySlug.get(preset.compound_slug),
    })),
    reference_vial_presets: seed.vialPresets.map((preset) => ({
      ...preset,
      compound_id: compoundIdBySlug.get(preset.compound_slug),
    })),
    reference_workflow_metadata: seed.workflowMetadata.map((metadata) => ({
      ...metadata,
      compound_id: compoundIdBySlug.get(metadata.compound_slug),
    })),
    reference_content_blocks: seed.contentBlocks.map((block) => ({
      ...block,
      compound_id: compoundIdBySlug.get(block.compound_slug),
    })),
    reference_library_release_items: seed.releaseItems.map((item) => ({
      ...item,
      compound_id: compoundIdBySlug.get(item.compound_slug),
    })),
  };
}

function createFakeSupabaseClient(tables: Record<string, unknown[]>) {
  return {
    from(tableName: string) {
      return {
        select() {
          return new FakeSupabaseQuery((tables[tableName] ?? []) as Array<Record<string, unknown>>);
        },
      };
    },
  };
}

class FakeSupabaseQuery {
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private orderColumn = '';
  private ascending = true;

  constructor(private readonly rows: Array<Record<string, unknown>>) {}

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    const allowed = new Set(values);
    this.filters.push((row) => allowed.has(row[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  then<TResult1 = { data: Record<string, unknown>[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Record<string, unknown>[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const data = this.rows
      .filter((row) => this.filters.every((filter) => filter(row)))
      .sort((a, b) => {
        if (!this.orderColumn) return 0;
        const left = String(a[this.orderColumn] ?? '');
        const right = String(b[this.orderColumn] ?? '');
        return this.ascending ? left.localeCompare(right) : right.localeCompare(left);
      });

    return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
  }
}
