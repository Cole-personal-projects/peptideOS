import { describe, expect, it } from 'vitest';
import { buildHalfLifeSimulation } from './half-life-simulator';
import type { Compound } from './types';

const compound = {
  id: 'semaglutide',
  name: 'Semaglutide',
  pharmacokinetics: {
    halfLifeHours: 168,
    halfLifeSource: 'Approved label describes half-life around 1 week.',
    citationIds: ['label'],
    evidenceTier: 'approved-label',
    modelNotes: 'First-order estimated remaining amount only.',
  },
} satisfies Pick<Compound, 'id' | 'name' | 'pharmacokinetics'>;

const iuCompound = {
  ...compound,
  id: 'hgh-somatropin',
  name: 'hGH / Somatropin',
  conversion: { iuPerMg: 3 },
} satisfies Pick<Compound, 'id' | 'name' | 'conversion' | 'pharmacokinetics'>;

describe('half-life simulator', () => {
  it('models repeated scheduled doses inside the selected window', () => {
    const simulation = buildHalfLifeSimulation({
      compound,
      doseValue: 1,
      doseUnit: 'mg',
      doseCount: 4,
      frequencyId: 'weekly',
      windowDays: 30,
      now: new Date('2026-06-01T08:00:00.000Z'),
    });

    expect(simulation.events).toHaveLength(4);
    expect(simulation.events.map((event) => event.occurredAt)).toEqual([
      '2026-06-01T08:00:00.000Z',
      '2026-06-08T08:00:00.000Z',
      '2026-06-15T08:00:00.000Z',
      '2026-06-22T08:00:00.000Z',
    ]);
    expect(simulation.currentEstimatedMg).toBe(1);
    expect(simulation.peakEstimatedMg).toBeGreaterThan(1);
    expect(simulation.clearsAt).toBeTruthy();
  });

  it('converts mcg doses to mg for the estimate', () => {
    const simulation = buildHalfLifeSimulation({
      compound,
      doseValue: 500,
      doseUnit: 'mcg',
      doseCount: 1,
      frequencyId: 'daily',
      windowDays: 14,
      now: new Date('2026-06-01T08:00:00.000Z'),
    });

    expect(simulation.events[0].amountMg).toBe(0.5);
    expect(simulation.currentEstimatedMg).toBe(0.5);
  });

  it('converts IU doses to mg when compound conversion metadata is available', () => {
    const simulation = buildHalfLifeSimulation({
      compound: iuCompound,
      doseValue: 3,
      doseUnit: 'iu',
      doseCount: 1,
      frequencyId: 'daily',
      windowDays: 14,
      now: new Date('2026-06-01T08:00:00.000Z'),
    });

    expect(simulation.events[0].amountMg).toBe(1);
    expect(simulation.currentEstimatedMg).toBe(1);
  });

  it('reports unsupported compounds instead of drawing a fake curve', () => {
    const simulation = buildHalfLifeSimulation({
      compound: { id: 'bpc-157', name: 'BPC-157' } as Compound,
      doseValue: 250,
      doseUnit: 'mcg',
      doseCount: 1,
      frequencyId: 'daily',
      windowDays: 14,
      now: new Date('2026-06-01T08:00:00.000Z'),
    });

    expect(simulation.points).toHaveLength(0);
    expect(simulation.unsupportedReason).toMatch(/half-life/i);
  });
});
