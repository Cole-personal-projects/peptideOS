import { describe, expect, it } from 'vitest';
import { buildProtocolPkView } from './protocol-pk-view';
import { initialAppData } from './mock-data';
import type { AppData, Compound, Dose, Schedule, ScheduleLog, Stack } from './types';

const semaglutide = {
  id: 'semaglutide',
  name: 'Semaglutide',
  pharmacokinetics: {
    halfLifeHours: 168,
    halfLifeSource: 'DailyMed semaglutide labeling describes elimination half-life approximately 1 week.',
    citationIds: ['dailymed-semaglutide'],
    evidenceTier: 'approved-label',
    modelNotes: 'First-order estimated remaining amount only.',
  },
} as Compound;

const noPk = { id: 'bpc-157', name: 'BPC-157' } as Compound;

const stack: Stack = {
  id: 'stack-1',
  name: 'GLP protocol',
  description: '',
  peptides: [{
    id: 'item-1',
    peptideId: 'semaglutide',
    doseValue: 1,
    doseUnit: 'mg',
    frequency: 'weekly',
    route: 'subq',
    timing: 'Morning',
  }],
  startDate: '2026-06-01T00:00:00.000Z',
  durationDays: 84,
  status: 'active',
  notes: '',
};

const schedule: Schedule = {
  id: 'schedule-1',
  stackId: 'stack-1',
  stackPeptideId: 'item-1',
  peptideId: 'semaglutide',
  doseValue: 1,
  doseUnit: 'mg',
  route: 'subq',
  recurrence: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: '2026-08-24T00:00:00.000Z',
  status: 'active',
};

function data(overrides: Partial<AppData>): AppData {
  return { ...initialAppData, ...overrides };
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

function log(id: string, status: ScheduleLog['status'], dueAt: string, doseId?: string): ScheduleLog {
  return {
    id,
    scheduleId: 'schedule-1',
    stackId: 'stack-1',
    stackPeptideId: 'item-1',
    peptideId: 'semaglutide',
    dueAt,
    status,
    doseId,
  };
}

describe('protocol PK view', () => {
  it('can use bundled source-backed PK metadata', () => {
    const bundled = initialAppData.compounds.find((compound) => compound.id === 'semaglutide');

    expect(bundled?.pharmacokinetics).toMatchObject({
      halfLifeHours: 168,
      evidenceTier: 'approved-label',
    });
  });

  it('builds actual and projected estimated remaining amount curves', () => {
    const view = buildProtocolPkView(
      data({
        compounds: [semaglutide],
        stacks: [stack],
        schedules: [schedule],
        scheduleLogs: [
          log('log-1', 'taken', '2026-06-22T08:00:00.000Z', 'dose-1'),
          log('log-2', 'pending', '2026-06-29T08:00:00.000Z'),
          log('log-3', 'skipped', '2026-06-15T08:00:00.000Z'),
        ],
        doses: [
          dose('dose-1', '2026-06-22T08:00:00.000Z'),
          { ...dose('dose-other', '2026-06-25T08:00:00.000Z'), scheduleLogId: 'other-stack-log' },
        ],
      }),
      stack,
      new Date('2026-06-26T08:00:00.000Z'),
    );

    expect(view.compounds).toHaveLength(1);
    expect(view.compounds[0].actualEvents).toHaveLength(1);
    expect(view.compounds[0].plannedEvents).toHaveLength(1);
    expect(view.compounds[0].currentEstimatedMg).toBeGreaterThan(0);
    expect(view.compounds[0].peakProjectedMg).toBeGreaterThanOrEqual(view.compounds[0].currentEstimatedMg);
    expect(view.compounds[0].nextEventAt).toBe('2026-06-29T08:00:00.000Z');
  });

  it('keeps unsupported compounds out of modeled curves', () => {
    const unsupportedStack = { ...stack, peptides: [{ ...stack.peptides[0], peptideId: 'bpc-157' }] };
    const view = buildProtocolPkView(data({ compounds: [noPk], stacks: [unsupportedStack] }), unsupportedStack, new Date('2026-06-26T08:00:00.000Z'));

    expect(view.compounds).toHaveLength(0);
    expect(view.unsupportedCompounds).toEqual([noPk]);
  });
});
