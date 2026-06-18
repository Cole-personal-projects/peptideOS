import { describe, expect, it } from 'vitest';
import { getCompoundProfilePriority, getProfileUpgradeQueue } from './library-profile-priority';
import { referenceCompounds } from './reference-compounds';

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
});
