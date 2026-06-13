import type { AppData, Dose, Schedule, ScheduleLog, SiteCode } from './types';

export type DueDoseState = 'overdue' | 'due' | 'upcoming';

export interface DueDoseInboxItem {
  log: ScheduleLog;
  schedule: Schedule;
  state: DueDoseState;
}

export interface DueDoseCompletion {
  vialId: string;
  site: SiteCode | '';
  notes: string;
}

function dayStart(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayEnd(date: Date): Date {
  const next = dayStart(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function findPendingLog(data: AppData, logId: string) {
  const log = data.scheduleLogs.find((candidate) => candidate.id === logId);
  if (!log || log.status !== 'pending') return null;

  const schedule = data.schedules.find((candidate) => candidate.id === log.scheduleId);
  if (!schedule) return null;

  return { log, schedule };
}

export function buildDueDoseInbox(data: AppData, now = new Date()): DueDoseInboxItem[] {
  const start = dayStart(now);
  const end = dayEnd(now);
  const schedulesById = new Map(data.schedules.map((schedule) => [schedule.id, schedule]));

  return data.scheduleLogs
    .filter((log) => log.status === 'pending')
    .filter((log) => {
      const dueAt = new Date(log.dueAt);
      return dueAt < start || (dueAt >= start && dueAt < end);
    })
    .map((log) => {
      const schedule = schedulesById.get(log.scheduleId);
      if (!schedule) return null;

      const dueAt = new Date(log.dueAt);
      const state: DueDoseState = dueAt < start ? 'overdue' : dueAt <= now ? 'due' : 'upcoming';
      return { log, schedule, state };
    })
    .filter((item): item is DueDoseInboxItem => item !== null)
    .sort((a, b) => new Date(a.log.dueAt).getTime() - new Date(b.log.dueAt).getTime());
}

export function markOverdueScheduleLogsMissed(data: AppData, now = new Date(), graceHours = 24): AppData {
  const missedBefore = new Date(now.getTime() - graceHours * 60 * 60 * 1000);
  let changed = false;
  const missedAt = now.toISOString();

  const scheduleLogs = data.scheduleLogs.map((log) => {
    if (log.status !== 'pending' || new Date(log.dueAt) > missedBefore) {
      return log;
    }

    changed = true;
    return { ...log, status: 'missed' as const, missedAt };
  });

  return changed ? { ...data, scheduleLogs } : data;
}

export function completeDueDose(
  data: AppData,
  logId: string,
  completion: DueDoseCompletion,
  completedAt = new Date(),
): AppData {
  const match = findPendingLog(data, logId);
  if (!match) return data;

  const now = completedAt.toISOString();
  const doseId = `dose-${match.log.id}`;
  const newDose: Dose = {
    id: doseId,
    scheduleLogId: match.log.id,
    peptideId: match.schedule.peptideId,
    vialId: completion.vialId,
    dateTime: now,
    doseValue: match.schedule.doseValue,
    doseUnit: match.schedule.doseUnit,
    route: match.schedule.route,
    site: completion.site,
    notes: completion.notes,
    completed: true,
  };

  return {
    ...data,
    doses: [...data.doses, newDose],
    scheduleLogs: data.scheduleLogs.map((log) => log.id === logId
      ? { ...log, status: 'taken', doseId, takenAt: now }
      : log),
  };
}

export function skipDueDose(data: AppData, logId: string, skippedAt = new Date()): AppData {
  const match = findPendingLog(data, logId);
  if (!match) return data;

  return {
    ...data,
    scheduleLogs: data.scheduleLogs.map((log) => log.id === logId
      ? { ...log, status: 'skipped', skippedAt: skippedAt.toISOString() }
      : log),
  };
}
