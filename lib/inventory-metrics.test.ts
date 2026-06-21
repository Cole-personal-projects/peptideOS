import { describe, expect, it } from 'vitest';
import { buildProtocolInventoryRunway, getInventoryStockHealthSummary, getVialInventoryMetrics, getVialRunoutForecast } from './inventory-metrics';
import type { Dose, Schedule, ScheduleLog, Stack, Vial } from './types';

const baseVial: Vial = {
  id: 'vial-1',
  name: 'BPC-157 active vial',
  peptideId: 'bpc-157',
  dateAdded: '2026-05-20',
  source: 'Source',
  lotNumber: 'LOT-1',
  mg: 5,
  bacWaterMl: 2,
  reconstitutedDate: null,
  expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
};

function dose(overrides: Partial<Dose>): Dose {
  return {
    id: 'dose-1',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: new Date().toISOString(),
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed: true,
    ...overrides,
  };
}

const schedule: Schedule = {
  id: 'schedule-bpc',
  stackId: 'stack-1',
  stackPeptideId: 'stack-1-item-bpc-157-0',
  peptideId: 'bpc-157',
  doseValue: 1,
  doseUnit: 'mg',
  route: 'subq',
  recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
  startDate: '2026-05-20T00:00:00.000Z',
  endDate: '2026-06-30T23:59:59.999Z',
  status: 'active',
};

const stack: Stack = {
  id: 'stack-1',
  name: 'Recovery stack',
  description: '',
  peptides: [],
  startDate: '2026-05-20T00:00:00.000Z',
  durationDays: 30,
  status: 'active',
  notes: '',
};

function log(overrides: Partial<ScheduleLog>): ScheduleLog {
  return {
    id: overrides.id ?? 'log-1',
    scheduleId: overrides.scheduleId ?? schedule.id,
    stackId: 'stack-1',
    stackPeptideId: 'stack-1-item-bpc-157-0',
    peptideId: 'bpc-157',
    dueAt: overrides.dueAt ?? '2026-05-23T08:00:00.000Z',
    status: overrides.status ?? 'pending',
    ...overrides,
  };
}

