import { describe, expect, it } from 'vitest';
import { buildProtocolCockpitSummary } from './protocol-timeline';
import type { AppData, Compound, Schedule, ScheduleLog, Stack, Vial } from './types';

const compound = {
  id: 'bpc-157',
  name: 'BPC-157',
  aliases: [],
  compoundType: 'peptide',
  category: 'healing',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'mcg',
  concentrationMode: 'reconstituted',
  dosePresets: [],
  vialPresets: [],
  beginnerSummary: '',
  researcherDetails: '',
  safety: '',
  storage: '',
  citations: [],
  source: 'bundled',
  curationStatus: 'reviewed',
} satisfies Compound;

const stack: Stack = {
  id: 'stack-1',
  name: 'Recovery stack',
  description: 'Recovery protocol',
  peptides: [],
  startDate: '2026-06-21',
  durationDays: 30,
  status: 'active',
  notes: '',
};

const schedule: Schedule = {
  id: 'schedule-1',
  stackId: 'stack-1',
  stackPeptideId: 'stack-item-1',
  peptideId: 'bpc-157',
  doseValue: 250,
  doseUnit: 'mcg',
  route: 'subq',
  recurrence: { frequency: 'daily', timesOfDay: ['08:00', '20:00'] },
  startDate: '2026-06-21',
  endDate: '2026-07-21',
  status: 'active',
};

const vial: Vial = {
  id: 'vial-1',
  name: 'BPC vial',
  peptideId: 'bpc-157',
  dateAdded: '2026-06-01T00:00:00.000Z',
  source: 'manual',
  lotNumber: 'LOT-1',
  mg: 1,
  bacWaterMl: 1,
  reconstitutedDate: '2026-06-01T00:00:00.000Z',
  expirationDate: '2026-07-01T00:00:00.000Z',
  status: 'active',
};

function log(id: string, dueAt: string, status: ScheduleLog['status'] = 'pending'): ScheduleLog {
  return {
    id,
    scheduleId: 'schedule-1',
    stackId: 'stack-1',
    stackPeptideId: 'stack-item-1',
    peptideId: 'bpc-157',
    dueAt,
    status,
  };
}

function appData(overrides: Partial<AppData> = {}): AppData {
  return {
    peptides: [],
    compounds: [compound],
    vials: [],
    inventoryBatches: [],
    doses: [],
    stacks: [stack],
    schedules: [schedule],
    scheduleLogs: [],
    reconstitutionCalculations: [],
    signalCheckIns: [],
    hasSeenDisclaimer: true,
    hasCompletedOnboarding: true,
    userMode: 'researcher',
    biometricLock: false,
    darkMode: true,
    ...overrides,
  };
}

