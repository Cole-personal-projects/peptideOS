"use client";

import { useState, type ReactNode } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, PackageCheck } from 'lucide-react';

import { ScheduleTimeFields } from '@/components/stacks/schedule-time-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { StatusDot } from '@/components/ui/visual-primitives';
import { getTrackableCompounds, type TrackableCompound } from '@/lib/compound-workflows';
import { useApp } from '@/lib/context';
import { formatDose, getDefaultDoseUnit } from '@/lib/dose-helpers';
import {
  applySchedulePreset,
  applyScheduleTimes,
  getDefaultScheduleRecurrence,
  getSchedulePreset,
  getScheduleSummary,
  normalizeScheduleRecurrence,
  type SchedulePreset,
} from '@/lib/schedules';
import { getStackConflictWarnings } from '@/lib/stack-conflicts';
import { cn } from '@/lib/utils';
import type { DoseUnit, Stack, StackPeptide } from '@/lib/types';

interface NewStackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCompoundId?: string;
  initialDraft?: Omit<Stack, 'id'>;
}

const steps = ['Setup', 'Compounds'] as const;
type BuilderStep = typeof steps[number];

const scheduleOptions: Array<{ value: SchedulePreset; label: string; shortLabel: string }> = [
  { value: 'daily', label: 'Daily', shortLabel: 'Daily' },
  { value: 'twice-daily', label: '2x daily', shortLabel: '2x' },
  { value: 'weekly', label: 'Weekly', shortLabel: 'Weekly' },
  { value: 'twice-weekly', label: '2x weekly', shortLabel: '2x week' },
  { value: 'weekdays', label: 'Weekdays', shortLabel: 'Weekdays' },
  { value: 'every-other-day', label: 'Every other day', shortLabel: 'EOD' },
  { value: 'five-on-two-off', label: '5 on / 2 off', shortLabel: '5/2' },
];

const weekPreview = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getInitialName(initialDraft: Omit<Stack, 'id'> | undefined, initialCompound: { name: string } | undefined) {
  return initialDraft?.name ?? (initialCompound ? `${initialCompound.name} protocol` : '');
}

function getInitialDescription(initialDraft: Omit<Stack, 'id'> | undefined, initialCompound: { name: string } | undefined) {
  return initialDraft?.description ?? (initialCompound ? `${initialCompound.name} tracking protocol` : '');
}

function getInitialDurationDays(initialDraft: Omit<Stack, 'id'> | undefined) {
  return (initialDraft?.durationDays ?? 28).toString();
}

function getInitialSelectedPeptides(initialDraft: Omit<Stack, 'id'> | undefined, initialCompound: { id: string } | undefined) {
  if (initialDraft) return initialDraft.peptides.map((peptide) => peptide.peptideId);
  return initialCompound ? [initialCompound.id] : [];
}

function getDefaultDraftPeptide(peptideId: string, compounds: TrackableCompound[]): StackPeptide {
  const compound = compounds.find((candidate) => candidate.id === peptideId);
  const doseUnit = compound?.defaultDoseUnit ?? getDefaultDoseUnit(peptideId);

  return {
    peptideId,
    doseValue: doseUnit === 'mg' ? 1 : doseUnit === 'iu' ? 2 : 250,
    doseUnit,
    frequency: 'daily',
    route: compound?.defaultRoute || 'subq',
    timing: 'Morning',
    schedule: { frequency: 'daily', timesOfDay: ['08:00'] },
  };
}

