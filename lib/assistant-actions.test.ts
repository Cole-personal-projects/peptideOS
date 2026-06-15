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

    expect(action?.type).toBe('add_signal_check_in');
    if (action?.type !== 'add_signal_check_in') throw new Error('Expected Signal check-in action');
    expect(action.payload.energy).toBe(10);
    expect(action.payload.sleepHours).toBe(24);
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

  test('accepts planned stack schedule actions', () => {
    expect(isAssistantAction({
      id: 'haiku-schedule-action-1',
      type: 'create_stack_from_protocol',
      payload: {
        name: 'AI BPC Schedule',
        description: 'BPC-157 daily protocol from chat.',
        peptides: [
          {
            peptideId: 'bpc-157',
            doseValue: 250,
            doseUnit: 'mcg',
            frequency: 'daily',
            route: 'subq',
            timing: 'Morning',
            schedule: { frequency: 'daily', timesOfDay: ['08:00'] },
          },
        ],
        startDate: '2026-06-15T08:00:00.000Z',
        durationDays: 28,
        status: 'planned',
        notes: '',
      },
    })).toBe(true);

    expect(isAssistantAction({
      id: 'haiku-schedule-action-2',
      type: 'create_stack_from_protocol',
      payload: {
        name: 'Bad Schedule',
        description: '',
        peptides: [
          {
            peptideId: 'bpc-157',
            doseValue: 250,
            doseUnit: 'mcg',
            frequency: 'daily',
            route: 'unsupported',
            timing: 'Morning',
          },
        ],
        startDate: '2026-06-15T08:00:00.000Z',
        durationDays: 28,
        status: 'planned',
        notes: '',
      },
    })).toBe(false);
  });

  test('accepts inventory vial creation actions', () => {
    expect(isAssistantAction({
      id: 'haiku-inventory-action-1',
      type: 'create_inventory_vials',
      payload: {
        name: 'AI KPV kit',
        peptideId: 'kpv',
        dateAdded: '2026-06-15',
        containerType: 'lyophilized-vial',
        totalAmountValue: 10,
        totalAmountUnit: 'mg',
        packageUnit: 'kit',
        packageQuantity: 1,
      },
    })).toBe(true);

    expect(isAssistantAction({
      id: 'haiku-inventory-action-2',
      type: 'create_inventory_vials',
      payload: {
        name: 'Bad inventory',
        peptideId: 'kpv',
        dateAdded: '2026-06-15',
        containerType: 'unsupported',
        totalAmountValue: 10,
        totalAmountUnit: 'mg',
        packageUnit: 'kit',
        packageQuantity: 1,
      },
    })).toBe(false);
  });
});
