import { describe, expect, it } from 'vitest';
import { buildEstimatedRemainingPreview } from './estimated-remaining-preview';
import type { Compound, Dose, Schedule, ScheduleLog, Stack } from './types';

const semaglutide: Compound = {
  id: 'semaglutide',
  name: 'Semaglutide',
  aliases: [],
  compoundType: 'glp-1',
  category: 'metabolic',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [],
  pharmacokinetics: {
    halfLifeHours: 168,
    halfLifeSource: 'DailyMed semaglutide labeling describes an elimination half-life of approximately 1 week.',
    citationIds: ['dailymed-semaglutide'],
    evidenceTier: 'approved-label',
    modelNotes: 'First-order estimated remaining amount only; does not represent measured concentration, clinical response, or dose guidance.',
  },
  beginnerSummary: '',
  researcherDetails: '',
  safety: '',
  storage: '',
  citations: [],
  source: 'bundled',
  curationStatus: 'reviewed',
};

const customCompound: Compound = {
  ...semaglutide,
  id: 'custom-compound',
  name: 'Custom compound',
  pharmacokinetics: undefined,
};

const stack: Stack = {
  id: 'stack-1',
  name: 'Metabolic stack',
  description: '',
  peptides: [
    { id: 'item-1', peptideId: 'semaglutide', doseValue: 1, doseUnit: 'mg', frequency: 'weekly', route: 'subq', timing: 'morning' },
    { id: 'item-2', peptideId: 'custom-compound', doseValue: 1, doseUnit: 'mg', frequency: 'weekly', route: 'subq', timing: 'morning' },
  ],
  startDate: '2026-06-01',
  durationDays: 30,
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
  startDate: '2026-06-01',
  endDate: '2026-07-01',
  status: 'active',
};

function scheduleLog(id: string, status: ScheduleLog['status'], dueAt: string, stackId = 'stack-1'): ScheduleLog {
  return {
    id,
    scheduleId: 'schedule-1',
    stackId,
    stackPeptideId: 'item-1',
    peptideId: 'semaglutide',
    dueAt,
    status,
  };
}

function dose(id: string, dateTime: string, scheduleLogId: string, completed = true): Dose {
  return {
    id,
    peptideId: 'semaglutide',
    vialId: 'vial-1',
    scheduleLogId,
    dateTime,
    doseValue: 1,
    doseUnit: 'mg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed,
  };
}

describe('estimated remaining preview', () => {
  it('builds stack rows only for compounds with pharmacokinetic metadata', () => {
    const rows = buildEstimatedRemainingPreview(stack, {
      compounds: [semaglutide, customCompound],
      doses: [],
      schedules: [schedule],
      scheduleLogs: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      compoundId: 'semaglutide',
      compoundName: 'Semaglutide',
      halfLifeHours: 168,
      citationIds: ['dailymed-semaglutide'],
    });
  });

  it('uses completed stack doses for actual estimate and pending stack logs for planned estimate', () => {
    const sampledAt = '2026-06-08T08:00:00.000Z';
    const rows = buildEstimatedRemainingPreview(stack, {
      compounds: [semaglutide],
      doses: [
        dose('dose-taken', '2026-06-01T08:00:00.000Z', 'log-taken'),
        dose('dose-other-stack', '2026-06-01T08:00:00.000Z', 'log-other-stack'),
        dose('dose-incomplete', '2026-06-01T08:00:00.000Z', 'log-taken', false),
      ],
      schedules: [schedule],
      scheduleLogs: [
        scheduleLog('log-taken', 'taken', '2026-06-01T08:00:00.000Z'),
        scheduleLog('log-pending', 'pending', '2026-06-08T08:00:00.000Z'),
        scheduleLog('log-skipped', 'skipped', '2026-06-08T20:00:00.000Z'),
        scheduleLog('log-missed', 'missed', '2026-06-09T08:00:00.000Z'),
        scheduleLog('log-other-stack', 'taken', '2026-06-01T08:00:00.000Z', 'stack-2'),
      ],
    }, sampledAt);

    expect(rows).toHaveLength(1);
    expect(rows[0].actualEventCount).toBe(1);
    expect(rows[0].plannedEventCount).toBe(1);
    expect(rows[0].actualEstimatedRemainingMg).toBeCloseTo(0.5);
    expect(rows[0].plannedEstimatedRemainingMg).toBeCloseTo(1);
    expect(rows[0].latestActualEvent?.id).toBe('dose-taken');
  });

  it('keeps user-facing model notes in estimated remaining amount language', () => {
    const rows = buildEstimatedRemainingPreview(stack, {
      compounds: [semaglutide],
      doses: [],
      schedules: [],
      scheduleLogs: [],
    });

    expect(rows[0].modelNotes).toContain('estimated remaining amount');
    expect(rows[0].modelNotes).not.toMatch(/blood level|optimal|safe stack/i);
  });
});
