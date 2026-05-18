import { describe, expect, it } from 'vitest';
import { buildDoseTimelineGroups } from './dose-timeline';
import type { Dose } from './types';

function dose(overrides: Partial<Dose>): Dose {
  return {
    id: 'dose-1',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: '2026-05-17T12:00:00.000Z',
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed: true,
    ...overrides,
  };
}

describe('dose timeline grouping', () => {
  it('groups doses by local calendar day and sorts newest first', () => {
    const groups = buildDoseTimelineGroups([
      dose({ id: 'older', dateTime: '2026-05-16T16:00:00.000Z' }),
      dose({ id: 'newer-same-day', dateTime: '2026-05-17T08:00:00.000Z' }),
      dose({ id: 'newest', dateTime: '2026-05-18T08:00:00.000Z' }),
    ]);

    expect(groups.map((group) => group.dateKey)).toEqual([
      new Date('2026-05-18T08:00:00.000Z').toDateString(),
      new Date('2026-05-17T08:00:00.000Z').toDateString(),
      new Date('2026-05-16T16:00:00.000Z').toDateString(),
    ]);
    expect(groups[1].doses.map((entry) => entry.id)).toEqual(['newer-same-day']);
  });

  it('preserves native units and completion state per timeline item', () => {
    const [group] = buildDoseTimelineGroups([
      dose({ id: 'tb', peptideId: 'tb-500', doseValue: 2.5, doseUnit: 'mg', completed: true }),
      dose({ id: 'hgh', peptideId: 'hgh', doseValue: 2, doseUnit: 'iu', completed: false }),
    ]);

    expect(group.doses).toEqual([
      expect.objectContaining({ id: 'tb', doseLabel: '2.5 mg', statusLabel: 'Completed' }),
      expect.objectContaining({ id: 'hgh', doseLabel: '2 IU', statusLabel: 'Planned' }),
    ]);
  });

  it('filters by peptide without aggregating incompatible units', () => {
    const groups = buildDoseTimelineGroups(
      [
        dose({ id: 'bpc', peptideId: 'bpc-157', doseValue: 250, doseUnit: 'mcg' }),
        dose({ id: 'tb', peptideId: 'tb-500', doseValue: 2, doseUnit: 'mg' }),
      ],
      'tb-500',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].doses).toEqual([
      expect.objectContaining({ id: 'tb', doseLabel: '2 mg' }),
    ]);
  });
});
