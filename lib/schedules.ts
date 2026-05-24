import type { Schedule, ScheduleLog, ScheduleRecurrence, Stack, StackPeptide } from './types';

export type SchedulePreset = 'daily' | 'twice-daily' | 'weekly' | 'twice-weekly';

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTimesOfDay(frequency: string, timing: string): string[] {
  const normalized = `${frequency} ${timing}`.toLowerCase();
  if (normalized.includes('2x daily') || normalized.includes('morning and evening')) {
    return ['08:00', '20:00'];
  }

  if (normalized.includes('pre-bed') || normalized.includes('evening')) {
    return ['20:00'];
  }

  return ['08:00'];
}

function getWeekdays(frequency: string, timing: string): number[] | undefined {
  const normalized = `${frequency} ${timing}`.toLowerCase();
  const days: Array<[string, number]> = [
    ['sunday', 0],
    ['monday', 1],
    ['tuesday', 2],
    ['wednesday', 3],
    ['thursday', 4],
    ['friday', 5],
    ['saturday', 6],
  ];
  const selected = days
    .filter(([label]) => normalized.includes(label))
    .map(([, weekday]) => weekday);

  if (selected.length > 0) return selected;
  if (normalized.includes('weekly')) return [1];
  return undefined;
}

export function getDefaultScheduleRecurrence(peptide: Pick<StackPeptide, 'frequency' | 'timing'>): ScheduleRecurrence {
  const frequencyText = peptide.frequency.toLowerCase();
  const timingText = peptide.timing.toLowerCase();
  const isWeekly = frequencyText.includes('weekly') || timingText.includes('monday') || timingText.includes('thursday');

  if (isWeekly) {
    return {
      frequency: 'weekly',
      timesOfDay: getTimesOfDay(peptide.frequency, peptide.timing),
      weekdays: getWeekdays(peptide.frequency, peptide.timing),
    };
  }

  return {
    frequency: 'daily',
    timesOfDay: getTimesOfDay(peptide.frequency, peptide.timing),
  };
}

export function normalizeScheduleRecurrence(recurrence: ScheduleRecurrence): ScheduleRecurrence {
  const timesOfDay = recurrence.timesOfDay.length > 0 ? recurrence.timesOfDay : ['08:00'];

  if (recurrence.frequency === 'weekly') {
    return {
      frequency: 'weekly',
      timesOfDay,
      weekdays: recurrence.weekdays && recurrence.weekdays.length > 0 ? recurrence.weekdays : [1],
    };
  }

  return {
    frequency: 'daily',
    timesOfDay,
  };
}

export function getSchedulePreset(stackPeptide: StackPeptide): SchedulePreset {
  const recurrence = normalizeScheduleRecurrence(stackPeptide.schedule ?? getDefaultScheduleRecurrence(stackPeptide));
  if (recurrence.frequency === 'weekly') {
    return (recurrence.weekdays?.length ?? 0) > 1 ? 'twice-weekly' : 'weekly';
  }

  return recurrence.timesOfDay.length > 1 ? 'twice-daily' : 'daily';
}

export function applySchedulePreset(stackPeptide: StackPeptide, preset: SchedulePreset): StackPeptide {
  if (preset === 'twice-daily') {
    return {
      ...stackPeptide,
      frequency: '2x daily',
      timing: 'Morning and evening',
      schedule: { frequency: 'daily', timesOfDay: ['08:00', '20:00'] },
    };
  }

  if (preset === 'weekly') {
    return {
      ...stackPeptide,
      frequency: 'weekly',
      timing: 'Monday morning',
      schedule: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1] },
    };
  }

  if (preset === 'twice-weekly') {
    return {
      ...stackPeptide,
      frequency: '2x weekly',
      timing: 'Monday and Thursday',
      schedule: { frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1, 4] },
    };
  }

  return {
    ...stackPeptide,
    frequency: 'daily',
    timing: 'Morning',
    schedule: { frequency: 'daily', timesOfDay: ['08:00'] },
  };
}

