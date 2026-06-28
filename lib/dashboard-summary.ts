import type { AppData, Dose, ScheduleLogStatus } from './types';

export interface DashboardBriefing {
  scheduledToday: number;
  completedToday: number;
  pendingToday: number;
  activeStacks: number;
  activeVials: number;
  completionPercent: number;
}

export type AdherenceLevel = 'none' | 'low' | 'medium' | 'high';
export type AdherenceDayStatus = 'empty' | 'completed' | 'mixed' | 'missed' | 'skipped' | 'pending';

export interface AdherenceDay {
  dateKey: string;
  label: string;
  scheduledCount: number;
  completedCount: number;
  skippedCount: number;
  missedCount: number;
  pendingCount: number;
  standaloneCompletedCount: number;
  delayedCount: number;
  level: AdherenceLevel;
  status: AdherenceDayStatus;
}

export interface AdherenceSummary {
  days: AdherenceDay[];
  scheduledCount: number;
  completedCount: number;
  skippedCount: number;
  missedCount: number;
  delayedCount: number;
  completionPercent: number | null;
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

function getAdherenceStatus(day: Omit<AdherenceDay, 'status' | 'level'>): AdherenceDayStatus {
  if (day.scheduledCount === 0 && day.standaloneCompletedCount === 0) return 'empty';
  if (day.missedCount > 0 && day.completedCount > 0) return 'mixed';
  if (day.missedCount > 0) return 'missed';
  if (day.skippedCount > 0 && day.completedCount === 0) return 'skipped';
  if (day.pendingCount > 0 && day.completedCount === 0) return 'pending';
  return 'completed';
}

export function buildDashboardBriefing(data: AppData, now = new Date()): DashboardBriefing {
  const { start, end } = getDayBounds(now);
  const standaloneDoses = data.doses
    .filter((dose) => !dose.scheduleLogId)
    .filter((dose) => {
      const doseDate = new Date(dose.dateTime);
      return doseDate >= start && doseDate < end;
    });
  const todaysScheduleLogs = data.scheduleLogs.filter((log) => {
    const dueDate = new Date(log.dueAt);
    return dueDate >= start && dueDate < end;
  });
  const completedToday =
    todaysScheduleLogs.filter((log) => log.status === 'taken' || log.status === 'skipped').length +
    standaloneDoses.filter((dose) => dose.completed).length;
  const scheduledToday = todaysScheduleLogs.length + standaloneDoses.length;

  return {
    scheduledToday,
    completedToday,
    pendingToday: scheduledToday - completedToday,
    activeStacks: data.stacks.filter((stack) => stack.status === 'active').length,
    activeVials: data.vials.filter((vial) => vial.status === 'active').length,
    completionPercent: scheduledToday === 0 ? 0 : Math.round((completedToday / scheduledToday) * 100),
  };
}

export function buildAdherenceGrid(doses: Dose[], now = new Date(), days = 14): AdherenceDay[] {
  return buildAdherenceSummary(
    {
      peptides: [],
      compounds: [],
      vials: [],
      inventoryBatches: [],
      doses,
      stacks: [],
      schedules: [],
      scheduleLogs: [],
      reconstitutionCalculations: [],
      signalCheckIns: [],
      labReports: [],
      labResults: [],
      labImportAudits: [],
      hasSeenDisclaimer: true,
      hasCompletedOnboarding: true,
      userMode: 'beginner',
      biometricLock: false,
      darkMode: true,
    },
    now,
    days,
  ).days;
}

export function buildAdherenceSummary(data: AppData, now = new Date(), days = 14): AdherenceSummary {
  const completedDoseByLogId = new Map(data.doses.filter((dose) => dose.scheduleLogId && dose.completed).map((dose) => [dose.scheduleLogId!, dose]));
  const totals = {
    scheduledCount: 0,
    completedCount: 0,
    skippedCount: 0,
    missedCount: 0,
    delayedCount: 0,
  };
  const daysOut: AdherenceDay[] = [];

  for (let index = days - 1; index >= 0; index--) {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    const { start, end } = getDayBounds(date);
    const dateKey = getDateKey(start);
    const dayLogs = data.scheduleLogs.filter((log) => {
      const dueAt = new Date(log.dueAt);
      return dueAt >= start && dueAt < end;
    });
    const standaloneCompletedCount = data.doses.filter((dose) => {
      if (dose.scheduleLogId || !dose.completed) return false;
      const doseDate = new Date(dose.dateTime);
      return doseDate >= start && doseDate < end;
    }).length;

    const counts: Record<ScheduleLogStatus, number> = {
      pending: 0,
      taken: 0,
      skipped: 0,
      missed: 0,
    };
    let delayedCount = 0;

    for (const log of dayLogs) {
      counts[log.status]++;
      if (log.status === 'taken') {
        const completedDose = completedDoseByLogId.get(log.id);
        const completedAt = completedDose?.dateTime ?? log.takenAt;
        if (completedAt && new Date(completedAt).getTime() > new Date(log.dueAt).getTime() + 60 * 60 * 1000) {
          delayedCount++;
        }
      }
    }

    const dayBase = {
      dateKey,
      label: index === 0 ? 'Today' : start.toLocaleDateString('en-US', { weekday: 'short' }),
      scheduledCount: dayLogs.length,
      completedCount: counts.taken,
      skippedCount: counts.skipped,
      missedCount: counts.missed,
      pendingCount: counts.pending,
      standaloneCompletedCount,
      delayedCount,
    };
    const completedCount = dayBase.completedCount + standaloneCompletedCount;
    const day: AdherenceDay = {
      ...dayBase,
      completedCount,
      level: getAdherenceLevel(completedCount),
      status: getAdherenceStatus({ ...dayBase, completedCount }),
    };

    totals.scheduledCount += day.scheduledCount;
    totals.completedCount += day.completedCount;
    totals.skippedCount += day.skippedCount;
    totals.missedCount += day.missedCount;
    totals.delayedCount += day.delayedCount;
    daysOut.push(day);
  }

  return {
    days: daysOut,
    ...totals,
    completionPercent: totals.scheduledCount === 0 ? null : Math.round((totals.completedCount / totals.scheduledCount) * 100),
  };
}
