import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateRotationScore,
  getHeatmapColor,
  getMostUsedZone,
  getRecencyBgClass,
  getRecencyColor,
  getSuggestedZone,
  getUnderusedZones,
  getZoneDoseHistory,
  getZoneStats,
} from './injection-zones';
import type { Dose } from './types';

const now = new Date('2026-05-17T12:00:00Z');

function dose(overrides: Partial<Dose>): Dose {
  return {
    id: 'dose-1',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: now.toISOString(),
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed: true,
    ...overrides,
  };
}

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('injection zone rotation behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classifies site recency from completed dose history', () => {
    expect(getZoneStats([], 'abdomen-upper-left')).toMatchObject({
      daysSinceUse: null,
      dosesLast30Days: 0,
      recencyLevel: 'fresh',
    });

    expect(getZoneStats([dose({ dateTime: daysAgo(0.5) })], 'abdomen-upper-left').recencyLevel).toBe('avoid');
    expect(getZoneStats([dose({ dateTime: daysAgo(2) })], 'abdomen-upper-left').recencyLevel).toBe('recent');
    expect(getZoneStats([dose({ dateTime: daysAgo(5) })], 'abdomen-upper-left').recencyLevel).toBe('moderate');
    expect(getZoneStats([dose({ dateTime: daysAgo(8) })], 'abdomen-upper-left').recencyLevel).toBe('fresh');
  });

  it('ignores incomplete doses for recency and history', () => {
    const history = [
      dose({ id: 'completed', dateTime: daysAgo(5), completed: true }),
      dose({ id: 'planned', dateTime: daysAgo(0.5), completed: false }),
    ];

    expect(getZoneStats(history, 'abdomen-upper-left')).toMatchObject({
      daysSinceUse: 5,
      recencyLevel: 'moderate',
      dosesLast30Days: 1,
    });
    expect(getZoneDoseHistory(history, 'abdomen-upper-left').map((entry) => entry.id)).toEqual(['completed']);
  });

  it('suggests a route-compatible zone instead of an incompatible fresh zone', () => {
    const history = [
      dose({ id: 'left-thigh', site: 'thigh-front-upper-left', route: 'im', dateTime: daysAgo(1) }),
      dose({ id: 'right-thigh', site: 'thigh-front-upper-right', route: 'im', dateTime: daysAgo(2) }),
    ];

    const suggestion = getSuggestedZone(history, 'im');

    expect(suggestion).not.toBe('abdomen-upper-left');
    expect(suggestion).toMatch(/thigh|delt|glute/);
  });

  it('falls back to injectable zones when no route is selected', () => {
    expect(getSuggestedZone([], null)).toBe('abdomen-upper-left');
    expect(getSuggestedZone([], 'oral')).toBeNull();
  });

  it('reports underused zones and most recent zone history in date order', () => {
    const history = [
      dose({ id: 'older', dateTime: daysAgo(6) }),
      dose({ id: 'newer', dateTime: daysAgo(2) }),
      dose({ id: 'other-zone', site: 'abdomen-upper-right', dateTime: daysAgo(1) }),
    ];

    expect(getZoneDoseHistory(history, 'abdomen-upper-left').map((entry) => entry.id)).toEqual(['newer', 'older']);
    expect(getUnderusedZones(history, 10).map((zone) => zone.id)).toContain('abdomen-mid-left');
    expect(getUnderusedZones(history, 10).map((zone) => zone.id)).not.toContain('abdomen-upper-left');
  });

  it('reports the most used zone over the last 30 days', () => {
    const history = [
      dose({ id: 'left-a', site: 'abdomen-upper-left', dateTime: daysAgo(1) }),
      dose({ id: 'left-b', site: 'abdomen-upper-left', dateTime: daysAgo(2) }),
      dose({ id: 'right-a', site: 'abdomen-upper-right', dateTime: daysAgo(3) }),
    ];

    expect(getMostUsedZone([])).toBeNull();
    expect(getMostUsedZone(history)).toMatchObject({
      zone: { id: 'abdomen-upper-left' },
      count: 2,
    });
  });

  it('maps recency and heatmap levels to stable style tokens', () => {
    expect(getRecencyColor('fresh')).toBe('var(--zone-fresh)');
    expect(getRecencyBgClass('avoid')).toContain('fill-red');
    expect(getRecencyBgClass('incompatible')).toContain('fill-muted');
    expect(getHeatmapColor(0)).toContain('slate');
    expect(getHeatmapColor(2)).toContain('violet-500/20');
    expect(getHeatmapColor(5)).toContain('violet-500/40');
    expect(getHeatmapColor(10)).toContain('violet-500/60');
    expect(getHeatmapColor(11)).toContain('violet-500/80');
  });

  it('scores broader rotation higher than repeated use of one zone', () => {
    const repeated = [
      dose({ id: 'a', dateTime: daysAgo(1) }),
      dose({ id: 'b', dateTime: daysAgo(2) }),
      dose({ id: 'c', dateTime: daysAgo(3) }),
      dose({ id: 'd', dateTime: daysAgo(4) }),
    ];
    const rotated = [
      dose({ id: 'a', site: 'abdomen-upper-left', dateTime: daysAgo(1) }),
      dose({ id: 'b', site: 'abdomen-upper-right', dateTime: daysAgo(2) }),
      dose({ id: 'c', site: 'abdomen-lower-left', dateTime: daysAgo(3) }),
      dose({ id: 'd', site: 'abdomen-lower-right', dateTime: daysAgo(4) }),
    ];

    expect(calculateRotationScore(rotated)).toBeGreaterThan(calculateRotationScore(repeated));
  });
});
