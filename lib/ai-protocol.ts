import { z } from 'zod/v4';
import { normalizeScheduleRecurrence } from './schedules';
import type { DoseUnit, Route, ScheduleRecurrence, Stack, StackPeptide } from './types';

// Compound info the client sends to the parse endpoint so the model can only
// reference compounds the user can actually track.
export interface ProtocolCompoundInput {
  id: string;
  name: string;
  defaultRoute: Route;
  supportedRoutes: Route[];
  defaultDoseUnit: DoseUnit;
}

export const parsedProtocolItemSchema = z.object({
  compoundId: z
    .string()
    .nullable()
    .describe('The id of the matching compound from the provided list, or null if no compound in the list matches.'),
  compoundName: z.string().describe('The compound name exactly as the user wrote it.'),
  doseValue: z
    .number()
    .nullable()
    .describe('Dose amount per administration as stated by the user, or null if the user did not specify a dose. Never invent a dose.'),
  doseUnit: z.enum(['mcg', 'mg', 'iu']).describe('Dose unit. Use the compound default unit when the user did not specify one.'),
  route: z
    .enum(['subq', 'im', 'intranasal', 'oral', 'topical'])
    .describe('Administration route. Use the compound default route when the user did not specify one.'),
  frequency: z.enum(['daily', 'weekly', 'interval', 'cycle']).describe('daily = every day; weekly = only on specific weekdays; interval = every N days; cycle = N days on followed by N days off.'),
  timesOfDay: z
    .array(z.string())
    .describe('Times of administration in 24-hour HH:MM format, e.g. ["08:00", "20:00"]. Morning = 08:00, midday = 12:00, evening/before bed = 20:00.'),
  weekdays: z
    .array(z.number())
    .nullable()
    .describe('For weekly frequency only: weekdays as numbers, 0 = Sunday through 6 = Saturday. Null for daily frequency.'),
  intervalDays: z
    .number()
    .nullable()
    .optional()
    .describe('For interval frequency only: dose every N days, e.g. every other day = 2. Null otherwise.'),
  cycleOnDays: z
    .number()
    .nullable()
    .optional()
    .describe('For cycle frequency only: number of consecutive dosing days, e.g. 5 days on = 5. Null otherwise.'),
  cycleOffDays: z
    .number()
    .nullable()
    .optional()
    .describe('For cycle frequency only: number of consecutive rest days, e.g. 2 days off = 2. Null otherwise.'),
  notes: z.string().nullable().describe('Anything the user said about this compound that does not fit the fields above, or null.'),
});

export const parsedProtocolSchema = z.object({
  stackName: z.string().describe('A short descriptive name for this protocol, e.g. "Healing Protocol".'),
  description: z.string().describe('One-sentence summary of the protocol purpose, based only on what the user said.'),
  durationDays: z
    .number()
    .nullable()
    .describe('Protocol duration in days if the user stated one (e.g. "8 weeks" = 56), otherwise null.'),
  items: z.array(parsedProtocolItemSchema).describe('One entry per compound in the protocol.'),
  warnings: z
    .array(z.string())
    .describe('Parsing ambiguities only (e.g. "Dose for X was not specified"). Never include dosing advice or recommendations.'),
});

export type ParsedProtocol = z.infer<typeof parsedProtocolSchema>;
export type ParsedProtocolItem = z.infer<typeof parsedProtocolItemSchema>;

export const DEFAULT_STACK_DURATION_DAYS = 28;
export const MAX_STACK_DURATION_DAYS = 365;