export function NewStackSheet({ open, onOpenChange, initialCompoundId, initialDraft }: NewStackSheetProps) {
  const { data, addStack } = useApp();
  const trackableCompounds = getTrackableCompounds(data);
  const initialCompound = trackableCompounds.find((compound) => compound.id === initialCompoundId);
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState(() => getInitialName(initialDraft, initialCompound));
  const [description, setDescription] = useState(() => getInitialDescription(initialDraft, initialCompound));
  const [selectedPeptides, setSelectedPeptides] = useState<string[]>(() => getInitialSelectedPeptides(initialDraft, initialCompound));
  const [draftPeptideOverrides, setDraftPeptideOverrides] = useState<StackPeptide[] | null>(() => initialDraft?.peptides ?? null);
  const [durationDays, setDurationDays] = useState(() => getInitialDurationDays(initialDraft));

  const resetForm = () => {
    setCurrentStep(0);
    setName(getInitialName(initialDraft, initialCompound));
    setDescription(getInitialDescription(initialDraft, initialCompound));
    setSelectedPeptides(getInitialSelectedPeptides(initialDraft, initialCompound));
    setDraftPeptideOverrides(initialDraft?.peptides ?? null);
    setDurationDays(getInitialDurationDays(initialDraft));
  };

  const getDraftPeptides = (): StackPeptide[] =>
    selectedPeptides.map((peptideId) => {
      const override = draftPeptideOverrides?.find((item) => item.peptideId === peptideId);
      return override ? { ...override } : getDefaultDraftPeptide(peptideId, trackableCompounds);
    });

  const patchDraftPeptide = (peptideId: string, updater: (stackPeptide: StackPeptide) => StackPeptide) => {
    setDraftPeptideOverrides(getDraftPeptides().map((stackPeptide) => (
      stackPeptide.peptideId === peptideId ? updater(stackPeptide) : stackPeptide
    )));
  };

  const updateDraftPeptideSchedule = (peptideId: string, preset: SchedulePreset) => {
    patchDraftPeptide(peptideId, (stackPeptide) => applySchedulePreset(stackPeptide, preset));
  };

  const updateDraftPeptideScheduleTimes = (peptideId: string, timesOfDay: string[]) => {
    patchDraftPeptide(peptideId, (stackPeptide) => applyScheduleTimes(stackPeptide, timesOfDay));
  };

  const handlePeptideToggle = (peptideId: string) => {
    setSelectedPeptides((previous) => (
      previous.includes(peptideId)
        ? previous.filter((id) => id !== peptideId)
        : [...previous, peptideId]
    ));
  };

  const draftPeptides = getDraftPeptides();
  const currentStepName: BuilderStep = steps[currentStep];
  const peptideNameById = Object.fromEntries(trackableCompounds.map((compound) => [compound.id, compound.name]));
  const plannedDoseCount = draftPeptides.reduce((total, stackPeptide) => total + estimateDoseCount(stackPeptide, Number.parseInt(durationDays) || 0), 0);
  const activeCompoundIds = new Set(data.vials.filter((vial) => vial.status === 'active' || vial.status === 'sealed').map((vial) => vial.peptideId));
  const inventoryCoverage = {
    covered: draftPeptides.filter((stackPeptide) => activeCompoundIds.has(stackPeptide.peptideId)).length,
    total: draftPeptides.length,
  };
  const conflictWarnings = getStackConflictWarnings({
    draftPeptides,
    existingStacks: data.stacks,
    recentDoses: data.doses,
    peptideNameById,
  });

  const canGoNext = () => {
    if (currentStepName === 'Setup') return Boolean(name.trim()) && Number.parseInt(durationDays) > 0;
    return selectedPeptides.length > 0;
  };

  const handleCreate = () => {
    if (!name.trim() || selectedPeptides.length === 0) return;

    addStack({
      name: name.trim(),
      description,
      peptides: getDraftPeptides(),
      startDate: new Date().toISOString(),
      durationDays: Number.parseInt(durationDays),
      status: 'planned',
      notes: '',
    });

    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="inset-x-0 bottom-0 h-[88svh] w-screen max-w-none overflow-hidden rounded-t-3xl border-x-0 px-0">
        <SheetHeader className="shrink-0 px-4 pb-3">
          <SheetTitle>New Protocol</SheetTitle>
        </SheetHeader>

        <div className="flex h-full min-w-0 flex-col overflow-hidden">
          <div className="shrink-0 border-y border-border bg-background/95 px-4 py-3">
            <div className="grid grid-cols-2 gap-2" aria-label="Protocol builder steps">
              {steps.map((step, index) => (
                <div key={step} className="space-y-1">
                  <div className={cn('h-1.5 rounded-full bg-secondary', index <= currentStep && 'bg-primary')} />
                  <p className={cn('truncate text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground', index === currentStep && 'text-foreground')}>
                    Step {index + 1} of {steps.length} · {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 pt-4">
            {currentStepName === 'Setup' && (
              <section className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <BuilderMetric icon={<CalendarDays className="h-4 w-4" />} label="Days" value={Number.parseInt(durationDays) || 0} />
                  <BuilderMetric icon={<Clock3 className="h-4 w-4" />} label="Doses" value={plannedDoseCount} />
                  <BuilderMetric icon={<PackageCheck className="h-4 w-4" />} label="Stock" value={`${inventoryCoverage.covered}/${inventoryCoverage.total}`} />
                </div>

                <section className="rounded-[20px] border border-border bg-card p-4">
                  <h2 className="text-base font-bold">Configure</h2>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stack-name">Protocol Name</Label>
                      <Input id="stack-name" placeholder="e.g., Cut Recovery Protocol" value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <div className="space-y-2">
                        <Label htmlFor="stack-description">Description</Label>
                        <Textarea
                          id="stack-description"
                          className="min-h-20"
                          placeholder="Optional note"
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stack-duration">Duration (days)</Label>
                        <Input
                          id="stack-duration"
                          type="number"
                          min="1"
                          placeholder="28"
                          value={durationDays}
                          onChange={(event) => setDurationDays(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <ProtocolPreview
                  name={name}
                  durationDays={durationDays}
                  plannedDoseCount={plannedDoseCount}
                  draftPeptides={draftPeptides}
                  compounds={trackableCompounds}
                  inventoryCoverage={inventoryCoverage}
                />
              </section>
            )}

            {currentStepName === 'Compounds' && (
              <section className="space-y-4">
                <div className="rounded-[20px] border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-bold">Compounds</h2>
                    <Badge variant="secondary">{selectedPeptides.length} selected</Badge>
                  </div>
                  <div className="mt-4 grid max-h-[34vh] min-w-0 grid-cols-1 gap-2 overflow-y-auto overflow-x-hidden pr-1 sm:grid-cols-2">
                    {trackableCompounds.map((compound) => (
                      <CompoundPickCard
                        key={compound.id}
                        compound={compound}
                        selected={selectedPeptides.includes(compound.id)}
                        hasInventory={data.vials.some((vial) => vial.peptideId === compound.id && (vial.status === 'active' || vial.status === 'sealed'))}
                        onToggle={() => handlePeptideToggle(compound.id)}
                      />
                    ))}
                  </div>
                </div>

                {draftPeptides.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-base font-bold">Schedule</h2>
                    {draftPeptides.map((stackPeptide) => (
                      <ScheduleCard
                        key={stackPeptide.peptideId}
                        stackPeptide={stackPeptide}
                        compound={trackableCompounds.find((compound) => compound.id === stackPeptide.peptideId)}
                        onScheduleChange={(preset) => updateDraftPeptideSchedule(stackPeptide.peptideId, preset)}
                        onTimesChange={(times) => updateDraftPeptideScheduleTimes(stackPeptide.peptideId, times)}
                        onDoseValueChange={(doseValue) => patchDraftPeptide(stackPeptide.peptideId, (current) => ({ ...current, doseValue }))}
                        onDoseUnitChange={(doseUnit) => patchDraftPeptide(stackPeptide.peptideId, (current) => ({ ...current, doseUnit }))}
                      />
                    ))}
                  </section>
                )}

                {conflictWarnings.length > 0 && (
                  <section className="rounded-[20px] border border-chart-4/35 bg-chart-4/10 p-4">
                    <h2 className="text-base font-bold">Review warnings</h2>
                    <div className="mt-3 space-y-2">
                      {conflictWarnings.map((warning) => (
                        <div key={warning.id} className="rounded-[14px] bg-background/70 p-3">
                          <p className="text-sm font-bold">{warning.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{warning.message}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <ProtocolPreview
                  name={name}
                  durationDays={durationDays}
                  plannedDoseCount={plannedDoseCount}
                  draftPeptides={draftPeptides}
                  compounds={trackableCompounds}
                  inventoryCoverage={inventoryCoverage}
                />
              </section>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep((previous) => Math.max(previous - 1, 0))} disabled={currentStep === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" className="flex-1" onClick={() => setCurrentStep((previous) => Math.min(previous + 1, steps.length - 1))} disabled={!canGoNext()}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" className="flex-1" onClick={handleCreate} disabled={!name.trim() || selectedPeptides.length === 0}>
                  <Check className="mr-1 h-4 w-4" />
                  Create Protocol
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BuilderMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-[16px] border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-primary">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold leading-none">{value}</p>
    </div>
  );
}

function CompoundPickCard({
  compound,
  selected,
  hasInventory,
  onToggle,
}: {
  compound: TrackableCompound;
  selected: boolean;
  hasInventory: boolean;
  onToggle: () => void;
}) {
  const checkboxId = `stack-peptide-${compound.id}`;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'flex min-w-0 cursor-pointer items-center gap-3 rounded-[16px] border p-3 transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-secondary/45 hover:bg-secondary/70',
      )}
    >
      <Checkbox id={checkboxId} checked={selected} onCheckedChange={onToggle} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{compound.name}</span>
        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <StatusDot tone={hasInventory ? 'success' : 'muted'} />
          <span className="capitalize">{compound.defaultRoute}</span>
          <span>·</span>
          <span>{hasInventory ? 'Stock' : 'No stock'}</span>
        </span>
      </span>
    </label>
  );
}

function ScheduleCard({
  stackPeptide,
  compound,
  onScheduleChange,
  onTimesChange,
  onDoseValueChange,
  onDoseUnitChange,
}: {
  stackPeptide: StackPeptide;
  compound: TrackableCompound | undefined;
  onScheduleChange: (preset: SchedulePreset) => void;
  onTimesChange: (timesOfDay: string[]) => void;
  onDoseValueChange: (doseValue: number) => void;
  onDoseUnitChange: (doseUnit: DoseUnit) => void;
}) {
  const recurrence = normalizeScheduleRecurrence(stackPeptide.schedule ?? getDefaultScheduleRecurrence(stackPeptide));
  const selectedPreset = getSchedulePreset(stackPeptide);

  return (
    <div className="rounded-[20px] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{compound?.name ?? stackPeptide.peptideId}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)} · {stackPeptide.route.toUpperCase()}</p>
        </div>
        <Badge variant="secondary">{getScheduleSummary(recurrence).split(' · ')[0]}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_92px] gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${stackPeptide.peptideId}-dose`} className="text-xs">Dose</Label>
          <Input
            id={`${stackPeptide.peptideId}-dose`}
            type="number"
            min="0"
            value={stackPeptide.doseValue}
            onChange={(event) => onDoseValueChange(Number.parseFloat(event.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${stackPeptide.peptideId}-dose-unit`} className="text-xs">Unit</Label>
          <Select value={stackPeptide.doseUnit} onValueChange={(value) => onDoseUnitChange(value as DoseUnit)}>
            <SelectTrigger id={`${stackPeptide.peptideId}-dose-unit`} aria-label={`${compound?.name ?? stackPeptide.peptideId} dose unit`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcg">mcg</SelectItem>
              <SelectItem value="mg">mg</SelectItem>
              <SelectItem value="iu">IU</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={`${stackPeptide.peptideId}-schedule`} className="text-xs">Schedule</Label>
        <Select value={selectedPreset} onValueChange={(value) => onScheduleChange(value as SchedulePreset)}>
          <SelectTrigger id={`${stackPeptide.peptideId}-schedule`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scheduleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {scheduleOptions.slice(0, 5).map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={selectedPreset === option.value ? 'default' : 'outline'}
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-xs"
              onClick={() => onScheduleChange(option.value)}
            >
              {option.shortLabel}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <ScheduleTimeFields stackPeptide={stackPeptide} idPrefix={`new-stack-${stackPeptide.peptideId}`} onTimesChange={onTimesChange} />
      </div>

      <WeekStrip recurrence={recurrence} />
    </div>
  );
}

function ProtocolPreview({
  name,
  durationDays,
  plannedDoseCount,
  draftPeptides,
  compounds,
  inventoryCoverage,
}: {
  name: string;
  durationDays: string;
  plannedDoseCount: number;
  draftPeptides: StackPeptide[];
  compounds: TrackableCompound[];
  inventoryCoverage: { covered: number; total: number };
}) {
  return (
    <section className="rounded-[20px] border border-border bg-secondary/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{name.trim() || 'Protocol preview'}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {Number.parseInt(durationDays) || 0} days · {draftPeptides.length} compound{draftPeptides.length === 1 ? '' : 's'} · {plannedDoseCount} planned dose{plannedDoseCount === 1 ? '' : 's'}
          </p>
        </div>
        <Badge variant={inventoryCoverage.total > 0 && inventoryCoverage.covered === inventoryCoverage.total ? 'secondary' : 'outline'}>
          Stock {inventoryCoverage.covered}/{inventoryCoverage.total}
        </Badge>
      </div>

      {draftPeptides.length > 0 && (
        <div className="mt-3 space-y-2">
          {draftPeptides.map((stackPeptide) => {
            const compound = compounds.find((candidate) => candidate.id === stackPeptide.peptideId);
            const recurrence = normalizeScheduleRecurrence(stackPeptide.schedule ?? getDefaultScheduleRecurrence(stackPeptide));
            return (
              <div key={stackPeptide.peptideId} className="flex items-center justify-between gap-3 rounded-[14px] bg-background/70 p-2 text-sm">
                <span className="min-w-0 truncate font-bold">{compound?.name ?? stackPeptide.peptideId}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)} · {getScheduleSummary(recurrence)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WeekStrip({ recurrence }: { recurrence: ReturnType<typeof normalizeScheduleRecurrence> }) {
  const activeWeekdays = recurrence.frequency === 'weekly' ? new Set(recurrence.weekdays ?? [1]) : null;

  return (
    <div className="mt-4 grid grid-cols-7 gap-1" aria-label="7-day cadence preview">
      {weekPreview.map((day, index) => {
        const weekday = index + 1 > 6 ? 0 : index + 1;
        const active = activeWeekdays ? activeWeekdays.has(weekday) : recurrence.frequency !== 'interval' || index % (recurrence.intervalDays ?? 1) === 0;
        return (
          <div key={`${day}-${index}`} className={cn('rounded-[12px] border p-2 text-center', active ? 'border-primary bg-primary/10' : 'border-border bg-secondary/45')}>
            <p className="text-[10px] font-bold text-muted-foreground">{day}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {active ? recurrence.timesOfDay.map((time) => <span key={time} className="h-1.5 w-1.5 rounded-full bg-primary" />) : <span className="h-1.5 w-1.5 rounded-full bg-border" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function estimateDoseCount(stackPeptide: StackPeptide, durationDays: number) {
  if (durationDays <= 0) return 0;
  const recurrence = normalizeScheduleRecurrence(stackPeptide.schedule ?? getDefaultScheduleRecurrence(stackPeptide));
  const timesPerDoseDay = Math.max(recurrence.timesOfDay.length, 1);

  if (recurrence.frequency === 'weekly') {
    const daysPerWeek = Math.max(recurrence.weekdays?.length ?? 1, 1);
    return Math.ceil((durationDays / 7) * daysPerWeek) * timesPerDoseDay;
  }

  if (recurrence.frequency === 'interval') {
    return Math.ceil(durationDays / Math.max(recurrence.intervalDays ?? 1, 1)) * timesPerDoseDay;
  }

  if (recurrence.frequency === 'cycle') {
    const onDays = recurrence.cycleOnDays ?? 5;
    const offDays = recurrence.cycleOffDays ?? 2;
    const cycleLength = Math.max(onDays + offDays, 1);
    const fullCycles = Math.floor(durationDays / cycleLength);
    const remainder = durationDays % cycleLength;
    return (fullCycles * onDays + Math.min(remainder, onDays)) * timesPerDoseDay;
  }

  return durationDays * timesPerDoseDay;
}
