import { describe, expect, it } from 'vitest';
import {
  buildDueDoseInbox,
  completeDueDose,
  markOverdueScheduleLogsMissed,
  skipDueDose,
} from './due-doses';
import type { AppData, Schedule, ScheduleLog } from './types';

const schedule: Schedule = {
  id: 'schedule-bpc',
  stackId: 'stack-1',
  stackPeptideId: 'stack-1-item-bpc-157-0',
  peptideId: 'bpc-157',
  doseValue: 250,
  doseUnit: 'mcg',
  route: 'subq',
  recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
  startDate: '2026-06-10T00:00:00.000Z',
  endDate: '2026-06-20T23:59:59.999Z',
  status: 'active',
};

function makeLog(overrides: Partial<ScheduleLog>): ScheduleLog {
  return {
    id: overrides.id ?? 'log-1',
    scheduleId: schedule.id,
    stackId: schedule.stackId,
    stackPeptideId: schedule.stackPeptideId,
    peptideId: schedule.peptideId,
    dueAt: overrides.dueAt ?? '2026-06-13T08:00:00.000Z',
    status: overrides.status ?? 'pending',
    ...overrides,
  };
}

function makeData(scheduleLogs: ScheduleLog[]): AppData {
  return {
    peptides: [],
    compounds: [],
    vials: [],
    doses: [],
    stacks: [],
    schedules: [schedule],
    scheduleLogs,
    reconstitutionCalculations: [],
    hasSeenDisclaimer: true,
    hasCompletedOnboarding: true,
    userMode: 'researcher',
    biometricLock: false,
    darkMode: true,
  };
}

describe('buildDueDoseInbox', () => {
  it('returns overdue and today pending logs sorted by due time', () => {
    const data = makeData([
      makeLog({ id: 'tomorrow', dueAt: '2026-06-14T08:00:00.000Z' }),
      makeLog({ id: 'taken', dueAt: '2026-06-13T07:00:00.000Z', status: 'taken' }),
      makeLog({ id: 'today-late', dueAt: '2026-06-13T20:00:00.000Z' }),
      makeLog({ id: 'overdue', dueAt: '2026-06-12T08:00:00.000Z' }),
      makeLog({ id: 'today-early', dueAt: '2026-06-13T08:00:00.000Z' }),
    ]);

    expect(buildDueDoseInbox(data, new Date('2026-06-13T12:00:00.000Z')).map((item) => ({
      id: item.log.id,
      state: item.state,
    }))).toEqual([
      { id: 'overdue', state: 'overdue' },
      { id: 'today-early', state: 'due' },
      { id: 'today-late', state: 'upcoming' },
    ]);
  });
});

describe('markOverdueScheduleLogsMissed', () => {
  it('marks pending logs missed after the grace period and leaves today alone', () => {
    const data = makeData([
      makeLog({ id: 'stale', dueAt: '2026-06-12T08:00:00.000Z' }),
      makeLog({ id: 'today', dueAt: '2026-06-13T08:00:00.000Z' }),
      makeLog({ id: 'skipped', dueAt: '2026-06-12T08:00:00.000Z', status: 'skipped' }),
    ]);

    const next = markOverdueScheduleLogsMissed(data, new Date('2026-06-13T12:00:00.000Z'), 12);

    expect(next.scheduleLogs.find((log) => log.id === 'stale')).toEqual(expect.objectContaining({
      status: 'missed',
      missedAt: '2026-06-13T12:00:00.000Z',
    }));
    expect(next.scheduleLogs.find((log) => log.id === 'today')?.status).toBe('pending');
    expect(next.scheduleLogs.find((log) => log.id === 'skipped')?.status).toBe('skipped');
  });
});

describe('completeDueDose', () => {
  it('creates a completed dose and marks the schedule log taken', () => {
    const data = makeData([makeLog({ id: 'due' })]);
    const next = completeDueDose(data, 'due', {
      vialId: 'vial-1',
      site: 'abdomen-upper-left',
      notes: 'felt fine',
    }, new Date('2026-06-13T08:05:00.000Z'));

    expect(next.doses).toEqual([
      expect.objectContaining({
        id: 'dose-due',
        scheduleLogId: 'due',
        peptideId: 'bpc-157',
        vialId: 'vial-1',
        dateTime: '2026-06-13T08:05:00.000Z',
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        site: 'abdomen-upper-left',
        notes: 'felt fine',
        completed: true,
      }),
    ]);
    expect(next.scheduleLogs[0]).toEqual(expect.objectContaining({
      status: 'taken',
      doseId: 'dose-due',
      takenAt: '2026-06-13T08:05:00.000Z',
    }));
  });

  it('does nothing when the log is no longer pending', () => {
    const data = makeData([makeLog({ id: 'due', status: 'skipped' })]);
    expect(completeDueDose(data, 'due', { vialId: 'vial-1', site: '', notes: '' })).toBe(data);
  });
});

describe('skipDueDose', () => {
  it('marks pending due doses skipped with a timestamp', () => {
    const data = makeData([makeLog({ id: 'due' })]);
    const next = skipDueDose(data, 'due', new Date('2026-06-13T08:10:00.000Z'));

    expect(next.scheduleLogs[0]).toEqual(expect.objectContaining({
      status: 'skipped',
      skippedAt: '2026-06-13T08:10:00.000Z',
    }));
  });

  it('does nothing when the log is already taken', () => {
    const data = makeData([makeLog({ id: 'due', status: 'taken' })]);
    expect(skipDueDose(data, 'due')).toBe(data);
  });
});