describe('buildProtocolCockpitSummary', () => {
  it('keeps twice-daily same-compound schedule logs distinct by due time', () => {
    const summary = buildProtocolCockpitSummary(
    appData({
      vials: [{ ...vial, mg: 5 }],
      scheduleLogs: [
        log('morning', '2026-06-21T08:00:00.000Z'),
          log('evening', '2026-06-21T20:00:00.000Z'),
        ],
      }),
      new Date('2026-06-21T07:00:00.000Z'),
    );

    expect(summary.dueCount).toBe(2);
    expect(summary.nextAction?.id).toBe('schedule-log:evening');
    expect(summary.events.filter((event) => event.kind === 'due-dose').map((event) => event.id)).toEqual([
      'schedule-log:evening',
      'schedule-log:morning',
    ]);
    const details = summary.events.filter((event) => event.kind === 'due-dose').map((event) => event.detail);
    expect(details).toHaveLength(2);
    expect(details[0]).not.toBe(details[1]);
    expect(details.every((detail) => detail.startsWith('Recovery stack · Due '))).toBe(true);
  });

  it('counts overdue, completed, skipped, missed, and active stack state', () => {
    const summary = buildProtocolCockpitSummary(
      appData({
        scheduleLogs: [
          log('overdue', '2026-06-21T08:00:00.000Z'),
          { ...log('taken', '2026-06-21T09:00:00.000Z', 'taken'), takenAt: '2026-06-21T09:05:00.000Z' },
          { ...log('skipped', '2026-06-21T10:00:00.000Z', 'skipped'), skippedAt: '2026-06-21T10:01:00.000Z' },
          { ...log('missed', '2026-06-21T11:00:00.000Z', 'missed'), missedAt: '2026-06-21T11:01:00.000Z' },
        ],
      }),
      new Date('2026-06-21T12:00:00.000Z'),
    );

    expect(summary.dueCount).toBe(1);
    expect(summary.overdueCount).toBe(1);
    expect(summary.completedTodayCount).toBe(1);
    expect(summary.skippedOrMissedCount).toBe(2);
    expect(summary.activeStackCount).toBe(1);
    expect(summary.nextAction).toMatchObject({
      id: 'schedule-log:overdue',
      urgency: 'critical',
      href: '/stacks/stack-1',
    });
  });

  it('surfaces protocol-linked inventory runway risk', () => {
    const summary = buildProtocolCockpitSummary(
      appData({
      vials: [{ ...vial, mg: 0 }],
        scheduleLogs: [
          log('dose-1', '2026-06-22T08:00:00.000Z'),
          log('dose-2', '2026-06-23T08:00:00.000Z'),
          log('dose-3', '2026-06-24T08:00:00.000Z'),
          log('dose-4', '2026-06-25T08:00:00.000Z'),
          log('dose-5', '2026-06-26T08:00:00.000Z'),
        ],
      }),
      new Date('2026-06-21T08:00:00.000Z'),
    );

    expect(summary.inventoryRiskCount).toBeGreaterThan(0);
  expect(summary.events.some((event) => event.kind === 'inventory' && event.status === 'runout')).toBe(true);
  expect(summary.mostUrgentInventoryRisk).toMatchObject({
    kind: 'inventory',
    status: 'runout',
    href: '/stacks/stack-1',
  });
  expect(summary.events[0]).toMatchObject({
    kind: 'inventory',
    status: 'runout',
    urgency: 'critical',
    href: '/stacks/stack-1',
  });
  });

  it('does not surface inventory coverage warnings without active stack schedules', () => {
    const summary = buildProtocolCockpitSummary(
      appData({
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        vials: [{ ...vial, mg: 1 }],
      }),
      new Date('2026-06-21T08:00:00.000Z'),
    );

    expect(summary.activeStackCount).toBe(0);
    expect(summary.inventoryRiskCount).toBe(0);
    expect(summary.mostUrgentInventoryRisk).toBeUndefined();
    expect(summary.events.some((event) => event.kind === 'inventory')).toBe(false);
  });

  it('ranks critical inventory and overdue events ahead of low-urgency recent activity', () => {
    const summary = buildProtocolCockpitSummary(
      appData({
      vials: [{ ...vial, mg: 0 }],
        doses: [{
          id: 'recent-dose',
          peptideId: 'bpc-157',
          vialId: 'vial-1',
          dateTime: '2026-06-21T07:00:00.000Z',
          doseValue: 250,
          doseUnit: 'mcg',
          route: 'subq',
          site: 'abdomen-upper-left',
          notes: '',
          completed: true,
        }],
        scheduleLogs: [
          log('overdue', '2026-06-21T06:00:00.000Z'),
          log('dose-1', '2026-06-22T08:00:00.000Z'),
          log('dose-2', '2026-06-23T08:00:00.000Z'),
          log('dose-3', '2026-06-24T08:00:00.000Z'),
          log('dose-4', '2026-06-25T08:00:00.000Z'),
          log('dose-5', '2026-06-26T08:00:00.000Z'),
        ],
      }),
      new Date('2026-06-21T08:00:00.000Z'),
    );

    expect(summary.events.slice(0, 2).every((event) => event.urgency === 'critical')).toBe(true);
    expect(summary.events.findIndex((event) => event.id === 'dose:recent-dose')).toBeGreaterThan(1);
  });

  it('includes the latest signal check-in as recent protocol context', () => {
    const summary = buildProtocolCockpitSummary(
      appData({
        signalCheckIns: [
          { id: 'old', checkedAt: '2026-06-20T08:00:00.000Z', energy: 5, sleepHours: 6, notes: 'Earlier' },
          { id: 'new', checkedAt: '2026-06-21T08:00:00.000Z', energy: 8, sleepHours: 7.5, notes: 'Good recovery' },
        ],
      }),
      new Date('2026-06-21T09:00:00.000Z'),
    );

    expect(summary.latestSignal?.id).toBe('signal:new');
    expect(summary.latestSignal?.detail).toContain('Good recovery');
  });
});