function formatTime(timeOfDay: string): string {
  const [hours = '0', minutes = '0'] = timeOfDay.split(':');
  return new Date(Date.UTC(2026, 0, 1, Number.parseInt(hours, 10), Number.parseInt(minutes, 10))).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

export function getScheduleSummary(recurrence: ScheduleRecurrence): string {
  const normalized = normalizeScheduleRecurrence(recurrence);
  const timeSummary = normalized.timesOfDay.map(formatTime).join(', ');

  if (normalized.frequency === 'weekly') {
    const days = (normalized.weekdays ?? [1]).map((weekday) => weekdayLabels[weekday] ?? 'Monday').join(', ');
    const cadence = (normalized.weekdays?.length ?? 0) > 1 ? '2x weekly' : 'Weekly';
    return `${cadence} · ${days} · ${timeSummary}`;
  }

  const cadence = normalized.timesOfDay.length > 1 ? '2x daily' : 'Daily';
  return `${cadence} · ${timeSummary}`;
}

export function normalizeStackPeptide(stackId: string, peptide: StackPeptide, index: number): StackPeptide {
  return {
    ...peptide,
    id: peptide.id ?? `${stackId}-item-${peptide.peptideId}-${index}`,
    schedule: normalizeScheduleRecurrence(peptide.schedule ?? getDefaultScheduleRecurrence(peptide)),
  };
}

export function normalizeStack(stack: Stack): Stack {
  return {
    ...stack,
    peptides: stack.peptides.map((peptide, index) => normalizeStackPeptide(stack.id, peptide, index)),
  };
}

export function normalizeStacks(stacks: Stack[]): Stack[] {
  return stacks.map(normalizeStack);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function applyTimeOfDay(date: Date, timeOfDay: string): Date {
  const [hours = '0', minutes = '0'] = timeOfDay.split(':');
  const next = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    Number.parseInt(hours, 10),
    Number.parseInt(minutes, 10),
    0,
    0,
  ));
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getStackEndDate(stack: Stack): string {
  const start = new Date(stack.startDate);
  const end = addDays(start, Math.max(stack.durationDays - 1, 0));
  end.setUTCHours(23, 59, 59, 999);
  return end.toISOString();
}

export function generateScheduleLogs(schedule: Schedule): ScheduleLog[] {
  const logs: ScheduleLog[] = [];
  const start = new Date(schedule.startDate);
  const end = new Date(schedule.endDate);
  const recurrence = normalizeScheduleRecurrence(schedule.recurrence);
  const weekdays = recurrence.weekdays ?? [];

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    if (recurrence.frequency === 'weekly' && !weekdays.includes(cursor.getUTCDay())) {
      continue;
    }

    recurrence.timesOfDay.forEach((timeOfDay) => {
      const dueAt = applyTimeOfDay(cursor, timeOfDay);
      if (dueAt > end) return;

      logs.push({
        id: `${schedule.id}-${dateKey(dueAt)}-${timeOfDay.replace(':', '')}`,
        scheduleId: schedule.id,
        stackId: schedule.stackId,
        stackPeptideId: schedule.stackPeptideId,
        peptideId: schedule.peptideId,
        dueAt: dueAt.toISOString(),
        status: 'pending',
      });
    });
  }

  return logs;
}

export interface ActivateStackSchedulesInput {
  stack: Stack;
  existingSchedules: Schedule[];
  existingScheduleLogs: ScheduleLog[];
}

export interface ActivateStackSchedulesResult {
  stack: Stack;
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
}

