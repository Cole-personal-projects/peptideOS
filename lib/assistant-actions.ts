import type { NewVialInput } from './vial-create';
import type { DoseUnit, InventoryContainerType, Route, ScheduleFrequency, ScheduleRecurrence, SignalCheckIn, Stack } from './types';

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
    };

export interface AssistantActionProposal {
  message: string;
  action: AssistantAction | null;
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
