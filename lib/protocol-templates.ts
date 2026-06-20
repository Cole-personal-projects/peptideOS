import type { Compound, CompoundProtocolTemplate, DoseUnit, Stack } from './types';

export interface ProtocolTemplateStackDraftInput {
  compound: Compound;
  template: CompoundProtocolTemplate;
  doseValue?: number;
  doseUnit?: DoseUnit;
  startDate?: string;
}

export function protocolTemplateToStackDraft(input: ProtocolTemplateStackDraftInput): Omit<Stack, 'id'> {
  const doseValue = input.doseValue ?? input.template.defaultDose.value;
  const doseUnit = input.doseUnit ?? input.template.defaultDose.unit;
  const startDate = input.startDate ?? new Date().toISOString();

  return {
    name: input.template.name,
    description: input.template.summary,
    peptides: [
      {
        peptideId: input.template.defaultCompoundId,
        doseValue,
        doseUnit,
        frequency: input.template.schedule.frequency,
        route: input.compound.defaultRoute,
        timing: formatTemplateTiming(input.template),
        schedule: { ...input.template.schedule },
      },
    ],
    startDate,
    durationDays: getTemplateDurationDays(input.template),
    status: 'planned',
    notes: [...input.template.warnings, ...input.template.importantNotes].join('\n'),
  };
}

function getTemplateDurationDays(template: CompoundProtocolTemplate): number {
  const titrationWeeks = template.titration.reduce((total, step) => total + step.durationWeeks, 0);
  return titrationWeeks > 0 ? titrationWeeks * 7 : 28;
}

function formatTemplateTiming(template: CompoundProtocolTemplate): string {
  const time = template.schedule.timesOfDay[0] ?? '08:00';

  if (template.schedule.frequency === 'weekly') {
    const day = template.schedule.weekdays?.[0] ?? 1;
    return `${weekdayLabels[day] ?? 'Monday'} @ ${time}`;
  }

  if (template.schedule.frequency === 'interval') {
    return `Every ${template.schedule.intervalDays ?? 2} days @ ${time}`;
  }

  if (template.schedule.frequency === 'cycle') {
    return `${template.schedule.cycleOnDays ?? 5} on / ${template.schedule.cycleOffDays ?? 2} off @ ${time}`;
  }

  return `Daily @ ${time}`;
}

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
