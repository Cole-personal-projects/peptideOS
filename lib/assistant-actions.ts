import type { NewVialInput } from './vial-create';
import { buildProtocolCockpitSummary } from './protocol-timeline';
import type { ProtocolTimelineEvent } from './protocol-timeline';
import type { AppData, DoseUnit, InventoryContainerType, Route, ScheduleFrequency, ScheduleRecurrence, SignalCheckIn, Stack } from './types';

export interface ScheduledDoseConfirmationCandidate {
  logId: string;
  compoundId: string;
  compoundName: string;
  stackName: string;
  scheduledAt: string;
  doseLabel: string;
  route: Route;
}

export type AssistantAction =
  | {
      id: string;
      type: 'add_signal_check_in';
      payload: Omit<SignalCheckIn, 'id'>;
    }
  | {
      id: string;
      type: 'create_stack_from_protocol';
      payload: Omit<Stack, 'id'>;
    }
| {
  id: string;
  type: 'create_inventory_vials';
  payload: NewVialInput;
}
| {
  id: string;
  type: 'confirm_scheduled_dose';
  payload: {
    candidates: ScheduledDoseConfirmationCandidate[];
  };
};

export interface AssistantActionProposal {
  message: string;
  action: AssistantAction | null;
  summaryCards?: AssistantSummaryCard[];
}

export const PEPPI_PROTOCOL_DRAFT_STORAGE_KEY = 'peptideos.peppi.protocolDraft';

export interface AssistantSummaryCard {
  id: string;
  title: string;
  eyebrow?: string;
  body: string;
  href?: string;
  actionLabel?: string;
}

export function isTodayStatusRequest(message: string) {
  return /\b(today|due|overdue|completed|missed|skipped|what did i do|what do i need)\b/i.test(message)
    && /\b(summary|summarize|status|brief|briefing|due|completed|missed|skipped|need|do)\b/i.test(message);
}

export function isScheduledDoseConfirmationRequest(message: string) {
  return /\b(took|taken|did|completed|finished|logged|log|confirm)\b/i.test(message)
    && /\b(dose|shot|injection|pin)\b/i.test(message);
}

export function buildScheduledDoseConfirmationProposal(data: AppData, message: string, now = new Date()): AssistantActionProposal | null {
  if (!isScheduledDoseConfirmationRequest(message)) return null;

  const candidates = findScheduledDoseConfirmationCandidates(data, message, now);
  if (candidates.length === 0) {
    return {
      message: 'I could not find a pending scheduled dose matching that message. You can still add it from the full log.',
      action: null,
      summaryCards: [{
        id: 'open-log',
        title: 'No pending match',
        body: 'Open the log to add a manual record or review scheduled doses.',
        href: '/log',
        actionLabel: 'Open log',
      }],
    };
  }

  return {
    message: candidates.length === 1
      ? 'I found one pending scheduled dose. Review it before confirming.'
      : 'I found multiple pending scheduled doses. Choose the one you want to review.',
    action: {
      id: `assistant-action-${now.getTime()}`,
      type: 'confirm_scheduled_dose',
      payload: { candidates },
    },
  };
}

export function buildAssistantTodaySummary(data: AppData, now = new Date()): AssistantActionProposal {
  const summary = buildProtocolCockpitSummary(data, now);
  const { start, end } = getDayBounds(now);
  const todayDoseEvents = summary.events.filter((event) => event.kind === 'due-dose' && isWithinDay(event.occurredAt, start, end));
  const overdueDoseEvents = summary.events.filter(
    (event) => event.kind === 'due-dose'
      && event.status === 'overdue'
      && new Date(event.occurredAt).getTime() < now.getTime(),
  );
  const pendingTodayEvents = todayDoseEvents.filter((event) => event.status === 'pending');
  const completedTodayEvents = todayDoseEvents.filter((event) => event.status === 'taken');
  const skippedOrMissedTodayEvents = todayDoseEvents.filter((event) => event.status === 'skipped' || event.status === 'missed');
  const nextDoseAction = [...overdueDoseEvents, ...pendingTodayEvents].sort(sortEventsAscending)[0];

  const cards: AssistantSummaryCard[] = [
    {
      id: 'today',
      title: 'Today',
      eyebrow: `${summary.activeStackCount} active protocol${summary.activeStackCount === 1 ? '' : 's'}`,
      body: [
        `${pendingTodayEvents.length} due later today`,
        `${overdueDoseEvents.length} overdue`,
        `${completedTodayEvents.length} completed`,
        `${skippedOrMissedTodayEvents.length} skipped or missed`,
      ].join(' · '),
      href: '/log',
      actionLabel: 'Open log',
    },
    {
      id: 'next-dose-action',
      title: 'Next dose action',
      body: nextDoseAction ? formatDoseAction(nextDoseAction, data) : 'No dose action due today.',
      href: nextDoseAction?.href,
      actionLabel: nextDoseAction?.href ? 'Open dose' : undefined,
    },
    {
      id: 'inventory-coverage',
      title: 'Inventory coverage',
      body: summary.mostUrgentInventoryRisk
        ? formatInventoryRisk(summary.mostUrgentInventoryRisk, data)
        : 'No inventory coverage warnings right now.',
      href: summary.mostUrgentInventoryRisk?.href,
      actionLabel: summary.mostUrgentInventoryRisk?.href ? 'Open inventory' : undefined,
    },
  ];

  if (summary.latestSignal) {
    cards.push({
      id: 'latest-signal',
      title: 'Latest Signal',
      body: summary.latestSignal.detail,
      href: summary.latestSignal.href,
      actionLabel: 'Open Signals',
    });
  }

  return {
    message: 'Today’s operating summary, based on your local PeptideOS records. Not dosing or safety advice.',
    action: null,
    summaryCards: cards,
  };
}

