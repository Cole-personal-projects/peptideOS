import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import {
  createUserCompound,
  getPersistableUserCompounds,
  mergeCompoundLibrary,
  softDeleteUserCompound,
  updateUserCompound,
  type UserCompoundDraft,
} from './user-compounds';

const draft: UserCompoundDraft = {
  id: 'custom-gh-secretagogue',
  name: 'Custom GH Secretagogue',
  aliases: ['CGHS'],
  compoundType: 'peptide',
  category: 'growth-hormone',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [],
  reconstitutionDefaults: {
    typicalVialAmounts: [{ value: 5, unit: 'mg' }],
    typicalBacWaterMl: [2],
  },
  beginnerSummary: 'User-entered summary.',
  researcherDetails: 'User-entered details.',
  safety: 'User-entered safety notes.',
  storage: 'User-entered storage notes.',
  citations: [],
};

describe('user compounds', () => {
  test('creates custom compounds as local dirty user records', () => {
    const compound = createUserCompound(draft, new Date('2026-05-24T00:00:00.000Z'));

    expect(compound).toEqual(expect.objectContaining({
      id: 'custom-gh-secretagogue',
      source: 'user',
      curationStatus: 'draft',
      createdAt: '2026-05-24T00:00:00.000Z',
      updatedAt: '2026-05-24T00:00:00.000Z',
      deletedAt: null,
      syncState: 'dirty',
    }));
  });

  test('updates and soft-deletes only user-owned compounds', () => {
    const compound = createUserCompound(draft, new Date('2026-05-24T00:00:00.000Z'));
    const updated = updateUserCompound(compound, { name: 'Renamed custom compound' }, new Date('2026-05-24T01:00:00.000Z'));
    const deleted = softDeleteUserCompound(updated, new Date('2026-05-24T02:00:00.000Z'));
    const bundled = referenceCompounds[0];

    expect(updated).toEqual(expect.objectContaining({
      name: 'Renamed custom compound',
      updatedAt: '2026-05-24T01:00:00.000Z',
      syncState: 'dirty',
    }));
    expect(deleted).toEqual(expect.objectContaining({
      deletedAt: '2026-05-24T02:00:00.000Z',
      updatedAt: '2026-05-24T02:00:00.000Z',
      syncState: 'dirty',
    }));
    expect(updateUserCompound(bundled, { name: 'Blocked edit' })).toBe(bundled);
    expect(softDeleteUserCompound(bundled)).toBe(bundled);
  });

  test('merges bundled compounds with visible user compounds while protecting bundled ids', () => {
    const custom = createUserCompound(draft, new Date('2026-05-24T00:00:00.000Z'));
    const deleted = softDeleteUserCompound(
      createUserCompound({ ...draft, id: 'deleted-compound', name: 'Deleted Compound' }),
      new Date('2026-05-24T01:00:00.000Z'),
    );
    const bundledCollision = createUserCompound({
      ...draft,
      id: referenceCompounds[0].id,
      name: 'Collision',
    });

    const merged = mergeCompoundLibrary([custom, deleted, bundledCollision]);

    expect(merged[0]).toBe(referenceCompounds[0]);
    expect(merged.map((compound) => compound.id)).toContain('custom-gh-secretagogue');
    expect(merged.map((compound) => compound.id)).not.toContain('deleted-compound');
    expect(merged.filter((compound) => compound.id === referenceCompounds[0].id)).toHaveLength(1);
    expect(getPersistableUserCompounds(merged)).toEqual([custom]);
  });

  test('merges visible user compounds onto a supplied released reference library', () => {
    const releasedReference = {
      ...referenceCompounds[0],
      beginnerSummary: 'Loaded from released Supabase library.',
    };
    const custom = createUserCompound(draft, new Date('2026-05-24T00:00:00.000Z'));

    const merged = mergeCompoundLibrary([custom], [releasedReference]);

    expect(merged).toHaveLength(2);
    expect(merged[0].beginnerSummary).toBe('Loaded from released Supabase library.');
    expect(merged[1]).toBe(custom);
  });
});
