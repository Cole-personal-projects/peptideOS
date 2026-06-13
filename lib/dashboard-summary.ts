import type { AppData, Dose } from './types';

export interface DashboardBriefing {
  scheduledToday: number;
  completedToday: number;
  pendingToday: number;
  activeStacks: number;
  activeVials: number;
  completionPercent: number;
}

export type AdherenceLevel = 'none' | 'low' | 'medium' | 'high';

export interface AdherenceDay {
  dateKey: string;
  label: string;
  completedCount: number;
  level: AdherenceLevel;
}

function getDayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getAdherenceLevel(completedCount: number): AdherenceLevel {
  if (completedCount === 0) return 'none';
  if (completedCount === 1) return 'low';
  if (completedCount <= 3) return 'medium';
  return 'high';
}

export function buildDashboardBriefing(data: AppData, now = new Date()): DashboardBriefing {
  const { start, end } = getDayBounds(now);
  const standaloneDoses = data.doses.filter((dose) => !dose.scheduleLogId).filter((dose) => {
    const doseDate = new Date(dose.dateTime);
    return doseDate >= start && doseDate < end;
  });
  const todaysScheduleLogs = data.scheduleLogs.filter((log) => {
    const dueDate = new Date(log.dueAt);
    return dueDate >= start && dueDate < end;
  });
  const completedToday = todaysScheduleLogs.filter((log) => log.status === 'taken' || log.status === 'skipped').length
    + standaloneDoses.filter((dose) => dose.completed).length;
  const scheduledToday = todaysScheduleLogs.length + standaloneDoses.length;

  return {
    scheduledToday,
    completedToday,
    pendingToday: scheduledToday - completedToday,
    activeStacks: data.stacks.filter((stack) => stack.status === 'active').length,
    activeVials: data.vials.filter((vial) => vial.status === 'active').length,
    completionPercent: scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 0,
  };
}

export function buildAdherenceGrid(doses: Dose[], now = new Date(), days = 14): AdherenceDay[] {
  const completedByDate = doses.reduce<Record<string, number>>((acc, dose) => {
    if (!dose.completed) return acc;

    const key = getDateKey(new Date(dose.dateTime));
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const dateKey = getDateKey(date);
    const completedCount = completedByDate[dateKey] ?? 0;
    const isToday = index === days - 1;

    return {
      dateKey,
      label: isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      completedCount,
      level: getAdherenceLevel(completedCount),
    };
  });
}
