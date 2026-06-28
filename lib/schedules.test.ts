import { beforeAll, describe, expect, test } from 'vitest';
import {
  activateStackSchedules,
  applySchedulePreset,
  applyScheduleTimes,
  generateScheduleLogs,
  getSchedulePreset,
  getScheduleSummary,
  normalizeStack,
  normalizeStacks,
  updateStackPeptideSchedule,
  updateStackPeptideScheduleTimes,
} from './schedules';
import type { Schedule, ScheduleLog, Stack, StackPeptide } from './types';

beforeAll(() => {
  process.env.TZ = 'UTC';
});

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

  test('activates phased stack items inside their own schedule windows', () => {
    const stack = normalizeStack({
      ...legacyStack,
      id: 'stack-phased',
      startDate: '2026-05-04T00:00:00.000Z',
      durationDays: 28,
      peptides: [
        {
          peptideId: 'retatrutide',
          doseValue: 0.5,
          doseUnit: 'mg',
          frequency: 'weekly',
          route: 'subq',
          timing: 'Monday morning',
          schedule: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
          phaseLabel: 'Phase 1',
          startOffsetDays: 0,
          durationDays: 14,
        },
        {
          peptideId: 'retatrutide',
          doseValue: 1,
          doseUnit: 'mg',
          frequency: 'weekly',
          route: 'subq',
          timing: 'Monday morning',
          schedule: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
          phaseLabel: 'Phase 2',
          startOffsetDays: 14,
          durationDays: 14,
        },
      ],
      status: 'planned',
    });

    const result = activateStackSchedules({ stack, existingSchedules: [], existingScheduleLogs: [] });

    expect(result.schedules.map((schedule) => ({
      doseValue: schedule.doseValue,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
    }))).toEqual([
      {
        doseValue: 0.5,
        startDate: '2026-05-04T00:00:00.000Z',
        endDate: '2026-05-17T23:59:59.999Z',
      },
      {
        doseValue: 1,
        startDate: '2026-05-18T00:00:00.000Z',
        endDate: '2026-05-31T23:59:59.999Z',
      },
    ]);
    expect(result.scheduleLogs.map((log) => ({ peptideId: log.peptideId, dueAt: log.dueAt }))).toEqual([
      { peptideId: 'retatrutide', dueAt: '2026-05-04T08:00:00.000Z' },
      { peptideId: 'retatrutide', dueAt: '2026-05-11T08:00:00.000Z' },
      { peptideId: 'retatrutide', dueAt: '2026-05-18T08:00:00.000Z' },
      { peptideId: 'retatrutide', dueAt: '2026-05-25T08:00:00.000Z' },
    ]);
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

  test('generates interval logs every N days from the schedule start', () => {
    const schedule: Schedule = {
      id: 'schedule-interval',
      stackId: 'stack-legacy',
      stackPeptideId: 'stack-legacy-item-bpc-157-0',
      peptideId: 'bpc-157',
      doseValue: 250,
      doseUnit: 'mcg',
      route: 'subq',
      recurrence: { frequency: 'interval', timesOfDay: ['08:00'], intervalDays: 2 },
      startDate: '2026-05-23T00:00:00.000Z',
      endDate: '2026-05-29T23:59:59.999Z',
      status: 'active',
    };

    expect(generateScheduleLogs(schedule).map((log) => log.dueAt)).toEqual([
      '2026-05-23T08:00:00.000Z',
      '2026-05-25T08:00:00.000Z',
      '2026-05-27T08:00:00.000Z',
      '2026-05-29T08:00:00.000Z',
    ]);
  });

  test('generates cycle logs during on-days and skips off-days', () => {
    const schedule: Schedule = {
      id: 'schedule-cycle',
      stackId: 'stack-legacy',
      stackPeptideId: 'stack-legacy-item-ipamorelin-0',
      peptideId: 'ipamorelin',
      doseValue: 200,
      doseUnit: 'mcg',
      route: 'subq',
      recurrence: { frequency: 'cycle', timesOfDay: ['20:00'], cycleOnDays: 5, cycleOffDays: 2 },
      startDate: '2026-05-23T00:00:00.000Z',
      endDate: '2026-06-01T23:59:59.999Z',
      status: 'active',
    };

    expect(generateScheduleLogs(schedule).map((log) => log.dueAt)).toEqual([
      '2026-05-23T20:00:00.000Z',
      '2026-05-24T20:00:00.000Z',
      '2026-05-25T20:00:00.000Z',
      '2026-05-26T20:00:00.000Z',
      '2026-05-27T20:00:00.000Z',
      '2026-05-30T20:00:00.000Z',
      '2026-05-31T20:00:00.000Z',
      '2026-06-01T20:00:00.000Z',
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

  test('maps richer schedule presets into recurrence metadata and display copy', () => {
    const weekdays = applySchedulePreset(legacyStack.peptides[0], 'weekdays');
    const everyOtherDay = applySchedulePreset(legacyStack.peptides[0], 'every-other-day');
    const fiveOnTwoOff = applySchedulePreset(legacyStack.peptides[0], 'five-on-two-off');

    expect(getSchedulePreset(weekdays)).toBe('weekdays');
    expect(getScheduleSummary(weekdays.schedule!)).toBe('Weekdays · Monday, Tuesday, Wednesday, Thursday, Friday · 8:00 AM');
    expect(getSchedulePreset(everyOtherDay)).toBe('every-other-day');
    expect(getScheduleSummary(everyOtherDay.schedule!)).toBe('Every 2 days · 8:00 AM');
    expect(getSchedulePreset(fiveOnTwoOff)).toBe('five-on-two-off');
    expect(getScheduleSummary(fiveOnTwoOff.schedule!)).toBe('5 days on / 2 days off · 8:00 AM');
  });

  test('labels non-preset recurrence as custom', () => {
    expect(getSchedulePreset({
      ...legacyStack.peptides[0],
      schedule: { frequency: 'interval', timesOfDay: ['08:00'], intervalDays: 3 },
    })).toBe('custom');
  });

  test('does not rewrite custom recurrence through the preset helper', () => {
    const customPeptide: StackPeptide = {
      ...legacyStack.peptides[0],
      frequency: 'every 3 days',
      timing: 'Morning',
      schedule: { frequency: 'interval', timesOfDay: ['08:00'], intervalDays: 3 },
    };

    expect(applySchedulePreset(customPeptide, 'custom')).toEqual(customPeptide);
  });

  test('falls back to daily morning when persisted recurrence has no time slots', () => {
    const updated = applySchedulePreset({
      ...legacyStack.peptides[0],
      schedule: { frequency: 'daily', timesOfDay: [] },
    }, 'daily');

    expect(updated.schedule).toEqual({ frequency: 'daily', timesOfDay: ['08:00'] });
  });
  test('preserves custom dose times when changing cadence presets', () => {
    const customTimedDaily = applyScheduleTimes(legacyStack.peptides[0], ['10:30']);
    const weekly = applySchedulePreset(customTimedDaily, 'weekly');
    const twiceDaily = applySchedulePreset(customTimedDaily, 'twice-daily');

    expect(getScheduleSummary(weekly.schedule!)).toBe('Weekly · Monday · 10:30 AM');
    expect(getScheduleSummary(twiceDaily.schedule!)).toBe('2x daily · 10:30 AM, 8:00 PM');
  });

  test('updates once-daily and twice-daily custom times', () => {
    const daily = applyScheduleTimes(applySchedulePreset(legacyStack.peptides[0], 'daily'), ['10:30']);
    const twiceDaily = applyScheduleTimes(applySchedulePreset(legacyStack.peptides[0], 'twice-daily'), ['07:15', '21:45']);

    expect(daily.schedule?.timesOfDay).toEqual(['10:30']);
    expect(getScheduleSummary(daily.schedule!)).toBe('Daily · 10:30 AM');
    expect(twiceDaily.schedule?.timesOfDay).toEqual(['07:15', '21:45']);
    expect(getScheduleSummary(twiceDaily.schedule!)).toBe('2x daily · 7:15 AM, 9:45 PM');
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

  test('updates active stack item dose times and preserves completed logs', () => {
    const stack = normalizeStack({
      ...legacyStack,
      startDate: '2026-05-23T00:00:00.000Z',
      durationDays: 2,
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

    const result = updateStackPeptideScheduleTimes({
      stack: activated.stack,
      stackPeptideId: activated.stack.peptides[0].id!,
      timesOfDay: ['10:30', '21:45'],
      existingSchedules: activated.schedules,
      existingScheduleLogs: [preservedTakenLog, ...activated.scheduleLogs.slice(1)],
    });

    expect(result.scheduleLogs).toContainEqual(preservedTakenLog);
    expect(result.scheduleLogs.filter((log) => log.status === 'pending').map((log) => log.dueAt)).toEqual([
      '2026-05-23T10:30:00.000Z',
      '2026-05-23T21:45:00.000Z',
      '2026-05-24T10:30:00.000Z',
      '2026-05-24T21:45:00.000Z',
    ]);
  });

  test('generates schedule logs from local dose times instead of treating time input as UTC', () => {
    const previousTimeZone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      const schedule: Schedule = {
        id: 'schedule-local-time',
        stackId: 'stack-local',
        stackPeptideId: 'stack-local-item',
        peptideId: 'bpc-157',
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        recurrence: { frequency: 'daily', timesOfDay: ['22:00'] },
        startDate: '2026-06-21T07:00:00.000Z',
        endDate: '2026-06-21T23:59:59.999-07:00',
        status: 'active',
      };

      const [log] = generateScheduleLogs(schedule);

      expect(log.dueAt).toBe('2026-06-22T05:00:00.000Z');
      expect(new Date(log.dueAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles',
      })).toBe('10:00 PM');
      expect(log.id).toContain('2026-06-21-2200');
    } finally {
      process.env.TZ = previousTimeZone;
    }
  });

  test('does not regenerate a new single-dose pending log for a local day already taken', () => {
    const previousTimeZone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      const stack = normalizeStack({
        ...legacyStack,
        startDate: '2026-06-21T13:00:00.000Z',
        durationDays: 2,
        peptides: [legacyStack.peptides[0]],
        status: 'active',
      });
      const activated = activateStackSchedules({ stack, existingSchedules: [], existingScheduleLogs: [] });
      const firstLog = activated.scheduleLogs[0];
      const takenLog: ScheduleLog = {
        ...firstLog,
        status: 'taken',
        doseId: 'dose-1',
        takenAt: '2026-06-21T15:00:00.000Z',
      };

      const result = updateStackPeptideScheduleTimes({
        stack: activated.stack,
        stackPeptideId: activated.stack.peptides[0].id!,
        timesOfDay: ['22:00'],
        existingSchedules: activated.schedules,
        existingScheduleLogs: [takenLog, ...activated.scheduleLogs.slice(1)],
      });

      expect(result.scheduleLogs).toContainEqual(takenLog);
      expect(result.scheduleLogs.filter((log) => log.status === 'pending').map((log) => log.dueAt)).toEqual([
        '2026-06-23T05:00:00.000Z',
      ]);
    } finally {
      process.env.TZ = previousTimeZone;
    }
  });
});