function getDayBounds(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isWithinDay(value: string, start: Date, end: Date) {
  const timestamp = new Date(value).getTime();
  return timestamp >= start.getTime() && timestamp < end.getTime();
}

function sortEventsAscending(a: ProtocolTimelineEvent, b: ProtocolTimelineEvent) {
  return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
}

function compoundDisplayName(data: AppData, compoundId: string) {
  return data.compounds.find((compound) => compound.id === compoundId)?.name
    ?? data.peptides.find((peptide) => peptide.id === compoundId)?.name
    ?? formatFallbackName(compoundId);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function messageMentionsCompound(message: string, compoundId: string, compoundName: string) {
  const normalizedMessage = normalizeText(message);
  const normalizedName = normalizeText(compoundName);
  const normalizedId = normalizeText(compoundId);
  return normalizedMessage.includes(normalizedName) || normalizedMessage.includes(normalizedId);
}

function extractMentionedMinutes(message: string) {
  const match = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3].toLowerCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (meridiem.startsWith('p') && hours !== 12) hours += 12;
  if (meridiem.startsWith('a') && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function minutesFromTimeOfDay(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatDoseLabel(data: AppData, logId: string) {
  const log = data.scheduleLogs.find((candidate) => candidate.id === logId);
  const schedule = log ? data.schedules.find((candidate) => candidate.id === log.scheduleId) : undefined;
  return schedule ? `${schedule.doseValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${schedule.doseUnit}` : 'Scheduled dose';
}

function findScheduledDoseConfirmationCandidates(data: AppData, message: string, now: Date): ScheduledDoseConfirmationCandidate[] {
  const { start, end } = getDayBounds(now);
  const mentionedMinutes = extractMentionedMinutes(message);
  const pendingLogs = data.scheduleLogs.filter((log) => {
    if (log.status !== 'pending') return false;
    const dueAt = new Date(log.dueAt);
    return dueAt < end && (dueAt < start || dueAt >= start);
  });
  const enriched = pendingLogs
    .map((log) => {
      const schedule = data.schedules.find((candidate) => candidate.id === log.scheduleId);
      if (!schedule) return null;
      const compoundName = compoundDisplayName(data, log.peptideId);
      return {
        log,
        schedule,
        compoundName,
        stackName: stackDisplayName(data, log.stackId) ?? 'Active protocol',
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  const compoundMatches = enriched.filter((candidate) => messageMentionsCompound(message, candidate.log.peptideId, candidate.compoundName));
  const candidatePool = compoundMatches.length > 0 ? compoundMatches : enriched;
  const timeMatches = mentionedMinutes === null
    ? candidatePool
    : candidatePool.filter((candidate) => candidate.schedule.recurrence.timesOfDay.some((timeOfDay) => {
      const scheduledMinutes = minutesFromTimeOfDay(timeOfDay);
      return scheduledMinutes !== null && Math.abs(scheduledMinutes - mentionedMinutes) <= 30;
    }));
  return timeMatches
    .sort((a, b) => new Date(a.log.dueAt).getTime() - new Date(b.log.dueAt).getTime())
    .map((candidate) => ({
      logId: candidate.log.id,
      compoundId: candidate.log.peptideId,
      compoundName: candidate.compoundName,
      stackName: candidate.stackName,
      scheduledAt: candidate.log.dueAt,
      doseLabel: formatDoseLabel(data, candidate.log.id),
      route: candidate.schedule.route,
    }));
}

function stackDisplayName(data: AppData, stackId?: string) {
  if (!stackId) return null;
  return data.stacks.find((stack) => stack.id === stackId)?.name ?? null;
}

function formatFallbackName(id: string) {
  if (id.toLowerCase() === 'hgh') return 'hGH';
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDoseAction(event: ProtocolTimelineEvent, data: AppData) {
  const name = compoundDisplayName(data, event.compoundId);
  const detail = stripLeadingStackName(event.detail, data, event.stackId);
  return `${name}: ${detail}`;
}

function formatInventoryRisk(event: ProtocolTimelineEvent, data: AppData) {
  const name = stackDisplayName(data, event.stackId) ?? compoundDisplayName(data, event.compoundId);
  return `${name}: ${event.detail}`;
}

function stripLeadingStackName(detail: string, data: AppData, stackId?: string) {
  const name = stackDisplayName(data, stackId);
  if (!name) return detail;
  return detail.replace(new RegExp(`^${escapeRegExp(name)}\\s*·\\s*`), '');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isAssistantAction(value: unknown): value is AssistantAction {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return false;
  }

  if (value.type === 'create_stack_from_protocol') {
    return isStackDraft(value.payload);
  }

  if (value.type === 'create_inventory_vials') {
    return isInventoryVialDraft(value.payload);
  }

  if (value.type === 'confirm_scheduled_dose') {
    return isRecord(value.payload)
      && Array.isArray(value.payload.candidates)
      && value.payload.candidates.every((candidate) => (
        isRecord(candidate)
        && typeof candidate.logId === 'string'
        && typeof candidate.compoundId === 'string'
        && typeof candidate.compoundName === 'string'
        && typeof candidate.stackName === 'string'
        && typeof candidate.scheduledAt === 'string'
        && typeof candidate.doseLabel === 'string'
        && routes.includes(candidate.route as Route)
      ));
  }

  if (value.type !== 'add_signal_check_in') {
    return false;
  }

  const payload = value.payload;
  return isRecord(payload)
    && typeof payload.checkedAt === 'string'
    && typeof payload.energy === 'number'
    && typeof payload.sleepHours === 'number'
    && typeof payload.notes === 'string';
}

const doseUnits: DoseUnit[] = ['mcg', 'mg', 'iu'];
const routes: Route[] = ['subq', 'im', 'intranasal', 'oral', 'topical'];
const scheduleFrequencies: ScheduleFrequency[] = ['daily', 'weekly', 'interval', 'cycle'];
const inventoryContainerTypes: InventoryContainerType[] = ['lyophilized-vial', 'multi-dose-vial', 'prefilled-pen', 'capsule-bottle', 'other'];

function isScheduleRecurrence(value: unknown): value is ScheduleRecurrence {
  if (!isRecord(value) || !scheduleFrequencies.includes(value.frequency as ScheduleFrequency) || !Array.isArray(value.timesOfDay)) {
    return false;
  }

  return value.timesOfDay.every((time) => typeof time === 'string');
}

function isStackDraft(value: unknown): value is Omit<Stack, 'id'> {
  if (!isRecord(value) || !Array.isArray(value.peptides)) {
    return false;
  }

  return typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.startDate === 'string'
    && typeof value.durationDays === 'number'
    && value.status === 'planned'
    && typeof value.notes === 'string'
    && value.peptides.every((peptide) => (
      isRecord(peptide)
      && typeof peptide.peptideId === 'string'
      && typeof peptide.doseValue === 'number'
      && doseUnits.includes(peptide.doseUnit as DoseUnit)
      && typeof peptide.frequency === 'string'
      && routes.includes(peptide.route as Route)
      && typeof peptide.timing === 'string'
      && (peptide.schedule === undefined || isScheduleRecurrence(peptide.schedule))
    ));
}

function isPositiveOptionalNumber(value: unknown) {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value > 0);
}

function isInventoryVialDraft(value: unknown): value is NewVialInput {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.name === 'string'
    && typeof value.peptideId === 'string'
    && typeof value.dateAdded === 'string'
    && (value.containerType === undefined || inventoryContainerTypes.includes(value.containerType as InventoryContainerType))
    && isPositiveOptionalNumber(value.totalAmountValue)
    && (value.totalAmountUnit === undefined || doseUnits.includes(value.totalAmountUnit as DoseUnit))
    && (value.packageUnit === undefined || value.packageUnit === 'vial' || value.packageUnit === 'kit')
    && isPositiveOptionalNumber(value.packageQuantity);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseNumber(match: RegExpMatchArray | null) {
  if (!match?.[1]) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractSignalNotes(input: string) {
  return input
    .replace(/energy\s*(?:was|is|:)?\s*\d+(?:\.\d+)?(?:\s*\/\s*10)?/i, '')
    .replace(/(?:slept|sleep\s*(?:was|is|:)?)\s*\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr)?/i, '')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function proposeAssistantActionFromMessage(message: string, now = new Date()): AssistantAction | null {
  const energy = parseNumber(message.match(/energy\s*(?:was|is|:)?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*10)?/i));
  const sleepHours = parseNumber(message.match(/(?:slept|sleep\s*(?:was|is|:)?)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)?/i));

  if (energy === undefined && sleepHours === undefined) {
    return null;
  }

  return {
    id: `assistant-action-${now.getTime()}`,
    type: 'add_signal_check_in',
    payload: {
      checkedAt: now.toISOString(),
      energy: clamp(energy ?? 5, 0, 10),
      sleepHours: clamp(sleepHours ?? 0, 0, 24),
      notes: extractSignalNotes(message),
    },
  };
}
