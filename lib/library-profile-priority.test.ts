import { describe, expect, it } from 'vitest';
import { getCompoundProfilePriority, getProfileUpgradeQueue } from './library-profile-priority';
import { referenceCompounds } from './reference-compounds';
import type { Compound } from './types';

describe('library profile priority', () => {
  it('keeps profiled compounds out of the upgrade queue and prioritizes high-value entries', () => {
    const queue = getProfileUpgradeQueue(referenceCompounds);
    const queueIds = queue.map((item) => item.compound.id);

    expect(queueIds).not.toEqual(expect.arrayContaining([
      'retatrutide',
      'tirzepatide',
      'semaglutide',
      'bpc-157',
      'tb-500',
      'mots-c',
    ]));
    expect(queueIds).toEqual([]);
  });

  it('marks hormone entries as profiled once pro-grade content is present', () => {
    expect(getCompoundProfilePriority(referenceCompounds.find((compound) => compound.id === 'hgh-somatropin')!)).toMatchObject({
      band: 'profiled',
      label: 'Pro profile live',
      reasons: ['Full reference profile available'],
    });
  });

  it('keeps user-created and deleted compounds out of the pro-data queue', () => {
    const custom = {
      ...referenceCompounds[0],
      id: 'custom-focus-blend',
      name: 'Custom Focus Blend',
      referenceProfile: undefined,
      source: 'user',
      curationStatus: 'draft',
    } as const;
    const deletedReference = {
      ...referenceCompounds[1],
      referenceProfile: undefined,
      deletedAt: '2026-06-18T00:00:00.000Z',
    } as const;

    expect(getProfileUpgradeQueue([custom, deletedReference])).toEqual([]);
  });

  it('scores unprofiled high-value protocol compounds as priority upgrades', () => {
    const priority = getCompoundProfilePriority(makeUnprofiledCompound({
      id: 'bpc-157',
      compoundType: 'peptide',
      concentrationMode: 'reconstituted',
      dosePresets: [{ label: 'Label unit', value: 1, unit: 'mg', intent: 'labelUnit', sourceNote: 'label', citationIds: ['source-a'] }],
      citations: [{ id: 'source-a', title: 'Source A', url: 'https://example.com/a', source: 'Example', year: 2026 }],
    }));

    expect(priority).toEqual({
      band: 'priority',
      label: 'Pro data priority',
      score: 95,
      reasons: [
        'High user value',
        'Protocol and inventory impact',
        'Source-backed upgrade path',
        'Preset data ready',
      ],
    });
  });

  it('scores unprofiled sourced protocol compounds as standard upgrades', () => {
    const priority = getCompoundProfilePriority(makeUnprofiledCompound({
      id: 'standard-peptide',
      compoundType: 'peptide',
      concentrationMode: 'none',
      citations: [{ id: 'source-a', title: 'Source A', url: 'https://example.com/a', source: 'Example', year: 2026 }],
    }));

    expect(priority).toMatchObject({
      band: 'standard',
      label: 'Standard upgrade',
      score: 45,
      reasons: ['Protocol and inventory impact', 'Source-backed upgrade path'],
    });
  });

  it('scores unprofiled low-evidence compounds as watchlist entries', () => {
    const priority = getCompoundProfilePriority(makeUnprofiledCompound({
      id: 'low-evidence-supplement',
      compoundType: 'supplement',
      concentrationMode: 'none',
      citations: [],
    }));

    expect(priority).toEqual({
      band: 'watchlist',
      label: 'Watchlist',
      score: -5,
      reasons: ['Needs source review'],
    });
  });

  it('sorts unprofiled upgrade queue by score, preferred order, then name', () => {
    const semaglutide = makeUnprofiledCompound({ id: 'semaglutide', name: 'Semaglutide' });
    const bpc157 = makeUnprofiledCompound({ id: 'bpc-157', name: 'BPC-157' });
    const alpha = makeUnprofiledCompound({ id: 'alpha-custom', name: 'Alpha Custom' });
    const zeta = makeUnprofiledCompound({ id: 'zeta-custom', name: 'Zeta Custom' });

    expect(getProfileUpgradeQueue([zeta, alpha, bpc157, semaglutide]).map((item) => item.compound.id)).toEqual([
      'semaglutide',
      'bpc-157',
      'alpha-custom',
      'zeta-custom',
    ]);
  });
});

function makeUnprofiledCompound(overrides: Partial<Compound>): Compound {
  return {
    ...referenceCompounds[0],
    id: 'unprofiled-compound',
    name: 'Unprofiled Compound',
    aliases: [],
    compoundType: 'peptide',
    concentrationMode: 'none',
    dosePresets: [],
    vialPresets: [],
    citations: [{ id: 'source-default', title: 'Source', url: 'https://example.com/source', source: 'Example', year: 2026 }],
    referenceProfile: undefined,
    source: 'bundled',
    curationStatus: 'reviewed',
    deletedAt: null,
    ...overrides,
  };
}
