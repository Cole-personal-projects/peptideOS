import { describe, expect, test } from 'vitest';
import { buildAssistantTodaySummary, buildScheduledDoseConfirmationProposal, isAssistantAction, isTodayStatusRequest, proposeAssistantActionFromMessage } from './assistant-actions';
import type { AppData } from './types';

const baseData: AppData = {
  peptides: [],
  compounds: [{
    id: 'bpc-157',
    name: 'BPC-157',
    aliases: [],
    compoundType: 'peptide',
    category: 'healing',
    defaultRoute: 'subq',
    supportedRoutes: ['subq'],
    defaultDoseUnit: 'mcg',
    concentrationMode: 'reconstituted',
    dosePresets: [],
    vialPresets: [],
    beginnerSummary: '',
    researcherDetails: '',
    mechanism: '',
    safety: '',
    storage: '',
    citations: [],
    source: 'bundled',
    curationStatus: 'reviewed',
  }],
  vials: [],
  inventoryBatches: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
  reconstitutionCalculations: [],
  signalCheckIns: [],
  labReports: [],
  labResults: [],
  labImportAudits: [],
  hasSeenDisclaimer: true,
  hasCompletedOnboarding: true,
  userMode: 'researcher',
  biometricLock: false,
  darkMode: true,
};

describe('assistant action proposals', () => {
 test('detects local today status requests', () => {
 expect(isTodayStatusRequest('What is due today?')).toBe(true);
 expect(isTodayStatusRequest('summarize today')).toBe(true);
 expect(isTodayStatusRequest('Add inventory: BPC vial')).toBe(false);
 });

 test('summarizes today from local protocol records without proposing mutation', () => {
 const proposal = buildAssistantTodaySummary({
 ...baseData,
 stacks: [{
 id: 'stack-1',
 name: 'Active stack',
 description: '',
 peptides: [],
 startDate: '2026-06-20T00:00:00.000Z',
 durationDays: 14,
 status: 'active',
 notes: '',
 }],
 schedules: [{
 id: 'schedule-1',
 stackId: 'stack-1',
 stackPeptideId: 'stack-peptide-1',
 peptideId: 'bpc-157',
 doseValue: 250,
 doseUnit: 'mcg',
 route: 'subq',
 recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
 startDate: '2026-06-20T00:00:00.000Z',
 endDate: '2026-07-04T00:00:00.000Z',
 status: 'active',
 }],
 scheduleLogs: [
 {
 id: 'due-today',
 scheduleId: 'schedule-1',
 stackId: 'stack-1',
 stackPeptideId: 'stack-peptide-1',
 peptideId: 'bpc-157',
 dueAt: '2026-06-21T20:00:00.000Z',
 status: 'pending',
 },
 {
 id: 'taken-today',
 scheduleId: 'schedule-1',
 stackId: 'stack-1',
 stackPeptideId: 'stack-peptide-1',
 peptideId: 'bpc-157',
 dueAt: '2026-06-21T08:00:00.000Z',
 status: 'taken',
 takenAt: '2026-06-21T08:05:00.000Z',
 },
 {
 id: 'missed-today',
 scheduleId: 'schedule-1',
 stackId: 'stack-1',
 stackPeptideId: 'stack-peptide-1',
 peptideId: 'bpc-157',
 dueAt: '2026-06-21T07:00:00.000Z',
 status: 'missed',
 missedAt: '2026-06-21T09:00:00.000Z',
 },
 ],
 signalCheckIns: [{
 id: 'signal-1',
 checkedAt: '2026-06-21T09:30:00.000Z',
 energy: 7,
 sleepHours: 6.5,
 notes: 'calm morning',
 }],
 }, new Date('2026-06-21T12:00:00.000Z'));

 expect(proposal.action).toBeNull();
 expect(proposal.message).toContain('local PeptideOS records');
 expect(proposal.message).toContain('Not dosing or safety advice');
 expect(proposal.summaryCards).toEqual(expect.arrayContaining([
 expect.objectContaining({
 id: 'today',
 title: 'Today',
      eyebrow: '1 active protocol',
 body: '1 due later today · 0 overdue · 1 completed · 1 skipped or missed',
 href: '/log',
 }),
 expect.objectContaining({
 id: 'next-dose-action',
 title: 'Next dose action',
 body: expect.stringContaining('BPC-157: Due'),
 href: '/stacks/stack-1',
 }),
 expect.objectContaining({
 id: 'latest-signal',
 title: 'Latest Signal',
 body: expect.stringContaining('Energy 7/10'),
 href: '/more/signals',
 }),
 ]));
 });

 test('does not count future generated schedule logs as due today', () => {
 const scheduleLogs = Array.from({ length: 365 }, (_, index) => {
 const dueAt = new Date('2026-06-22T15:00:00.000Z');
 dueAt.setDate(dueAt.getDate() + index);
 return {
 id: `future-${index}`,
 scheduleId: 'schedule-1',
 stackId: 'stack-1',
 stackPeptideId: 'stack-peptide-1',
 peptideId: 'hgh',
 dueAt: dueAt.toISOString(),
 status: 'pending' as const,
 };
 });

 const proposal = buildAssistantTodaySummary({
 ...baseData,
 compounds: [{
 ...baseData.compounds[0],
 id: 'hgh',
 name: 'hGH',
 defaultDoseUnit: 'iu',
 }],
 stacks: [{
 id: 'stack-1',
 name: 'hGH',
 description: '',
 peptides: [],
 startDate: '2026-06-20T00:00:00.000Z',
 durationDays: 365,
 status: 'active',
 notes: '',
 }],
 schedules: [{
 id: 'schedule-1',
 stackId: 'stack-1',
 stackPeptideId: 'stack-peptide-1',
 peptideId: 'hgh',
 doseValue: 2,
 doseUnit: 'iu',
 route: 'subq',
 recurrence: { frequency: 'daily', timesOfDay: ['15:00'] },
 startDate: '2026-06-20T00:00:00.000Z',
 endDate: '2027-06-20T00:00:00.000Z',
 status: 'active',
 }],
 scheduleLogs,
 }, new Date('2026-06-21T12:00:00.000Z'));

 expect(proposal.summaryCards?.find((card) => card.id === 'today')?.body).toContain('0 due later today');
 expect(proposal.message).not.toContain('365 due');
 expect(proposal.summaryCards?.find((card) => card.id === 'next-dose-action')?.body).toBe('No dose action due today.');
 });

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
      id: 'peppi-action-1',
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
      id: 'peppi-action-2',
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
      id: 'peppi-schedule-action-1',
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
      id: 'peppi-schedule-action-2',
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
      id: 'peppi-inventory-action-1',
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
      id: 'peppi-inventory-action-2',
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

  test('proposes scheduled dose confirmation for one matching pending log', () => {
    const proposal = buildScheduledDoseConfirmationProposal({
      ...baseData,
      stacks: [{
        id: 'stack-1',
        name: 'Recovery stack',
        description: '',
        peptides: [],
        startDate: '2026-06-21T00:00:00.000Z',
        durationDays: 14,
        status: 'active',
        notes: '',
      }],
      schedules: [{
        id: 'schedule-1',
        stackId: 'stack-1',
        stackPeptideId: 'stack-peptide-1',
        peptideId: 'bpc-157',
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
        startDate: '2026-06-21T00:00:00.000Z',
        endDate: '2026-07-05T00:00:00.000Z',
        status: 'active',
      }],
      scheduleLogs: [{
        id: 'log-8am',
        scheduleId: 'schedule-1',
        stackId: 'stack-1',
        stackPeptideId: 'stack-peptide-1',
        peptideId: 'bpc-157',
        dueAt: '2026-06-21T08:00:00.000Z',
        status: 'pending',
      }],
    }, 'I took my BPC dose', new Date('2026-06-21T12:00:00.000Z'));

    expect(proposal?.message).toContain('one pending scheduled dose');
    expect(proposal?.action).toEqual(expect.objectContaining({
      type: 'confirm_scheduled_dose',
      payload: {
        candidates: [expect.objectContaining({
          logId: 'log-8am',
          compoundName: 'BPC-157',
          stackName: 'Recovery stack',
          doseLabel: '250 mcg',
          route: 'subq',
        })],
      },
    }));
    expect(isAssistantAction(proposal?.action)).toBe(true);
  });

  test('keeps twice-daily same-compound confirmation candidates distinct', () => {
    const data: AppData = {
      ...baseData,
      stacks: [{
        id: 'stack-1',
        name: 'Twice daily stack',
        description: '',
        peptides: [],
        startDate: '2026-06-21T00:00:00.000Z',
        durationDays: 14,
        status: 'active',
        notes: '',
      }],
      schedules: [
        {
          id: 'schedule-8',
          stackId: 'stack-1',
          stackPeptideId: 'stack-peptide-1',
          peptideId: 'bpc-157',
          doseValue: 250,
          doseUnit: 'mcg',
          route: 'subq',
          recurrence: { frequency: 'daily', timesOfDay: ['08:00'] },
          startDate: '2026-06-21T00:00:00.000Z',
          endDate: '2026-07-05T00:00:00.000Z',
          status: 'active',
        },
        {
          id: 'schedule-22',
          stackId: 'stack-1',
          stackPeptideId: 'stack-peptide-1',
          peptideId: 'bpc-157',
          doseValue: 250,
          doseUnit: 'mcg',
          route: 'subq',
          recurrence: { frequency: 'daily', timesOfDay: ['22:00'] },
          startDate: '2026-06-21T00:00:00.000Z',
          endDate: '2026-07-05T00:00:00.000Z',
          status: 'active',
        },
      ],
      scheduleLogs: [
        {
          id: 'log-8am',
          scheduleId: 'schedule-8',
          stackId: 'stack-1',
          stackPeptideId: 'stack-peptide-1',
          peptideId: 'bpc-157',
          dueAt: '2026-06-21T08:00:00.000Z',
          status: 'pending',
        },
        {
          id: 'log-10pm',
          scheduleId: 'schedule-22',
          stackId: 'stack-1',
          stackPeptideId: 'stack-peptide-1',
          peptideId: 'bpc-157',
          dueAt: '2026-06-21T22:00:00.000Z',
          status: 'pending',
        },
      ],
    };

    const ambiguous = buildScheduledDoseConfirmationProposal(data, 'I took my BPC dose', new Date('2026-06-21T12:00:00.000Z'));
    expect(ambiguous?.message).toContain('multiple pending scheduled doses');
    expect(ambiguous?.action?.type).toBe('confirm_scheduled_dose');
    if (ambiguous?.action?.type === 'confirm_scheduled_dose') {
      expect(ambiguous.action.payload.candidates.map((candidate) => candidate.logId)).toEqual(['log-8am', 'log-10pm']);
    }

    const timed = buildScheduledDoseConfirmationProposal(data, 'I took my BPC dose at 10pm', new Date('2026-06-21T12:00:00.000Z'));
    expect(timed?.action?.type).toBe('confirm_scheduled_dose');
    if (timed?.action?.type === 'confirm_scheduled_dose') {
      expect(timed.action.payload.candidates.map((candidate) => candidate.logId)).toEqual(['log-10pm']);
    }
  });
});