export function activateStackSchedules(input: ActivateStackSchedulesInput): ActivateStackSchedulesResult {
  const stack = normalizeStack(input.stack);
  const endDate = getStackEndDate(stack);
  const schedulesByItemId = new Map(
    input.existingSchedules
      .filter((schedule) => schedule.stackId === stack.id)
      .map((schedule) => [schedule.stackPeptideId, schedule]),
  );
  const logsById = new Map(input.existingScheduleLogs.map((log) => [log.id, log]));
  const nextSchedules = [...input.existingSchedules];
  const nextScheduleLogs = [...input.existingScheduleLogs];

  stack.peptides.forEach((peptide) => {
    const stackPeptideId = peptide.id!;
    let schedule = schedulesByItemId.get(stackPeptideId);

    if (!schedule) {
      schedule = {
        id: `${stack.id}-schedule-${stackPeptideId}`,
        stackId: stack.id,
        stackPeptideId,
        peptideId: peptide.peptideId,
        doseValue: peptide.doseValue,
        doseUnit: peptide.doseUnit,
        route: peptide.route,
        recurrence: normalizeScheduleRecurrence(peptide.schedule ?? getDefaultScheduleRecurrence(peptide)),
        startDate: stack.startDate,
        endDate,
        status: 'active',
      };
      schedulesByItemId.set(stackPeptideId, schedule);
      nextSchedules.push(schedule);
    }

    generateScheduleLogs(schedule).forEach((log) => {
      if (logsById.has(log.id)) return;
      logsById.set(log.id, log);
      nextScheduleLogs.push(log);
    });
  });

  return {
    stack: { ...stack, status: 'active' },
    schedules: nextSchedules,
    scheduleLogs: nextScheduleLogs,
  };
}

export interface UpdateStackPeptideScheduleInput {
  stack: Stack;
  stackPeptideId: string;
  preset: SchedulePreset;
  existingSchedules: Schedule[];
  existingScheduleLogs: ScheduleLog[];
}

export function updateStackPeptideSchedule(input: UpdateStackPeptideScheduleInput): ActivateStackSchedulesResult {
  const normalizedStack = normalizeStack(input.stack);
  const stackPeptide = normalizedStack.peptides.find((peptide) => peptide.id === input.stackPeptideId);
  if (!stackPeptide) {
    return {
      stack: normalizedStack,
      schedules: input.existingSchedules,
      scheduleLogs: input.existingScheduleLogs,
    };
  }

  const updatedPeptide = applySchedulePreset(stackPeptide, input.preset);
  const stack = {
    ...normalizedStack,
    peptides: normalizedStack.peptides.map((peptide) => peptide.id === input.stackPeptideId ? updatedPeptide : peptide),
  };
  const endDate = getStackEndDate(stack);
  const scheduleId = `${stack.id}-schedule-${input.stackPeptideId}`;
  const previousSchedule = input.existingSchedules.find((schedule) => (
    schedule.stackId === stack.id && schedule.stackPeptideId === input.stackPeptideId
  ));
  const nextSchedule: Schedule = {
    id: previousSchedule?.id ?? scheduleId,
    stackId: stack.id,
    stackPeptideId: input.stackPeptideId,
    peptideId: updatedPeptide.peptideId,
    doseValue: updatedPeptide.doseValue,
    doseUnit: updatedPeptide.doseUnit,
    route: updatedPeptide.route,
    recurrence: normalizeScheduleRecurrence(updatedPeptide.schedule ?? getDefaultScheduleRecurrence(updatedPeptide)),
    startDate: stack.startDate,
    endDate,
    status: previousSchedule?.status ?? 'active',
  };
  const preservedLogs = input.existingScheduleLogs.filter((log) => (
    log.scheduleId !== nextSchedule.id || log.status !== 'pending'
  ));
  const preservedIds = new Set(preservedLogs.map((log) => log.id));
  const regeneratedLogs = generateScheduleLogs(nextSchedule).filter((log) => !preservedIds.has(log.id));

  return {
    stack,
    schedules: [
      ...input.existingSchedules.filter((schedule) => schedule.id !== nextSchedule.id),
      nextSchedule,
    ],
    scheduleLogs: [...preservedLogs, ...regeneratedLogs],
  };
}
