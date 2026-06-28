import { beforeAll, describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { buildProtocolTemplateSchedulePreview, protocolTemplateToStackDraft } from './protocol-templates';

beforeAll(() => {
  process.env.TZ = 'UTC';
});

describe('compound protocol templates', () => {
  test('compiles Retatrutide titration template into phased planned stack draft', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');
    const template = retatrutide?.protocolTemplates?.find((candidate) => candidate.id === 'retatrutide-triple-agonist');

    expect(template).toBeDefined();

    const draft = protocolTemplateToStackDraft({
      compound: retatrutide!,
      template: template!,
      doseValue: 4,
      doseUnit: 'mg',
      startDate: '2026-06-19T08:00:00.000Z',
    });

    expect(draft).toMatchObject({
      name: 'Triple Agonist',
      description: expect.stringContaining('Retatrutide-focused weekly tracking template'),
      durationDays: 140,
      status: 'planned',
      notes: expect.stringContaining('Monitor resting heart rate, HRV, sleep'),
    });
    expect(draft.peptides).toHaveLength(5);
    expect(draft.peptides[0]).toMatchObject({
      peptideId: 'retatrutide',
      doseValue: 0.5,
      doseUnit: 'mg',
      frequency: 'weekly',
      route: 'subq',
      timing: 'Friday @ 08:00',
      schedule: {
        frequency: 'weekly',
        weekdays: [5],
        timesOfDay: ['08:00'],
      },
      phaseLabel: 'Phase 1',
      startOffsetDays: 0,
      durationDays: 28,
    });
    expect(draft.peptides.map((peptide) => peptide.doseValue)).toEqual([0.5, 1, 2, 4, 8]);
    expect(draft.peptides.map((peptide) => peptide.startOffsetDays)).toEqual([0, 28, 56, 84, 112]);
  });

  test('previews generated scheduled events before committing a titration template', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');
    const template = retatrutide?.protocolTemplates?.find((candidate) => candidate.id === 'retatrutide-triple-agonist');

    expect(template).toBeDefined();

    const preview = buildProtocolTemplateSchedulePreview({
      compound: retatrutide!,
      template: template!,
      startDate: '2026-06-19T08:00:00.000Z',
    });

    expect(preview.phases).toHaveLength(5);
    expect(preview.phases[0]).toMatchObject({
      label: 'Phase 1',
      doseValue: 0.5,
      doseUnit: 'mg',
      durationDays: 28,
      scheduleSummary: 'Weekly · Friday · 8:00 AM',
    });
    expect(preview.events).toHaveLength(20);
    expect(preview.events.slice(0, 5).map((event) => event.label)).toEqual([
      'Phase 1 · 0.5 mg',
      'Phase 1 · 0.5 mg',
      'Phase 1 · 0.5 mg',
      'Phase 1 · 0.5 mg',
      'Phase 2 · 1 mg',
    ]);
    expect(preview.events[0].dueAt).toBe('2026-06-19T08:00:00.000Z');
    expect(preview.events[4].dueAt).toBe('2026-07-17T08:00:00.000Z');
  });
});
