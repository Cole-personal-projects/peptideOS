import { describe, expect, test } from 'vitest';
import {
  activateStackSchedules,
  applySchedulePreset,
  generateScheduleLogs,
  getSchedulePreset,
  getScheduleSummary,
  normalizeStack,
  normalizeStacks,
  updateStackPeptideSchedule,
} from './schedules';
import type { Schedule, ScheduleLog, Stack } from './types';

const legacyStack = {
  id: 'stack-legacy',
  name: 'Legacy stack',
  description: '',
  peptides: [
    {
      peptideId: 'bpc-157',
      doseValue: 250,
      doseUnit: 'mcg',
      frequency: '2x daily',
      route: 'subq',
      timing: 'Morning and evening',
    },
    {
      peptideId: 'tb-500',
      doseValue: 2.5,
      doseUnit: 'mg',
      frequency: '2x weekly',
      route: 'subq',
      timing: 'Monday and Thursday',
    },
  ],
  startDate: '2026-05-23T00:00:00.000Z',
  durationDays: 42,
  status: 'planned',
  notes: '',
} as Stack;

describe('schedule normalization', () => {
  test('adds stable item ids and structured schedule defaults to legacy stack peptides', () => {
    const normalized = normalizeStack(legacyStack);

    expect(normalized.peptides).toEqual([
      expect.objectContaining({
        id: 'stack-legacy-item-bpc-157-0',
        peptideId: 'bpc-157',
        schedule: {
          frequency: 'daily',
          timesOfDay: ['08:00', '20:00'],
        },
      }),
      expect.objectContaining({
        id: 'stack-legacy-item-tb-500-1',
        peptideId: 'tb-500',
        schedule: {
          frequency: 'weekly',
          timesOfDay: ['08:00'],
          weekdays: [1, 4],
        },
      }),
    ]);
  });

  test('preserves existing item ids and schedule metadata', () => {
    const normalized = normalizeStack({
      ...legacyStack,
      peptides: [
        {
          ...legacyStack.peptides[0],
          id: 'existing-item',
          schedule: {
            frequency: 'weekly',
            timesOfDay: ['10:30'],
            weekdays: [2],
          },
        },
      ],
    });

    expect(normalized.peptides[0]).toEqual(expect.objectContaining({
      id: 'existing-item',
      schedule: {
        frequency: 'weekly',
        timesOfDay: ['10:30'],
        weekdays: [2],
      },
    }));
  });

  test('normalizes a list of stacks without changing stack order', () => {
    expect(normalizeStacks([legacyStack]).map((stack) => stack.id)).toEqual(['stack-legacy']);
  });
});

describe('schedule generation', () => {
  test('generates 2x daily logs within the stack duration', () => {
    const stack = normalizeStack({
      ...legacyStack,
      startDate: '2026-05-23T00:00:00.000Z',
      durationDays: 2,
      peptides: [legacyStack.peptides[0]],
    });
    const schedule: Schedule = {
      id: 'schedule-daily',
      stackId: stack.id,
      stackPeptideId: stack.peptides[0].id!,
      peptideId: 'bpc-157',
      doseValue: 250,
      doseUnit: 'mcg',
      route: 'subq',
      recurrence: { frequency: 'daily', timesOfDay: ['08:00', '20:00'] },
      startDate: stack.startDate,
      endDate: '2026-05-24T23:59:59.999Z',
      status: 'active',
    };

    expect(generateScheduleLogs(schedule).map((log) => log.dueAt)).toEqual([
      '2026-05-23T08:00:00.000Z',
      '2026-05-23T20:00:00.000Z',
      '2026-05-24T08:00:00.000Z',
      '2026-05-24T20:00:00.000Z',
    ]);
  });

  test('generates weekly logs only on selected weekdays', () => {
    const schedule: Schedule = {
      id: 'schedule-weekly',
      stackId: 'stack-legacy',
      stackPeptideId: 'stack-legacy-item-tb-500-1',
      peptideId: 'tb-500',
      doseValue: 2.5,
      doseUnit: 'mg',
      route: 'subq',
      recurrence: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1, 4] },
      startDate: '2026-05-23T00:00:00.000Z',
      endDate: '2026-06-05T23:59:59.999Z',
      status: 'active',
    };

    expect(generateScheduleLogs(schedule).map((log) => log.dueAt)).toEqual([
      '2026-05-25T08:00:00.000Z',
      '2026-05-28T08:00:00.000Z',
      '2026-06-01T08:00:00.000Z',
      '2026-06-04T08:00:00.000Z',
    ]);
  });

  test('activates a stack idempotently without duplicating schedules or logs', () => {
    const stack = normalizeStack({
      ...legacyStack,
      startDate: '2026-05-23T00:00:00.000Z',
      durationDays: 2,
      status: 'planned',
    });
    const first = activateStackSchedules({ stack, existingSchedules: [], existingScheduleLogs: [] });
    const second = activateStackSchedules({
      stack: { ...stack, status: 'active' },
      existingSchedules: first.schedules,
      existingScheduleLogs: first.scheduleLogs,
    });

    expect(first.stack.status).toBe('active');
    expect(first.schedules).toHaveLength(2);
    expect(first.scheduleLogs.length).toBeGreaterThan(0);
    expect(second.schedules).toHaveLength(first.schedules.length);
    expect(second.scheduleLogs).toHaveLength(first.scheduleLogs.length);
  });
});

