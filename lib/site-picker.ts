import {
  getSuggestedZone,
  getZoneDoseHistory,
  getZoneStats,
  INJECTION_ZONES,
} from './injection-zones';
import type { Dose, Route, SiteCode } from './types';

export type SitePickerMode = 'recency' | 'heatmap';
export type SitePickerView = 'front' | 'back';
export type SitePickerTone =
  | 'fresh'
  | 'moderate'
  | 'recent'
  | 'avoid'
  | 'incompatible'
  | 'heat-0'
  | 'heat-low'
  | 'heat-medium'
  | 'heat-high'
  | 'heat-max';

export interface SitePickerZone {
  id: SiteCode;
  label: string;
  bodyPart: string;
  compatible: boolean;
  selected: boolean;
  suggested: boolean;
  recencyLevel: 'fresh' | 'moderate' | 'recent' | 'avoid' | 'incompatible';
  daysSinceUse: number | null;
  dosesLast30Days: number;
  tone: SitePickerTone;
}

interface SitePickerZoneOptions {
  doses: Dose[];
  route: Route;
  selectedSite: SiteCode | '';
  view: SitePickerView;
  mode: SitePickerMode;
}

export interface SelectedZoneSummary {
  site: SiteCode;
  label: string;
  lastUsedLabel: string;
  dosesLast30Days: number;
  history: Dose[];
}

function getHeatTone(dosesLast30Days: number): SitePickerTone {
  if (dosesLast30Days === 0) return 'heat-0';
  if (dosesLast30Days <= 2) return 'heat-low';
  if (dosesLast30Days <= 5) return 'heat-medium';
  if (dosesLast30Days <= 10) return 'heat-high';
  return 'heat-max';
}

function formatLastUsed(daysSinceUse: number | null): string {
  if (daysSinceUse === null) return 'Never used';
  if (daysSinceUse < 1) return 'Last used today';
  if (daysSinceUse === 1) return 'Last used 1 day ago';
  return `Last used ${daysSinceUse} days ago`;
}

export function getSitePickerZones({
  doses,
  route,
  selectedSite,
  view,
  mode,
}: SitePickerZoneOptions): SitePickerZone[] {
  const suggestedSite = getSuggestedZone(doses, route);

  return INJECTION_ZONES
    .filter((zone) => zone.view === view)
    .map((zone) => {
      const stats = getZoneStats(doses, zone.id);
      const compatible = zone.routes.includes(route);
      const recencyLevel = compatible ? stats.recencyLevel : 'incompatible';
      const tone = compatible
        ? mode === 'heatmap'
          ? getHeatTone(stats.dosesLast30Days)
          : recencyLevel
        : 'incompatible';

      return {
        id: zone.id,
        label: zone.label,
        bodyPart: zone.bodyPart,
        compatible,
        selected: selectedSite === zone.id,
        suggested: suggestedSite === zone.id,
        recencyLevel,
        daysSinceUse: stats.daysSinceUse,
        dosesLast30Days: stats.dosesLast30Days,
        tone,
      };
    });
}

export function getSelectedZoneSummary(doses: Dose[], site: SiteCode | ''): SelectedZoneSummary | null {
  if (!site) return null;

  const zone = INJECTION_ZONES.find((candidate) => candidate.id === site);
  if (!zone) return null;

  const stats = getZoneStats(doses, site);

  return {
    site,
    label: zone.label,
    lastUsedLabel: formatLastUsed(stats.daysSinceUse),
    dosesLast30Days: stats.dosesLast30Days,
    history: getZoneDoseHistory(doses, site),
  };
}
