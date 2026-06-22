import { describe, expect, test } from 'vitest';
import { buildAdherenceGrid, buildDashboardBriefing } from './dashboard-summary';
import type { AppData } from './types';

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

describe('dashboard summary', () => {
  test('summarizes today, active stacks, and active vials', () => {
    const briefing = buildDashboardBriefing({
      ...baseData,
      vials: [
        { id: 'active', name: 'Active vial', peptideId: 'bpc-157', dateAdded: now.toISOString(), source: '', lotNumber: '', mg: 5, bacWaterMl: 2, reconstitutedDate: now.toISOString(), expirationDate: now.toISOString(), status: 'active' },
        { id: 'sealed', name: 'Sealed vial', peptideId: 'tb-500', dateAdded: now.toISOString(), source: '', lotNumber: '', mg: 5, bacWaterMl: 0, reconstitutedDate: null, expirationDate: now.toISOString(), status: 'sealed' },
      ],
      stacks: [
        { id: 'stack-1', name: 'Active', description: '', peptides: [], startDate: now.toISOString(), durationDays: 30, status: 'active', notes: '' },
        { id: 'stack-2', name: 'Planned', description: '', peptides: [], startDate: now.toISOString(), durationDays: 30, status: 'planned', notes: '' },
      ],
      doses: [
        { id: 'done', peptideId: 'bpc-157', vialId: 'active', dateTime: '2026-05-22T08:00:00.000Z', doseValue: 250, doseUnit: 'mcg', route: 'subq', site: '', notes: '', completed: true },
        { id: 'pending', peptideId: 'bpc-157', vialId: 'active', dateTime: '2026-05-22T20:00:00.000Z', doseValue: 250, doseUnit: 'mcg', route: 'subq', site: '', notes: '', completed: false },
        { id: 'old', peptideId: 'bpc-157', vialId: 'active', dateTime: '2026-05-21T20:00:00.000Z', doseValue: 250, doseUnit: 'mcg', route: 'subq', site: '', notes: '', completed: true },
      ],
    }, now);

    expect(briefing).toEqual({
      scheduledToday: 2,
      completedToday: 1,
      pendingToday: 1,
      activeStacks: 1,
      activeVials: 1,
      completionPercent: 50,
    });
  });

  test('summarizes scheduled dose logs for today', () => {
    const briefing = buildDashboardBriefing({
      ...baseData,
      scheduleLogs: [
        { id: 'pending', scheduleId: 'schedule-1', stackId: 'stack-1', stackPeptideId: 'item-1', peptideId: 'bpc-157', dueAt: '2026-05-22T08:00:00.000Z', status: 'pending' },
        { id: 'taken', scheduleId: 'schedule-1', stackId: 'stack-1', stackPeptideId: 'item-1', peptideId: 'bpc-157', dueAt: '2026-05-22T20:00:00.000Z', status: 'taken' },
        { id: 'skipped', scheduleId: 'schedule-1', stackId: 'stack-1', stackPeptideId: 'item-1', peptideId: 'bpc-157', dueAt: '2026-05-22T21:00:00.000Z', status: 'skipped' },
        { id: 'tomorrow', scheduleId: 'schedule-1', stackId: 'stack-1', stackPeptideId: 'item-1', peptideId: 'bpc-157', dueAt: '2026-05-23T08:00:00.000Z', status: 'pending' },
      ],
    }, now);

    expect(briefing).toEqual(expect.objectContaining({
      scheduledToday: 3,
      completedToday: 2,
      pendingToday: 1,
      completionPercent: 67,
    }));
  });

  test('builds a recent adherence grid with completed dose counts', () => {
    const grid = buildAdherenceGrid([
      { id: 'today-1', peptideId: 'bpc-157', vialId: 'active', dateTime: '2026-05-22T08:00:00.000Z', doseValue: 250, doseUnit: 'mcg', route: 'subq', site: '', notes: '', completed: true },
      { id: 'today-2', peptideId: 'tb-500', vialId: 'active', dateTime: '2026-05-22T09:00:00.000Z', doseValue: 2.5, doseUnit: 'mg', route: 'subq', site: '', notes: '', completed: true },
      { id: 'yesterday', peptideId: 'bpc-157', vialId: 'active', dateTime: '2026-05-21T08:00:00.000Z', doseValue: 250, doseUnit: 'mcg', route: 'subq', site: '', notes: '', completed: true },
      { id: 'pending', peptideId: 'bpc-157', vialId: 'active', dateTime: '2026-05-20T08:00:00.000Z', doseValue: 250, doseUnit: 'mcg', route: 'subq', site: '', notes: '', completed: false },
    ], now, 3);

    expect(grid.map(day => ({ label: day.label, count: day.completedCount, level: day.level }))).toEqual([
      { label: 'Wed', count: 0, level: 'none' },
      { label: 'Thu', count: 1, level: 'low' },
      { label: 'Today', count: 2, level: 'medium' },
    ]);
  });
});