describe('schedule presets', () => {
  test('maps schedule presets into recurrence metadata and display copy', () => {
    const daily = applySchedulePreset(legacyStack.peptides[0], 'daily');
    const twiceDaily = applySchedulePreset(legacyStack.peptides[0], 'twice-daily');
    const weekly = applySchedulePreset(legacyStack.peptides[0], 'weekly');
    const twiceWeekly = applySchedulePreset(legacyStack.peptides[0], 'twice-weekly');

    expect(getSchedulePreset(daily)).toBe('daily');
    expect(getSchedulePreset(twiceDaily)).toBe('twice-daily');
    expect(getSchedulePreset(weekly)).toBe('weekly');
    expect(getSchedulePreset(twiceWeekly)).toBe('twice-weekly');
    expect(getScheduleSummary(twiceWeekly.schedule!)).toBe('2x weekly · Monday, Thursday · 8:00 AM');
  });

  test('falls back to daily morning when persisted recurrence has no time slots', () => {
    const updated = applySchedulePreset({
      ...legacyStack.peptides[0],
      schedule: { frequency: 'daily', timesOfDay: [] },
    }, 'daily');

    expect(updated.schedule).toEqual({ frequency: 'daily', timesOfDay: ['08:00'] });
  });
});

describe('schedule editing', () => {
  test('updates an active stack item schedule and preserves completed logs', () => {
    const stack = normalizeStack({
      ...legacyStack,
      startDate: '2026-05-23T00:00:00.000Z',
      durationDays: 14,
      peptides: [legacyStack.peptides[0]],
      status: 'active',
    });
    const activated = activateStackSchedules({ stack, existingSchedules: [], existingScheduleLogs: [] });
    const firstLog = activated.scheduleLogs[0];
    const preservedTakenLog: ScheduleLog = {
      ...firstLog,
      status: 'taken',
      doseId: 'dose-1',
      takenAt: '2026-05-23T08:10:00.000Z',
    };
    const skippedLog: ScheduleLog = {
      ...activated.scheduleLogs[1],
      status: 'skipped',
      skippedAt: '2026-05-23T20:30:00.000Z',
    };

    const result = updateStackPeptideSchedule({
      stack: activated.stack,
      stackPeptideId: activated.stack.peptides[0].id!,
      preset: 'weekly',
      existingSchedules: activated.schedules,
      existingScheduleLogs: [preservedTakenLog, skippedLog, ...activated.scheduleLogs.slice(2)],
    });

    expect(result.stack.peptides[0]).toEqual(expect.objectContaining({
      frequency: 'weekly',
      timing: 'Monday morning',
      schedule: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
    }));
    expect(result.schedules[0]).toEqual(expect.objectContaining({
      recurrence: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
    }));
    expect(result.scheduleLogs).toContainEqual(preservedTakenLog);
    expect(result.scheduleLogs).toContainEqual(skippedLog);
    expect(result.scheduleLogs.filter((log) => log.status === 'pending').map((log) => log.dueAt)).toEqual([
      '2026-05-25T08:00:00.000Z',
      '2026-06-01T08:00:00.000Z',
    ]);
  });
});
