import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSitePickerZones, getSelectedZoneSummary } from './site-picker';
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

describe('site picker view model', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks selected, suggested, compatible, and recency state for visible zones', () => {
    const zones = getSitePickerZones({
      doses: [
        dose({ site: 'abdomen-upper-left', dateTime: daysAgo(0.5) }),
        dose({ site: 'abdomen-upper-left', dateTime: daysAgo(2) }),
      ],
      route: 'subq',
      selectedSite: 'abdomen-upper-left',
      view: 'front',
      mode: 'recency',
    });

    const selected = zones.find((zone) => zone.id === 'abdomen-upper-left');

    expect(selected).toMatchObject({
      selected: true,
      compatible: true,
      recencyLevel: 'avoid',
      dosesLast30Days: 2,
      tone: 'avoid',
    });
    expect(zones.some((zone) => zone.suggested && zone.id !== 'abdomen-upper-left')).toBe(true);
  });

  it('fades route-incompatible zones and switches to density tones in heatmap mode', () => {
    const zones = getSitePickerZones({
      doses: [
        dose({ site: 'abdomen-upper-left', dateTime: daysAgo(1) }),
        dose({ site: 'abdomen-upper-left', dateTime: daysAgo(2) }),
        dose({ site: 'abdomen-upper-left', dateTime: daysAgo(3) }),
      ],
      route: 'im',
      selectedSite: '',
      view: 'front',
      mode: 'heatmap',
    });

    expect(zones.find((zone) => zone.id === 'abdomen-upper-left')).toMatchObject({
      compatible: false,
      tone: 'incompatible',
    });
    expect(zones.find((zone) => zone.id === 'thigh-front-upper-left')).toMatchObject({
      compatible: true,
      tone: 'heat-0',
    });
  });

  it('maps heatmap density bands for visible compatible zones', () => {
    const zones = getSitePickerZones({
      doses: [
        dose({ id: 'a', site: 'abdomen-upper-left', dateTime: daysAgo(1) }),
        dose({ id: 'b', site: 'abdomen-upper-right', dateTime: daysAgo(1) }),
        dose({ id: 'c', site: 'abdomen-upper-right', dateTime: daysAgo(2) }),
        ...Array.from({ length: 5 }, (_, index) =>
          dose({ id: `mid-${index}`, site: 'abdomen-mid-left', dateTime: daysAgo(index + 1) }),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          dose({ id: `high-${index}`, site: 'abdomen-mid-right', dateTime: daysAgo(index + 1) }),
        ),
        ...Array.from({ length: 11 }, (_, index) =>
          dose({ id: `max-${index}`, site: 'abdomen-lower-left', dateTime: daysAgo(index + 1) }),
        ),
      ],
      route: 'subq',
      selectedSite: '',
      view: 'front',
      mode: 'heatmap',
    });

    expect(zones.find((zone) => zone.id === 'abdomen-upper-left')?.tone).toBe('heat-low');
    expect(zones.find((zone) => zone.id === 'abdomen-upper-right')?.tone).toBe('heat-low');
    expect(zones.find((zone) => zone.id === 'abdomen-mid-left')?.tone).toBe('heat-medium');
    expect(zones.find((zone) => zone.id === 'abdomen-mid-right')?.tone).toBe('heat-high');
    expect(zones.find((zone) => zone.id === 'abdomen-lower-left')?.tone).toBe('heat-max');
  });

  it('summarizes selected zone history without exposing implementation details', () => {
    const summary = getSelectedZoneSummary(
      [
        dose({ id: 'older', site: 'abdomen-upper-left', dateTime: daysAgo(8) }),
        dose({ id: 'newer', site: 'abdomen-upper-left', dateTime: daysAgo(3) }),
      ],
      'abdomen-upper-left',
    );

    expect(summary).toMatchObject({
      label: 'Upper Left Abdomen',
      lastUsedLabel: 'Last used 3 days ago',
      dosesLast30Days: 2,
    });
    expect(summary?.history.map((entry) => entry.id)).toEqual(['newer', 'older']);
  });

  it('summarizes never-used, today-used, and one-day-old selected zones', () => {
    expect(getSelectedZoneSummary([], '')).toBeNull();
    expect(getSelectedZoneSummary([], 'abdomen-upper-left')?.lastUsedLabel).toBe('Never used');
    expect(getSelectedZoneSummary([dose({ dateTime: daysAgo(0.25) })], 'abdomen-upper-left')?.lastUsedLabel).toBe(
      'Last used today',
    );
    expect(getSelectedZoneSummary([dose({ dateTime: daysAgo(1) })], 'abdomen-upper-left')?.lastUsedLabel).toBe(
      'Last used 1 day ago',
    );
  });
});
