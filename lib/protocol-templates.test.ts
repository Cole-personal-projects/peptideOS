import { describe, expect, test } from 'vitest';
import { referenceCompounds } from './reference-compounds';
import { protocolTemplateToStackDraft } from './protocol-templates';

describe('compound protocol templates', () => {
  test('compiles a Retatrutide template into an interoperable planned stack draft', () => {
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
      peptides: [
        {
          peptideId: 'retatrutide',
          doseValue: 4,
          doseUnit: 'mg',
          frequency: 'weekly',
          route: 'subq',
          timing: 'Friday @ 08:00',
          schedule: {
            frequency: 'weekly',
            weekdays: [5],
            timesOfDay: ['08:00'],
          },
        },
      ],
      notes: expect.stringContaining('Monitor resting heart rate, HRV, sleep'),
    });
  });
});
