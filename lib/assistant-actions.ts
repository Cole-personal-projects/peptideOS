import type { SignalCheckIn } from './types';

export type AssistantAction =
  | {
      id: string;
      type: 'add_signal_check_in';
      payload: Omit<SignalCheckIn, 'id'>;
    };

export interface AssistantActionProposal {
  message: string;
  action: AssistantAction | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isAssistantAction(value: unknown): value is AssistantAction {
  if (!isRecord(value) || value.type !== 'add_signal_check_in' || typeof value.id !== 'string') {
    return false;
  }

  const payload = value.payload;
  return isRecord(payload)
    && typeof payload.checkedAt === 'string'
    && typeof payload.energy === 'number'
    && typeof payload.sleepHours === 'number'
    && typeof payload.notes === 'string';
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
