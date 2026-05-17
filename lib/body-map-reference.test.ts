import { describe, expect, it } from 'vitest';
import {
  BODY_HIT_TARGETS,
  BODY_SITES,
  BODY_TEMPLATES,
  BODY_ZONES,
  getBodyTemplate,
  getBodyZones,
  SITE_ROUTE_COMPAT,
} from './body-map-reference';
import { INJECTION_ZONES } from './injection-zones';
import type { SiteCode } from './types';

describe('body map reference data', () => {
  it('defines the expected MVP templates', () => {
    expect(BODY_TEMPLATES.map((template) => template.id).sort()).toEqual([
      'female-back',
      'female-front',
      'male-back',
      'male-front',
    ]);
    expect(getBodyTemplate('male', 'front')).toMatchObject({
      id: 'male-front',
      viewBox: '0 0 724 1448',
    });
  });

  it('keeps all body sites aligned with canonical SiteCode values', () => {
    const canonicalSiteCodes = new Set<SiteCode>(INJECTION_ZONES.map((zone) => zone.id));
    const bodySiteCodes = new Set<SiteCode>(BODY_SITES.map((site) => site.siteCode));

    expect(bodySiteCodes).toEqual(canonicalSiteCodes);
  });

  it('maps every visible zone to a site and exactly one hit target', () => {
    const bodySiteCodes = new Set(BODY_SITES.map((site) => site.siteCode));
    const hitTargetZoneIds = BODY_HIT_TARGETS.map((target) => target.zoneId);
    const templateSitePairs = BODY_ZONES.map((zone) => `${zone.templateId}__${zone.siteCode}`);

    for (const zone of BODY_ZONES) {
      expect(bodySiteCodes.has(zone.siteCode)).toBe(true);
      expect(hitTargetZoneIds.filter((zoneId) => zoneId === zone.id)).toHaveLength(1);
    }
    expect(new Set(templateSitePairs).size).toBe(templateSitePairs.length);
  });

  it('enforces minimum tap target metadata', () => {
    expect(BODY_HIT_TARGETS.every((target) => target.minTapPx >= 44)).toBe(true);
  });

  it('keeps route compatibility explicit for every site', () => {
    const compatibilitySiteCodes = new Set(SITE_ROUTE_COMPAT.map((entry) => entry.siteCode));

    for (const site of BODY_SITES) {
      expect(compatibilitySiteCodes.has(site.siteCode)).toBe(true);
    }
    expect(SITE_ROUTE_COMPAT.filter((entry) => !entry.allowed).every((entry) => entry.cautionLevel === 'restricted')).toBe(
      true,
    );
  });

  it('returns template-specific zones only for the requested view', () => {
    expect(getBodyZones('male-front').map((zone) => zone.siteCode)).toContain('abdomen-upper-left');
    expect(getBodyZones('male-front').map((zone) => zone.siteCode)).not.toContain('glute-upper-outer-left');
    expect(getBodyZones('female-back').map((zone) => zone.siteCode)).toContain('glute-upper-outer-left');
  });

  it('keeps male back overlay zones within anatomical envelopes', () => {
    expectZoneBounds('male-back', 'glute-upper-outer-left', { minX: 1000, maxX: 1085, minY: 675, maxY: 805 });
    expectZoneBounds('male-back', 'glute-upper-outer-right', { minX: 1085, maxX: 1165, minY: 675, maxY: 805 });
    expectZoneBounds('male-back', 'lower-back-left', { minX: 1000, maxX: 1085, minY: 440, maxY: 590 });
    expectZoneBounds('male-back', 'lower-back-right', { minX: 1085, maxX: 1155, minY: 440, maxY: 590 });
  });
});

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function expectZoneBounds(templateId: 'male-back', siteCode: SiteCode, bounds: Bounds) {
  const zone = getBodyZones(templateId).find((candidate) => candidate.siteCode === siteCode);
  expect(zone).toBeDefined();

  const actual = getPathBounds(zone!.pathData);

  expect(actual.minX).toBeGreaterThanOrEqual(bounds.minX);
  expect(actual.maxX).toBeLessThanOrEqual(bounds.maxX);
  expect(actual.minY).toBeGreaterThanOrEqual(bounds.minY);
  expect(actual.maxY).toBeLessThanOrEqual(bounds.maxY);
}

function getPathBounds(pathData: string): Bounds {
  const values = [...pathData.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  const xs = values.filter((_, index) => index % 2 === 0);
  const ys = values.filter((_, index) => index % 2 === 1);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