export function buildProtocolSystemPrompt(compounds: ProtocolCompoundInput[]): string {
  const compoundList = compounds
    .map((compound) => (
      `- id: ${compound.id} | name: ${compound.name} | default route: ${compound.defaultRoute} | supported routes: ${compound.supportedRoutes.join(', ')} | default unit: ${compound.defaultDoseUnit}`
    ))
    .join('\n');

  return [
    'You convert a user\'s natural-language description of a peptide/compound protocol into a structured dosing schedule for a personal tracking app.',
    '',
    'Rules:',
    '- This is a logging tool, not a medical advisor. Only structure what the user explicitly stated. Never invent, adjust, or recommend doses, frequencies, or compounds.',
    '- If the user did not state a dose for a compound, set doseValue to null and add a warning.',
    '- Match each mentioned compound against the list below and set compoundId to the matching id. Match aliases and common abbreviations (e.g. "tirz" = tirzepatide, "sema" = semaglutide). If nothing matches, set compoundId to null.',
    '- Times of day must be 24-hour HH:MM strings. If the user gave no timing, default to ["08:00"].',
    '- "Twice daily" or "morning and evening" means timesOfDay ["08:00", "20:00"] with frequency daily.',
    '- "Before bed", "at night", or "evening" means ["20:00"].',
    '- "Weekdays only" means frequency weekly with weekdays [1, 2, 3, 4, 5].',
    '- "Every other day" means frequency interval with intervalDays 2. "Every 3 days" means intervalDays 3.',
    '- "5 days on 2 days off" means frequency cycle with cycleOnDays 5 and cycleOffDays 2.',
    '- Durations: convert weeks/months to days (1 week = 7, 1 month = 30). If no duration is stated, set durationDays to null.',
    '- warnings is for parsing ambiguities only — never advice.',
    '',
    'Available compounds:',
    compoundList,
  ].join('\n');
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function matchCompoundId(name: string, compounds: ProtocolCompoundInput[]): string | null {
  const key = normalizeKey(name);
  if (!key) return null;

  const exact = compounds.find((compound) => normalizeKey(compound.name) === key || normalizeKey(compound.id) === key);
  if (exact) return exact.id;

  const partial = compounds.find((compound) => {
    const compoundKey = normalizeKey(compound.name);
    return compoundKey.includes(key) || key.includes(compoundKey);
  });
  return partial?.id ?? null;
}

export function normalizeTimeOfDay(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function toRecurrence(item: ParsedProtocolItem): ScheduleRecurrence {
  const timesOfDay = Array.from(new Set(
    item.timesOfDay
      .map(normalizeTimeOfDay)
      .filter((time): time is string => time !== null),
  )).sort();

  if (item.frequency === 'weekly') {
    const weekdays = Array.from(new Set(
      (item.weekdays ?? []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    )).sort((a, b) => a - b);
    return normalizeScheduleRecurrence({ frequency: 'weekly', timesOfDay, weekdays });
  }

  if (item.frequency === 'interval') {
    return normalizeScheduleRecurrence({
      frequency: 'interval',
      timesOfDay,
      intervalDays: item.intervalDays ?? undefined,
    });
  }

  if (item.frequency === 'cycle') {
    return normalizeScheduleRecurrence({
      frequency: 'cycle',
      timesOfDay,
      cycleOnDays: item.cycleOnDays ?? undefined,
      cycleOffDays: item.cycleOffDays ?? undefined,
    });
  }

  return normalizeScheduleRecurrence({ frequency: 'daily', timesOfDay });
}

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function describeFrequency(recurrence: ScheduleRecurrence): string {
  if (recurrence.frequency === 'interval') {
    const interval = recurrence.intervalDays ?? 2;
    return interval === 1 ? 'daily' : `every ${interval} days`;
  }
  if (recurrence.frequency === 'cycle') {
    return `${recurrence.cycleOnDays ?? 5} days on / ${recurrence.cycleOffDays ?? 2} days off`;
  }
  if (recurrence.frequency === 'weekly') {
    const count = recurrence.weekdays?.length ?? 1;
    return count > 1 ? `${count}x weekly` : 'weekly';
  }
  return recurrence.timesOfDay.length > 1 ? `${recurrence.timesOfDay.length}x daily` : 'daily';
}

function describeTiming(recurrence: ScheduleRecurrence): string {
  if (recurrence.frequency === 'weekly') {
    return (recurrence.weekdays ?? [1]).map((day) => weekdayLabels[day] ?? 'Monday').join(' and ');
  }
  if (recurrence.timesOfDay.length > 1) return 'Morning and evening';
  return recurrence.timesOfDay[0] >= '17:00' ? 'Evening' : 'Morning';
}

function defaultDoseValue(unit: DoseUnit): number {
  if (unit === 'mg') return 1;
  if (unit === 'iu') return 2;
  return 250;
}

export interface StackDraftResult {
  draft: Omit<Stack, 'id'> | null;
  unmatchedCompounds: string[];
  issues: string[];
}

export function parsedProtocolToStackDraft(
  parsed: ParsedProtocol,
  compounds: ProtocolCompoundInput[],
): StackDraftResult {
  const compoundsById = new Map(compounds.map((compound) => [compound.id, compound]));
  const unmatchedCompounds: string[] = [];
  const issues = [...parsed.warnings];
  const peptides: StackPeptide[] = [];

  parsed.items.forEach((item) => {
    const compoundId = item.compoundId && compoundsById.has(item.compoundId)
      ? item.compoundId
      : matchCompoundId(item.compoundName, compounds);

    if (!compoundId) {
      unmatchedCompounds.push(item.compoundName);
      return;
    }

    const compound = compoundsById.get(compoundId)!;
    const route = compound.supportedRoutes.includes(item.route) ? item.route : compound.defaultRoute;
    if (route !== item.route) {
      issues.push(`${compound.name}: route "${item.route}" is not supported — using ${compound.defaultRoute} instead.`);
    }

    let doseValue = item.doseValue;
    let doseUnit = item.doseUnit;
    if (doseValue === null || !Number.isFinite(doseValue) || doseValue <= 0) {
      doseUnit = compound.defaultDoseUnit;
      doseValue = defaultDoseValue(doseUnit);
      issues.push(`${compound.name}: no dose specified — defaulted to ${doseValue} ${doseUnit}. Review before activating.`);
    }

    const recurrence = toRecurrence(item);
    peptides.push({
      peptideId: compoundId,
      doseValue,
      doseUnit,
      frequency: describeFrequency(recurrence),
      route,
      timing: describeTiming(recurrence),
      schedule: recurrence,
    });
  });

  if (peptides.length === 0) {
    return { draft: null, unmatchedCompounds, issues };
  }

  const durationDays = parsed.durationDays !== null
    && Number.isFinite(parsed.durationDays)
    && parsed.durationDays >= 1
    ? Math.min(Math.round(parsed.durationDays), MAX_STACK_DURATION_DAYS)
    : DEFAULT_STACK_DURATION_DAYS;

  if (parsed.durationDays === null) {
    issues.push(`No duration specified — defaulted to ${DEFAULT_STACK_DURATION_DAYS} days.`);
  }

  return {
    draft: {
      name: parsed.stackName.trim() || 'AI Protocol',
      description: parsed.description.trim(),
      peptides,
      startDate: new Date().toISOString(),
      durationDays,
      status: 'planned',
      notes: '',
    },
    unmatchedCompounds,
    issues,
  };
}
