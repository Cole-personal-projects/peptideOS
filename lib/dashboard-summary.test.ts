import { describe, expect, test } from 'vitest';
import { buildAdherenceGrid, buildDashboardBriefing } from './dashboard-summary';
import type { AppData } from './types';

const now = new Date('2026-05-22T12:00:00.000Z');

const baseData: AppData = {
  peptides: [],
  vials: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
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