describe('inventory metrics', () => {
  it('subtracts completed mass doses from vial amount and formats remaining mg', () => {
    const metrics = getVialInventoryMetrics(baseVial, [
      dose({ id: 'a', doseValue: 250, doseUnit: 'mcg' }),
      dose({ id: 'b', doseValue: 0.5, doseUnit: 'mg' }),
      dose({ id: 'c', completed: false, doseValue: 2, doseUnit: 'mg' }),
      dose({ id: 'd', vialId: 'other-vial', doseValue: 1, doseUnit: 'mg' }),
    ]);

    expect(metrics.remainingMg).toBe(4.25);
    expect(metrics.remainingLabel).toBe('4.25 mg');
    expect(metrics.originalLabel).toBe('5 mg');
  });

  it('formats IU-primary vial inventory in IU when conversion metadata exists', () => {
    const metrics = getVialInventoryMetrics(
      { ...baseVial, id: 'hgh-vial', peptideId: 'hgh', mg: 3.33 },
      [dose({ id: 'hgh-dose', peptideId: 'hgh', vialId: 'hgh-vial', doseValue: 2, doseUnit: 'iu' })]
    );

    expect(metrics.remainingMg).toBeCloseTo(2.663, 3);
    expect(metrics.originalLabel).toBe('9.99 IU');
    expect(metrics.remainingLabel).toBe('7.99 IU');
  });

  it('clamps overdrawn remaining amount at zero', () => {
    const metrics = getVialInventoryMetrics(baseVial, [dose({ doseValue: 10, doseUnit: 'mg' })]);

    expect(metrics.remainingMg).toBe(0);
    expect(metrics.remainingLabel).toBe('0 mg');
  });

  it('derives inventory from concentration and volume for multi-dose vials', () => {
    const testosteroneVial: Vial = {
      ...baseVial,
      id: 'test-cyp-vial',
      peptideId: 'testosterone-cypionate',
      containerType: 'multi-dose-vial',
      mg: 0,
      concentration: { value: 200, unit: 'mg/ml' },
      volumeMl: 10,
    };

    const metrics = getVialInventoryMetrics(testosteroneVial, [
      dose({
        id: 'test-dose',
        peptideId: 'testosterone-cypionate',
        vialId: 'test-cyp-vial',
        doseValue: 100,
        doseUnit: 'mg',
        route: 'im',
      }),
    ]);

    expect(metrics.originalMg).toBe(2000);
    expect(metrics.remainingMg).toBe(1900);
    expect(metrics.originalLabel).toBe('200 mg/mL · 10 mL');
    expect(metrics.remainingLabel).toBe('1900 mg');
  });

  it('formats IU concentration containers in IU when conversion metadata exists', () => {
    const hghPen: Vial = {
      ...baseVial,
      id: 'hgh-pen',
      peptideId: 'hgh',
      containerType: 'prefilled-pen',
      mg: 0,
      concentration: { value: 10, unit: 'iu/ml' },
      volumeMl: 1.5,
    };

    const metrics = getVialInventoryMetrics(hghPen, [
      dose({ id: 'hgh-pen-dose', peptideId: 'hgh', vialId: 'hgh-pen', doseValue: 2, doseUnit: 'iu' }),
    ]);

    expect(metrics.originalMg).toBe(5);
    expect(metrics.remainingMg).toBeCloseTo(4.333, 3);
    expect(metrics.originalLabel).toBe('10 IU/mL · 1.5 mL');
    expect(metrics.remainingLabel).toBe('13 IU');
  });

  it('forecasts runout from future pending schedule logs for the vial compound', () => {
    const forecast = getVialRunoutForecast({
      vial: { ...baseVial, mg: 2 },
      doses: [],
      schedules: [schedule],
      scheduleLogs: [
        log({ id: 'today', dueAt: '2026-05-22T08:00:00.000Z' }),
        log({ id: 'runout', dueAt: '2026-05-23T08:00:00.000Z' }),
        log({ id: 'after-runout', dueAt: '2026-05-24T08:00:00.000Z' }),
      ],
      now: new Date('2026-05-22T07:00:00.000Z'),
    });

    expect(forecast).toEqual(expect.objectContaining({
      status: 'runout',
      runoutAt: '2026-05-23T08:00:00.000Z',
      dosesCovered: 2,
      daysUntilRunout: 1,
      isLowStock: true,
      label: 'Runs out May 23',
    }));
  });

  it('ignores completed logs, past logs, and schedules for other compounds', () => {
    const otherSchedule: Schedule = { ...schedule, id: 'schedule-other', peptideId: 'tb-500', doseValue: 10 };
    const forecast = getVialRunoutForecast({
      vial: { ...baseVial, mg: 2 },
      doses: [],
      schedules: [schedule, otherSchedule],
      scheduleLogs: [
        log({ id: 'past', dueAt: '2026-05-21T08:00:00.000Z' }),
        log({ id: 'taken', dueAt: '2026-05-22T08:00:00.000Z', status: 'taken' }),
        log({ id: 'other', scheduleId: 'schedule-other', peptideId: 'tb-500', dueAt: '2026-05-22T08:00:00.000Z' }),
        log({ id: 'future', dueAt: '2026-05-23T08:00:00.000Z' }),
      ],
      now: new Date('2026-05-22T12:00:00.000Z'),
    });

    expect(forecast).toEqual(expect.objectContaining({
      status: 'covered',
      runoutAt: null,
      dosesCovered: 1,
      isLowStock: false,
      label: 'Covers scheduled doses',
    }));
  });

  it('reports no schedule when there are no future pending logs for the compound', () => {
    const forecast = getVialRunoutForecast({
      vial: baseVial,
      doses: [],
      schedules: [schedule],
      scheduleLogs: [],
      now: new Date('2026-05-22T12:00:00.000Z'),
    });

    expect(forecast).toEqual(expect.objectContaining({
      status: 'unscheduled',
      runoutAt: null,
      dosesCovered: 0,
      isLowStock: false,
      label: 'No scheduled usage',
    }));
  });

  it('summarizes stock health across active inventory', () => {
    const summary = getInventoryStockHealthSummary({
      vials: [
        { ...baseVial, id: 'healthy', expirationDate: '2026-06-30T00:00:00.000Z' },
        { ...baseVial, id: 'runout', mg: 1, expirationDate: '2026-06-30T00:00:00.000Z' },
        { ...baseVial, id: 'unscheduled', peptideId: 'tb-500', expirationDate: '2026-06-30T00:00:00.000Z' },
        { ...baseVial, id: 'expiring', expirationDate: '2026-05-24T00:00:00.000Z' },
        { ...baseVial, id: 'sealed', status: 'sealed' },
      ],
      doses: [],
      schedules: [schedule],
      scheduleLogs: [
        log({ id: 'healthy-1', dueAt: '2026-05-23T08:00:00.000Z' }),
        log({ id: 'healthy-2', dueAt: '2026-05-24T08:00:00.000Z' }),
      ],
      now: new Date('2026-05-22T07:00:00.000Z'),
      expiringSoonDays: 7,
    });

  expect(summary).toEqual({
    activeCount: 4,
    healthyCount: 2,
    lowStockCount: 0,
    runoutCount: 1,
    expiringSoonCount: 1,
    unscheduledCount: 1,
  });
});

  it('builds protocol runway rows for covered, low-stock, runout, expiring, and unscheduled states', () => {
    const now = new Date('2026-05-22T07:00:00.000Z');
    const activeStacks: Stack[] = [
      stack,
      { ...stack, id: 'stack-covered', name: 'Covered stack' },
      { ...stack, id: 'stack-runout', name: 'Runout stack' },
    ];
    const coveredSchedule: Schedule = {
      ...schedule,
      id: 'schedule-covered',
      stackId: 'stack-covered',
      stackPeptideId: 'covered-item',
      peptideId: 'sermorelin',
      doseValue: 0.25,
    };
    const runoutSchedule: Schedule = {
      ...schedule,
      id: 'schedule-runout',
      stackId: 'stack-runout',
      stackPeptideId: 'runout-item',
      peptideId: 'tb-500',
      doseValue: 1,
    };
    const expiringSchedule: Schedule = {
      ...schedule,
      id: 'schedule-expiring',
      peptideId: 'cjc-1295',
      doseValue: 0.25,
    };
    const runway = buildProtocolInventoryRunway({
      vials: [
        { ...baseVial, id: 'covered-vial', peptideId: 'sermorelin', mg: 5 },
        { ...baseVial, id: 'low-vial', mg: 1 },
        { ...baseVial, id: 'runout-vial', peptideId: 'tb-500', mg: 0 },
        { ...baseVial, id: 'expiring-vial', peptideId: 'cjc-1295', mg: 5, expirationDate: '2026-05-25T00:00:00.000Z' },
        { ...baseVial, id: 'unscheduled-vial', peptideId: 'ghk-cu', mg: 5 },
      ],
      doses: [],
      stacks: activeStacks,
      schedules: [schedule, coveredSchedule, runoutSchedule, expiringSchedule],
      scheduleLogs: [
        log({ id: 'low-1', dueAt: '2026-05-22T08:00:00.000Z' }),
        log({ id: 'low-2', dueAt: '2026-05-23T08:00:00.000Z' }),
        log({ id: 'covered-1', scheduleId: coveredSchedule.id, stackId: coveredSchedule.stackId, stackPeptideId: coveredSchedule.stackPeptideId, peptideId: 'sermorelin', dueAt: '2026-05-22T08:00:00.000Z' }),
        log({ id: 'runout-1', scheduleId: runoutSchedule.id, stackId: runoutSchedule.stackId, stackPeptideId: runoutSchedule.stackPeptideId, peptideId: 'tb-500', dueAt: '2026-05-22T08:00:00.000Z' }),
        log({ id: 'expiring-1', scheduleId: expiringSchedule.id, stackId: expiringSchedule.stackId, stackPeptideId: expiringSchedule.stackPeptideId, peptideId: 'cjc-1295', dueAt: '2026-05-22T08:00:00.000Z' }),
      ],
      now,
      expiringSoonDays: 7,
    });

    expect(runway.find((row) => row.scope === 'stack' && row.stackId === 'stack-covered' && row.compoundId === 'sermorelin')?.status).toBe('covered');
    expect(runway.find((row) => row.scope === 'stack' && row.stackId === 'stack-1' && row.compoundId === 'bpc-157')?.status).toBe('low-stock');
    expect(runway.find((row) => row.scope === 'stack' && row.stackId === 'stack-runout' && row.compoundId === 'tb-500')?.status).toBe('runout');
    expect(runway.find((row) => row.scope === 'stack' && row.compoundId === 'cjc-1295')?.status).toBe('expiring');
    expect(runway.find((row) => row.scope === 'compound' && row.compoundId === 'ghk-cu')?.status).toBe('unscheduled');
  });
});
