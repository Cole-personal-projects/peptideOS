import { describe, expect, test } from 'vitest';
import { isAssistantAction, proposeAssistantActionFromMessage } from './assistant-actions';

describe('assistant action proposals', () => {
  test('creates a Signal check-in action from a user note', () => {
    const action = proposeAssistantActionFromMessage(
      'Energy was 7, slept 6 hours, shoulder calm today.',
      new Date('2026-06-15T08:00:00.000Z'),
    );

    expect(action).toEqual({
      id: 'assistant-action-1781510400000',
      type: 'add_signal_check_in',
      payload: {
        checkedAt: '2026-06-15T08:00:00.000Z',
        energy: 7,
        sleepHours: 6,
        notes: 'shoulder calm today',
      },
    });
  });

  test('does not propose an app action when the message has no Signal data', () => {
    expect(proposeAssistantActionFromMessage('What can you do in this app?')).toBeNull();
  });

  test('keeps proposed Signal values inside supported ranges', () => {
    const action = proposeAssistantActionFromMessage(
      'Energy was 14 and slept 30 hours.',
      new Date('2026-06-15T08:00:00.000Z'),
    );

    expect(action?.payload.energy).toBe(10);
    expect(action?.payload.sleepHours).toBe(24);
  });

  test('accepts only well-formed assistant actions', () => {
    expect(isAssistantAction({
      id: 'haiku-action-1',
      type: 'add_signal_check_in',
      payload: {
        checkedAt: '2026-06-15T08:00:00.000Z',
        energy: 7,
        sleepHours: 6,
        notes: 'shoulder calm',
      },
    })).toBe(true);

    expect(isAssistantAction(null)).toBe(false);
    expect(isAssistantAction({ type: 'add_signal_check_in' })).toBe(false);
    expect(isAssistantAction({
      id: 'haiku-action-2',
      type: 'add_signal_check_in',
      payload: {
        checkedAt: '2026-06-15T08:00:00.000Z',
        energy: '7',
        sleepHours: 6,
        notes: 'shoulder calm',
      },
    })).toBe(false);
  });
});
