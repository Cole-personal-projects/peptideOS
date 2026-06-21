import { describe, expect, it } from 'vitest';
import {
  buildPharmacokineticDoseEvents,
  calculateRemainingAmount,
  sampleEstimatedRemainingCurve,
  sumEstimatedRemainingAmount,
} from './pharmacokinetics';
import type { Compound, Dose, Schedule, ScheduleLog } from './types';

const compound = {
  id: 'semaglutide',
  pharmacokinetics: {
    halfLifeHours: 168,
    halfLifeSource: 'Label pharmacokinetic summary',
    citationIds: ['label-1'],
    evidenceTier: 'approved-label',
    modelNotes: 'First-order estimate only.',
  },
} as Pick<Compound, 'id' | 'pharmacokinetics'>;

const schedule: Schedule = {
  id: 'schedule-1',
  stackId: 'stack-1',
  stackPeptideId: 'stack-item-1',
  peptideId: 'semaglutide',
  doseValue: 1,
  doseUnit: 'mg',
  route: 'subq',
  recurrence: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
  startDate: '2026-06-01',
  endDate: '2026-07-01',
  status: 'active',
};

function log(id: string, status: ScheduleLog['status'], dueAt: string): ScheduleLog {
  return {
    id,
    scheduleId: 'schedule-1',
    stackId: 'stack-1',
    stackPeptideId: 'stack-item-1',
    peptideId: 'semaglutide',
    dueAt,
    status,
  };
}

function dose(id: string, dateTime: string, completed = true): Dose {
  return {
    id,
    peptideId: 'semaglutide',
    vialId: 'vial-1',
    dateTime,
    doseValue: 1,
    doseUnit: 'mg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed,
  };
}

describe('pharmacokinetics', () => {
  it('calculates one half-life as half the original amount', () => {
    expect(calculateRemainingAmount(2, 24, 24)).toBeCloseTo(1);
  });

  it('sums repeated dose remnants at a sample time', () => {
    const remaining = sumEstimatedRemainingAmount(
      [
        { id: 'dose-1', occurredAt: '2026-06-01T00:00:00.000Z', amountMg: 1, source: 'actual' },
        { id: 'dose-2', occurredAt: '2026-06-02T00:00:00.000Z', amountMg: 1, source: 'actual' },
      ],
      '2026-06-03T00:00:00.000Z',
      24,
    );

    expect(remaining).toBeCloseTo(0.75);
  });

  it('returns no events when half-life metadata is unknown', () => {
    expect(buildPharmacokineticDoseEvents({
      compound: { id: 'semaglutide' },
      doses: [dose('dose-1', '2026-06-01T08:00:00.000Z')],
      schedules: [schedule],
      scheduleLogs: [log('log-1', 'pending', '2026-06-02T08:00:00.000Z')],
      mode: 'actual',
    })).toEqual([]);
  });

  it('excludes missed and skipped schedule logs from planned events', () => {
    const events = buildPharmacokineticDoseEvents({
      compound,
      doses: [],
      schedules: [schedule],
      scheduleLogs: [
        log('pending-morning', 'pending', '2026-06-02T08:00:00.000Z'),
        log('skipped-evening', 'skipped', '2026-06-02T20:00:00.000Z'),
        log('missed-next', 'missed', '2026-06-03T08:00:00.000Z'),
      ],
      mode: 'planned',
    });

    expect(events.map((event) => event.id)).toEqual(['pending-morning']);
  });

  it('uses completed doses for actual events and leaves planned logs separate', () => {
    const events = buildPharmacokineticDoseEvents({
      compound,
      doses: [
        dose('completed-dose', '2026-06-01T08:00:00.000Z'),
        dose('draft-dose', '2026-06-01T20:00:00.000Z', false),
      ],
      schedules: [schedule],
      scheduleLogs: [log('planned-log', 'pending', '2026-06-02T08:00:00.000Z')],
      mode: 'actual',
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: 'completed-dose', source: 'actual' });
  });

  it('samples an estimated remaining amount curve', () => {
    const points = sampleEstimatedRemainingCurve({
      events: [{ id: 'dose-1', occurredAt: '2026-06-01T00:00:00.000Z', amountMg: 2, source: 'actual' }],
      halfLifeHours: 24,
      startAt: '2026-06-01T00:00:00.000Z',
      endAt: '2026-06-02T00:00:00.000Z',
      intervalHours: 24,
    });

    expect(points).toHaveLength(2);
    expect(points[0].estimatedRemainingMg).toBeCloseTo(2);
    expect(points[1].estimatedRemainingMg).toBeCloseTo(1);
  });
});
