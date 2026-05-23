import type { Schedule, ScheduleLog, ScheduleRecurrence, Stack, StackPeptide } from './types';

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

export function normalizeStackPeptide(stackId: string, peptide: StackPeptide, index: number): StackPeptide {
  return {
    ...peptide,
    id: peptide.id ?? `${stackId}-item-${peptide.peptideId}-${index}`,
    schedule: peptide.schedule ?? getDefaultScheduleRecurrence(peptide),
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
  const weekdays = schedule.recurrence.weekdays ?? [];

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    if (schedule.recurrence.frequency === 'weekly' && !weekdays.includes(cursor.getUTCDay())) {
      continue;
    }

    schedule.recurrence.timesOfDay.forEach((timeOfDay) => {
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
        recurrence: peptide.schedule ?? getDefaultScheduleRecurrence(peptide),
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
