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
    expect(queueIds.slice(0, 5)).toEqual([
      'hgh-somatropin',
      'tesamorelin',
      'sermorelin',
      'ipamorelin',
      'thymosin-alpha-1',
    ]);
  });

  it('explains why a compound is next in the pro-data queue', () => {
    expect(getCompoundProfilePriority(referenceCompounds.find((compound) => compound.id === 'hgh-somatropin')!)).toMatchObject({
      band: 'priority',
      label: 'Pro data priority',
      reasons: expect.arrayContaining([
        'High user value',
        'Protocol and inventory impact',
        'Source-backed upgrade path',
      ]),
    });
  });
});
