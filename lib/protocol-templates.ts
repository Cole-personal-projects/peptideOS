import { generateScheduleLogs, getScheduleSummary, normalizeStack } from './schedules';
import type { Compound, CompoundProtocolTemplate, DoseUnit, Schedule, Stack, StackPeptide } from './types';

export interface ProtocolTemplateStackDraftInput {
  compound: Compound;
  template: CompoundProtocolTemplate;
  doseValue?: number;
  doseUnit?: DoseUnit;
  startDate?: string;
}

export interface ProtocolTemplatePhasePreview {
  id: string;
  label: string;
  compoundId: string;
  doseValue: number;
  doseUnit: DoseUnit;
  startOffsetDays: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  scheduleSummary: string;
}

export interface ProtocolTemplateSchedulePreviewEvent {
  id: string;
  phaseId: string;
  compoundId: string;
  doseValue: number;
  doseUnit: DoseUnit;
  dueAt: string;
  label: string;
}

export interface ProtocolTemplateSchedulePreview {
  phases: ProtocolTemplatePhasePreview[];
  events: ProtocolTemplateSchedulePreviewEvent[];
}

export function protocolTemplateToStackDraft(input: ProtocolTemplateStackDraftInput): Omit<Stack, 'id'> {
  const startDate = input.startDate ?? new Date().toISOString();
  const phasePeptides = buildProtocolTemplateStackPeptides(input);

  return {
    name: input.template.name,
    description: input.template.summary,
    peptides: phasePeptides,
    startDate,
    durationDays: getTemplateDurationDays(input.template),
    status: 'planned',
    notes: [...input.template.warnings, ...input.template.importantNotes].join('\n'),
  };
}

export function buildProtocolTemplateSchedulePreview(input: ProtocolTemplateStackDraftInput): ProtocolTemplateSchedulePreview {
  const draft = protocolTemplateToStackDraft(input);
  const stack = normalizeStack({ ...draft, id: 'template-preview' });
  const phases = stack.peptides.map((peptide, index) => {
    const startOffsetDays = peptide.startOffsetDays ?? 0;
    const durationDays = peptide.durationDays ?? stack.durationDays;
    const start = addDays(localDayStart(new Date(stack.startDate)), startOffsetDays);
    const end = addDays(start, Math.max(durationDays - 1, 0));
    end.setHours(23, 59, 59, 999);

    return {
      id: peptide.id ?? `template-preview-item-${index}`,
      label: peptide.phaseLabel ?? `Phase ${index + 1}`,
      compoundId: peptide.peptideId,
      doseValue: peptide.doseValue,
      doseUnit: peptide.doseUnit,
      startOffsetDays,
      durationDays,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      scheduleSummary: getScheduleSummary(peptide.schedule ?? input.template.schedule),
    };
  });
  const phaseByItemId = new Map(phases.map((phase) => [phase.id, phase]));
  const schedules = stack.peptides.map((peptide): Schedule => {
    const phase = phaseByItemId.get(peptide.id!);

    return {
      id: `template-preview-schedule-${peptide.id}`,
      stackId: stack.id,
      stackPeptideId: peptide.id!,
      peptideId: peptide.peptideId,
      doseValue: peptide.doseValue,
      doseUnit: peptide.doseUnit,
      route: peptide.route,
      recurrence: peptide.schedule ?? input.template.schedule,
      startDate: phase?.startDate ?? stack.startDate,
      endDate: phase?.endDate ?? stack.startDate,
      status: 'active',
    };
  });
  const events = schedules.flatMap((schedule) => {
    const phase = phaseByItemId.get(schedule.stackPeptideId);

    return generateScheduleLogs(schedule).map((log) => ({
      id: log.id,
      phaseId: schedule.stackPeptideId,
      compoundId: schedule.peptideId,
      doseValue: schedule.doseValue,
      doseUnit: schedule.doseUnit,
      dueAt: log.dueAt,
      label: `${phase?.label ?? 'Phase'} · ${schedule.doseValue} ${schedule.doseUnit}`,
    }));
  });

  return {
    phases,
    events: events.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
  };
}

function buildProtocolTemplateStackPeptides(input: ProtocolTemplateStackDraftInput): StackPeptide[] {
  if (input.template.titration.length === 0) {
    const doseValue = input.doseValue ?? input.template.defaultDose.value;
    const doseUnit = input.doseUnit ?? input.template.defaultDose.unit;

    return [
      {
        peptideId: input.template.defaultCompoundId,
        doseValue,
        doseUnit,
        frequency: input.template.schedule.frequency,
        route: input.compound.defaultRoute,
        timing: formatTemplateTiming(input.template),
        schedule: { ...input.template.schedule },
      },
    ];
  }

  let startOffsetDays = 0;

  return input.template.titration.map((step, index) => {
    const durationDays = step.durationWeeks * 7;
    const peptide: StackPeptide = {
      id: `${input.template.defaultCompoundId}-phase-${index + 1}`,
      peptideId: input.template.defaultCompoundId,
      doseValue: step.doseValue,
      doseUnit: step.doseUnit,
      frequency: input.template.schedule.frequency,
      route: input.compound.defaultRoute,
      timing: formatTemplateTiming(input.template),
      schedule: { ...input.template.schedule },
      phaseLabel: `Phase ${index + 1}`,
      startOffsetDays,
      durationDays,
    };
    startOffsetDays += durationDays;
    return peptide;
  });
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

function localDayStart(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
