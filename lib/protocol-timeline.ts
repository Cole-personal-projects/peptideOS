import { formatDose } from './dose-helpers';
import { getVialRunoutForecast } from './inventory-metrics';
import type { AppData, Compound, Dose, Schedule, ScheduleLog, SignalCheckIn, Stack, Vial } from './types';

export type ProtocolTimelineEventKind = 'due-dose' | 'dose-log' | 'inventory' | 'signal';

export interface ProtocolTimelineEvent {
  id: string;
  kind: ProtocolTimelineEventKind;
  occurredAt: string;
  status: string;
  compoundId: string;
  stackId?: string;
  label: string;
  detail: string;
  href?: string;
}

export interface ProtocolCockpitSummary {
  dueCount: number;
  overdueCount: number;
  completedTodayCount: number;
  skippedOrMissedCount: number;
  activeStackCount: number;
  inventoryRiskCount: number;
  latestSignal?: ProtocolTimelineEvent;
  events: ProtocolTimelineEvent[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function getDayBounds(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function compoundName(compounds: Compound[], compoundId: string) {
  return compounds.find((compound) => compound.id === compoundId)?.name ?? compoundId;
}

function stackName(stacks: Stack[], stackId: string | undefined) {
  if (!stackId) return null;
  return stacks.find((stack) => stack.id === stackId)?.name ?? null;
}

function scheduleForLog(schedules: Schedule[], log: ScheduleLog) {
  return schedules.find((schedule) => schedule.id === log.scheduleId);
}

function isSameDay(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date < end;
}

function buildScheduleLogEvent(data: AppData, log: ScheduleLog, now: Date): ProtocolTimelineEvent {
  const schedule = scheduleForLog(data.schedules, log);
  const doseLabel = schedule ? formatDose(schedule.doseValue, schedule.doseUnit) : 'Scheduled dose';
  const name = compoundName(data.compounds, log.peptideId);
  const parentStackName = stackName(data.stacks, log.stackId);
  const dueTime = formatTime(log.dueAt);
  const isOverdue = log.status === 'pending' && new Date(log.dueAt).getTime() < now.getTime();
  const status = isOverdue ? 'overdue' : log.status;

  return {
    id: `schedule-log:${log.id}`,
    kind: 'due-dose',
    occurredAt: log.takenAt ?? log.skippedAt ?? log.missedAt ?? log.dueAt,
    status,
    compoundId: log.peptideId,
    stackId: log.stackId,
    label: `${name} ${doseLabel}`,
    detail: `${parentStackName ? `${parentStackName} · ` : ''}Due ${dueTime}`,
    href: '/log',
  };
}

function buildDoseEvent(data: AppData, dose: Dose): ProtocolTimelineEvent {
  const name = compoundName(data.compounds, dose.peptideId);

  return {
    id: `dose:${dose.id}`,
    kind: 'dose-log',
    occurredAt: dose.dateTime,
    status: dose.completed ? 'completed' : 'planned',
    compoundId: dose.peptideId,
    label: `${name} ${formatDose(dose.doseValue, dose.doseUnit)}`,
    detail: `${dose.completed ? 'Logged' : 'Planned'} ${formatTime(dose.dateTime)}${dose.site ? ` · ${dose.site.replace(/-/g, ' ')}` : ''}`,
    href: '/log',
  };
}

function buildInventoryEvent(data: AppData, vial: Vial, now: Date): ProtocolTimelineEvent | null {
  const forecast = getVialRunoutForecast({
    vial,
    doses: data.doses,
    schedules: data.schedules,
    scheduleLogs: data.scheduleLogs,
    now,
  });
  const expiresAt = new Date(vial.expirationDate);
  const expiresInDays = Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS);
  const isExpiring = expiresInDays <= 14;
  const isRisk = forecast.status === 'runout' || forecast.isLowStock || isExpiring;

  if (!isRisk) return null;

  const name = compoundName(data.compounds, vial.peptideId);
  const status = forecast.status === 'runout' ? 'runout'
    : forecast.isLowStock ? 'low-stock'
      : expiresInDays <= 0 ? 'expired'
        : 'expiring';
  const detail = forecast.status === 'runout' || forecast.isLowStock
    ? forecast.label
    : expiresInDays <= 0 ? 'Container expired' : `Expires in ${expiresInDays} days`;

  return {
    id: `inventory:${vial.id}`,
    kind: 'inventory',
    occurredAt: forecast.runoutAt ?? vial.expirationDate,
    status,
    compoundId: vial.peptideId,
    label: name,
    detail,
    href: '/more/inventory',
  };
}

function buildSignalEvent(signal: SignalCheckIn): ProtocolTimelineEvent {
  return {
    id: `signal:${signal.id}`,
    kind: 'signal',
    occurredAt: signal.checkedAt,
    status: 'logged',
    compoundId: 'signals',
    label: 'Signal check-in',
    detail: `Energy ${signal.energy}/10 · Sleep ${signal.sleepHours}h${signal.notes ? ` · ${signal.notes}` : ''}`,
    href: '/more/signals',
  };
}

export function buildProtocolCockpitSummary(data: AppData, now = new Date()): ProtocolCockpitSummary {
  const { start, end } = getDayBounds(now);
  const relevantLogs = data.scheduleLogs
    .filter((log) => log.status === 'pending' || isSameDay(log.takenAt ?? log.skippedAt ?? log.missedAt ?? log.dueAt, start, end))
    .map((log) => buildScheduleLogEvent(data, log, now));
  const todaysDoseEvents = data.doses
    .filter((dose) => isSameDay(dose.dateTime, start, end))
    .map((dose) => buildDoseEvent(data, dose));
  const inventoryEvents = data.vials
    .filter((vial) => vial.status === 'active')
    .map((vial) => buildInventoryEvent(data, vial, now))
    .filter((event): event is ProtocolTimelineEvent => Boolean(event));
  const signalEvents = data.signalCheckIns
    .slice()
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
    .slice(0, 3)
    .map(buildSignalEvent);
  const events = [...relevantLogs, ...todaysDoseEvents, ...inventoryEvents, ...signalEvents]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  return {
    dueCount: relevantLogs.filter((event) => event.status === 'pending' || event.status === 'overdue').length,
    overdueCount: relevantLogs.filter((event) => event.status === 'overdue').length,
    completedTodayCount: relevantLogs.filter((event) => event.status === 'taken').length
      + todaysDoseEvents.filter((event) => event.status === 'completed').length,
    skippedOrMissedCount: relevantLogs.filter((event) => event.status === 'skipped' || event.status === 'missed').length,
    activeStackCount: data.stacks.filter((stack) => stack.status === 'active').length,
    inventoryRiskCount: inventoryEvents.length,
    latestSignal: signalEvents[0],
    events,
  };
}
