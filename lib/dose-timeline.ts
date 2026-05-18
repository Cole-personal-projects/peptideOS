import { formatDose } from './dose-helpers';
import type { Dose } from './types';

export interface DoseTimelineEntry extends Dose {
  doseLabel: string;
  statusLabel: 'Completed' | 'Planned';
  timeLabel: string;
  siteLabel: string;
}

export interface DoseTimelineGroup {
  dateKey: string;
  date: Date;
  dateLabel: string;
  doses: DoseTimelineEntry[];
}

function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatSite(site: string): string {
  return site ? site.replace(/-/g, ' ') : 'No site';
}

export function buildDoseTimelineGroups(doses: Dose[], filterPeptide = 'all'): DoseTimelineGroup[] {
  const filteredDoses = doses
    .filter((dose) => filterPeptide === 'all' || dose.peptideId === filterPeptide)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const groupMap = new Map<string, DoseTimelineEntry[]>();

  filteredDoses.forEach((dose) => {
    const date = new Date(dose.dateTime);
    const dateKey = date.toDateString();
    const entry: DoseTimelineEntry = {
      ...dose,
      doseLabel: formatDose(dose.doseValue, dose.doseUnit),
      statusLabel: dose.completed ? 'Completed' : 'Planned',
      timeLabel: formatTime(dose.dateTime),
      siteLabel: formatSite(dose.site),
    };

    groupMap.set(dateKey, [...(groupMap.get(dateKey) ?? []), entry]);
  });

  return Array.from(groupMap.entries()).map(([dateKey, groupedDoses]) => {
    const date = new Date(groupedDoses[0].dateTime);
    return {
      dateKey,
      date,
      dateLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      doses: groupedDoses,
    };
  });
}
