import { describe, expect, test } from 'vitest';

import { buildAdherenceGrid, buildAdherenceSummary, buildDashboardBriefing } from './dashboard-summary';
import type { AppData, Dose } from './types';

const now = new Date('2026-05-22T12:00:00.000Z');

const baseData: AppData = {
  peptides: [],
  compounds: [],
  vials: [],
  inventoryBatches: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
  reconstitutionCalculations: [],
  signalCheckIns: [],
  labReports: [],
  labResults: [],
  labImportAudits: [],
  hasSeenDisclaimer: true,
  hasCompletedOnboarding: true,
  userMode: 'beginner',
  biometricLock: false,
  darkMode: true,
};

function dose(overrides: Partial<Dose>): Dose {
  return {
    id: 'dose-1',
    peptideId: 'bpc-157',
    vialId: 'active',
    dateTime: '2026-05-22T08:00:00.000Z',
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: '',
    notes: '',
    completed: true,
    ...overrides,
  };
}

describe('dashboard summary', () => {
  test('summarizes today, active stacks, and active vials', () => {
    const briefing = buildDashboardBriefing(
      {
        ...baseData,
        vials: [
          {
            id: 'active',
            name: 'Active vial',
            peptideId: 'bpc-157',
            dateAdded: now.toISOString(),
            source: '',
            lotNumber: '',
            mg: 5,
            bacWaterMl: 2,
            reconstitutedDate: now.toISOString(),
            expirationDate: now.toISOString(),
            status: 'active',
          },
          {
            id: 'sealed',
            name: 'Sealed vial',
            peptideId: 'tb-500',
            dateAdded: now.toISOString(),
            source: '',
            lotNumber: '',
            mg: 5,
            bacWaterMl: 0,
            reconstitutedDate: null,
            expirationDate: now.toISOString(),
            status: 'sealed',
          },
        ],
        stacks: [
          { id: 'stack-1', name: 'Active', description: '', peptides: [], startDate: now.toISOString(), durationDays: 30, status: 'active', notes: '' },
          { id: 'stack-2', name: 'Planned', description: '', peptides: [], startDate: now.toISOString(), durationDays: 30, status: 'planned', notes: '' },
        ],
        doses: [
          dose({ id: 'standalone-done', dateTime: '2026-05-22T08:00:00.000Z' }),
          dose({ id: 'standalone-pending', dateTime: '2026-05-22T09:00:00.000Z', completed: false }),
        ],
        scheduleLogs: [
          { id: 'taken', scheduleId: 'schedule-1', stackId: 'stack-1', stackPeptideId: 'item-1', peptideId: 'bpc-157', dueAt: '2026-05-22T08:00:00.000Z', status: 'taken' },
        ],
      },
      now,
    );

    expect(briefing).toEqual(
      expect.objectContaining({
        scheduledToday: 3,
        completedToday: 2,
        pendingToday: 1,
        activeStacks: 1,
        activeVials: 1,
        completionPercent: 67,
      }),
    );
  });

  test('does not award completion when nothing scheduled', () => {
    const briefing = buildDashboardBriefing(baseData, now);

    expect(briefing).toEqual(
      expect.objectContaining({
        scheduledToday: 0,
        completedToday: 0,
        pendingToday: 0,
        completionPercent: 0,
      }),
    );
  });

  test('builds recent adherence grid from standalone completed dose counts', () => {
    const grid = buildAdherenceGrid(
      [
        dose({ id: 'today-1', dateTime: '2026-05-22T08:00:00.000Z' }),
        dose({ id: 'today-2', peptideId: 'tb-500', dateTime: '2026-05-22T09:00:00.000Z', doseValue: 2.5, doseUnit: 'mg' }),
        dose({ id: 'yesterday', dateTime: '2026-05-21T08:00:00.000Z' }),
        dose({ id: 'pending', dateTime: '2026-05-20T08:00:00.000Z', completed: false }),
      ],
      now,
      3,
    );

    expect(grid.map((day) => ({ label: day.label, count: day.completedCount, level: day.level, status: day.status }))).toEqual([
      { label: 'Wed', count: 0, level: 'none', status: 'empty' },
      { label: 'Thu', count: 1, level: 'low', status: 'completed' },
      { label: 'Today', count: 2, level: 'medium', status: 'completed' },
    ]);
  });

  test('builds schedule-log adherence with missed skipped delayed states', () => {
    const summary = buildAdherenceSummary(
      {
        ...baseData,
        doses: [dose({ id: 'late-dose', scheduleLogId: 'late-log', dateTime: '2026-05-21T11:30:00.000Z' })],
        scheduleLogs: [
          {
            id: 'missed-log',
            scheduleId: 'schedule-1',
            stackId: 'stack-1',
            stackPeptideId: 'item-1',
            peptideId: 'bpc-157',
            dueAt: '2026-05-20T08:00:00.000Z',
            status: 'missed',
            missedAt: '2026-05-20T12:00:00.000Z',
          },
          {
            id: 'late-log',
            scheduleId: 'schedule-1',
            stackId: 'stack-1',
            stackPeptideId: 'item-1',
            peptideId: 'bpc-157',
            dueAt: '2026-05-21T08:00:00.000Z',
            status: 'taken',
            doseId: 'late-dose',
            takenAt: '2026-05-21T11:30:00.000Z',
          },
          {
            id: 'skipped-log',
            scheduleId: 'schedule-1',
            stackId: 'stack-1',
            stackPeptideId: 'item-1',
            peptideId: 'bpc-157',
            dueAt: '2026-05-22T08:00:00.000Z',
            status: 'skipped',
            skippedAt: '2026-05-22T09:00:00.000Z',
          },
        ],
      },
      now,
      3,
    );

    expect(summary).toEqual(
      expect.objectContaining({
        scheduledCount: 3,
        completedCount: 1,
        missedCount: 1,
        skippedCount: 1,
        delayedCount: 1,
        completionPercent: 33,
      }),
    );
    expect(summary.days.map((day) => ({ label: day.label, status: day.status }))).toEqual([
      { label: 'Wed', status: 'missed' },
      { label: 'Thu', status: 'completed' },
      { label: 'Today', status: 'skipped' },
    ]);
  });
});
