import { describe, expect, it } from 'vitest';
import { getStackConflictWarnings } from './stack-conflicts';
import type { Dose, Stack, StackPeptide } from './types';

function stackPeptide(overrides: Partial<StackPeptide>): StackPeptide {
  return {
    peptideId: 'bpc-157',
    doseValue: 250,
    doseUnit: 'mcg',
    frequency: 'daily',
    route: 'subq',
    timing: 'Morning',
    ...overrides,
  };
}

function stack(overrides: Partial<Stack>): Stack {
  return {
    id: 'stack-1',
    name: 'Existing stack',
    description: '',
    peptides: [stackPeptide({ peptideId: 'bpc-157' })],
    startDate: '2026-05-01T00:00:00.000Z',
    durationDays: 42,
    status: 'active',
    notes: '',
    ...overrides,
  };
}

function dose(overrides: Partial<Dose>): Dose {
  return {
    id: 'dose-1',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: '2026-05-18T08:00:00.000Z',
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed: true,
    ...overrides,
  };
}

describe('stack conflict warnings', () => {
  it('flags duplicate peptides in the draft without blocking save', () => {
    const warnings = getStackConflictWarnings({
      draftPeptides: [
        stackPeptide({ peptideId: 'bpc-157' }),
        stackPeptide({ peptideId: 'bpc-157', timing: 'Evening' }),
      ],
      existingStacks: [],
      recentDoses: [],
      peptideNameById: { 'bpc-157': 'BPC-157' },
    });

    expect(warnings).toEqual([
      expect.objectContaining({
        id: 'duplicate-peptide:bpc-157',
        severity: 'review',
        blocking: false,
        title: 'Review duplicate peptide',
      }),
    ]);
  });

  it('flags overlap with active stacks using the same peptide', () => {
    const warnings = getStackConflictWarnings({
      draftPeptides: [stackPeptide({ peptideId: 'tb-500' })],
      existingStacks: [stack({ name: 'Healing Protocol', peptides: [stackPeptide({ peptideId: 'tb-500' })] })],
      recentDoses: [],
      peptideNameById: { 'tb-500': 'TB-500' },
    });

    expect(warnings).toEqual([
      expect.objectContaining({
        id: 'active-overlap:tb-500:stack-1',
        severity: 'review',
        title: 'Review active protocol overlap',
      }),
    ]);
  });

  it('flags recent route/site load for injectable draft peptides', () => {
    const warnings = getStackConflictWarnings({
      draftPeptides: [stackPeptide({ peptideId: 'bpc-157', route: 'subq' })],
      existingStacks: [],
      recentDoses: [
        dose({ id: 'a', dateTime: '2026-05-18T08:00:00.000Z', route: 'subq', site: 'abdomen-upper-left' }),
        dose({ id: 'b', dateTime: '2026-05-17T08:00:00.000Z', route: 'subq', site: 'abdomen-upper-left' }),
        dose({ id: 'c', dateTime: '2026-05-16T08:00:00.000Z', route: 'subq', site: 'abdomen-upper-left' }),
      ],
      peptideNameById: { 'bpc-157': 'BPC-157' },
      now: new Date('2026-05-19T08:00:00.000Z'),
    });

    expect(warnings).toContainEqual(
      expect.objectContaining({
        id: 'route-site-load:subq:abdomen-upper-left',
        severity: 'info',
        title: 'Review recent site load',
      }),
    );
  });
});
