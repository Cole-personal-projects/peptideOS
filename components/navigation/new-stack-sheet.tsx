"use client";

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleTimeFields } from '@/components/stacks/schedule-time-fields';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { formatDose, getDefaultDoseUnit } from '@/lib/dose-helpers';
import { applySchedulePreset, applyScheduleTimes, getSchedulePreset } from '@/lib/schedules';
import { getStackConflictWarnings } from '@/lib/stack-conflicts';
import { stackTemplates, templateToStackDraft } from '@/lib/stack-templates';
import { cn } from '@/lib/utils';
import type { Stack, StackPeptide } from '@/lib/types';
import type { SchedulePreset } from '@/lib/schedules';

interface NewStackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCompoundId?: string;
  initialDraft?: Omit<Stack, 'id'>;
}

const steps = ['Configure', 'Peptides'] as const;
type BuilderStep = typeof steps[number];

function getInitialName(initialDraft: Omit<Stack, 'id'> | undefined, initialCompound: { name: string } | undefined) {
  return initialDraft?.name ?? (initialCompound ? `${initialCompound.name} research plan` : '');
}

function getInitialDescription(initialDraft: Omit<Stack, 'id'> | undefined, initialCompound: { name: string } | undefined) {
  return initialDraft?.description ?? (initialCompound ? `Track ${initialCompound.name} from user-confirmed label details.` : '');
}

function getInitialSelectedPeptides(initialDraft: Omit<Stack, 'id'> | undefined, initialCompound: { id: string } | undefined) {
  return initialDraft?.peptides.map((peptide) => peptide.peptideId) ?? (initialCompound ? [initialCompound.id] : []);
}

function getInitialDurationDays(initialDraft: Omit<Stack, 'id'> | undefined) {
  return initialDraft?.durationDays.toString() ?? '28';
}

export function NewStackSheet({ open, onOpenChange, initialCompoundId, initialDraft }: NewStackSheetProps) {
  const { data, addStack } = useApp();
  const trackableCompounds = useMemo(() => getTrackableCompounds(data), [data]);
  const initialCompound = trackableCompounds.find((candidate) => candidate.id === initialCompoundId);
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState(() => getInitialName(initialDraft, initialCompound));
  const [description, setDescription] = useState(() => getInitialDescription(initialDraft, initialCompound));
  const [selectedPeptides, setSelectedPeptides] = useState<string[]>(() => getInitialSelectedPeptides(initialDraft, initialCompound));
  const [templatePeptides, setTemplatePeptides] = useState<StackPeptide[] | null>(() => initialDraft?.peptides ?? null);
  const [durationDays, setDurationDays] = useState(() => getInitialDurationDays(initialDraft));

  const resetForm = () => {
    setCurrentStep(0);
    setName(getInitialName(initialDraft, initialCompound));
    setDescription(getInitialDescription(initialDraft, initialCompound));
    setSelectedPeptides(getInitialSelectedPeptides(initialDraft, initialCompound));
    setTemplatePeptides(initialDraft?.peptides ?? null);
    setDurationDays(getInitialDurationDays(initialDraft));
  };

  const getDraftPeptides = (): StackPeptide[] => {
    return selectedPeptides.map(peptideId => {
      const templatePeptide = templatePeptides?.find((item) => item.peptideId === peptideId);
      if (templatePeptide) return { ...templatePeptide };

      const compound = trackableCompounds.find(p => p.id === peptideId);
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
    });
  };

  const updateDraftPeptideSchedule = (peptideId: string, preset: SchedulePreset) => {
    const nextPeptides = getDraftPeptides().map((stackPeptide) => (
      stackPeptide.peptideId === peptideId ? applySchedulePreset(stackPeptide, preset) : stackPeptide
    ));
    setTemplatePeptides(nextPeptides);
  };

  const updateDraftPeptideScheduleTimes = (peptideId: string, timesOfDay: string[]) => {
    const nextPeptides = getDraftPeptides().map((stackPeptide) => (
      stackPeptide.peptideId === peptideId ? applyScheduleTimes(stackPeptide, timesOfDay) : stackPeptide
    ));
    setTemplatePeptides(nextPeptides);
  };

  const handlePeptideToggle = (peptideId: string) => {
    setSelectedPeptides(prev =>
      prev.includes(peptideId)
        ? prev.filter(id => id !== peptideId)
        : [...prev, peptideId]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    const draft = templateToStackDraft(templateId);
    if (!draft) return;

    setName(draft.name);
    setDescription(draft.description);
    setDurationDays(draft.durationDays.toString());
    setSelectedPeptides(draft.peptides.map((peptide) => peptide.peptideId));
    setTemplatePeptides(draft.peptides);
  };

  const canGoNext = () => {
    if (currentStep === 0) return name.trim().length > 0 && Number.parseInt(durationDays) > 0;
    if (currentStep === 1) return selectedPeptides.length > 0;
    return true;
  };

  const handleCreate = () => {
    if (!name || selectedPeptides.length === 0) return;

    addStack({
      name,
      description,
      peptides: getDraftPeptides(),
      startDate: new Date().toISOString(),
      durationDays: Number.parseInt(durationDays),
      status: 'planned',
      notes: ''
    });

    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const currentStepName: BuilderStep = steps[currentStep];
  const draftPeptides = getDraftPeptides();
  const peptideNameById = Object.fromEntries(trackableCompounds.map((compound) => [compound.id, compound.name]));
  const conflictWarnings = getStackConflictWarnings({
    draftPeptides,
    existingStacks: data.stacks,
    recentDoses: data.doses,
    peptideNameById,
  });

  return (
  <Sheet open={open} onOpenChange={handleOpenChange}>
    <SheetContent side="bottom" className="inset-x-0 bottom-0 h-[85svh] w-screen max-w-none overflow-hidden rounded-t-3xl border-x-0 px-0">
      <SheetHeader className="shrink-0 px-4 pb-4">
        <SheetTitle>New Stack</SheetTitle>
      </SheetHeader>

      <div className="min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 pb-24">
        <div className="min-w-0 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
            </p>
          <div className="grid grid-cols-2 gap-2" aria-label="Stack builder steps">
              {steps.map((step, index) => (
                <div key={step} className="space-y-1">
                  <div
                    className={cn(
                      "h-1.5 rounded-full bg-secondary",
                      index <= currentStep && "bg-primary"
                    )}
                  />
                  <p className={cn(
                    "truncate text-[11px] font-medium text-muted-foreground",
                    index === currentStep && "text-foreground"
                  )}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

        {currentStepName === 'Configure' && (
          <section className="min-w-0 space-y-4 overflow-hidden">
            <h2 className="text-lg font-semibold">Configure</h2>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Templates</h3>
                <div className="grid gap-2">
                  {stackTemplates.map((template) => (
                    <div key={template.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {template.durationDays} days · {template.peptides.length} peptides
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          Use {template.name}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stack-name">Stack Name</Label>
                <Input
                  id="stack-name"
                  placeholder="e.g., Healing Protocol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stack-description">Description</Label>
                <Textarea
                  id="stack-description"
                  placeholder="Brief description of this stack's purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
            </section>
          )}

        {currentStepName === 'Peptides' && (
          <section className="min-w-0 space-y-4 overflow-hidden">
            <h2 className="text-lg font-semibold">Add Peptides</h2>

            <div className="grid max-h-[42vh] min-w-0 grid-cols-1 gap-2 overflow-y-auto overflow-x-hidden pr-1 sm:grid-cols-2">
                {trackableCompounds.map((compound) => {
                  const checkboxId = `stack-peptide-${compound.id}`;
                  return (
                    <label
                      key={compound.id}
                      htmlFor={checkboxId}
                    className="flex min-w-0 items-start gap-3 rounded-lg bg-secondary p-3 hover:bg-secondary/80"
                  >
                      <Checkbox
                        id={checkboxId}
                        checked={selectedPeptides.includes(compound.id)}
                        onCheckedChange={() => handlePeptideToggle(compound.id)}
                      />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{compound.name}</span>
                      <span className="block text-xs text-muted-foreground capitalize">{compound.defaultRoute}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

        {currentStepName === 'Peptides' && (
          <section className="min-w-0 space-y-4 overflow-hidden">
              <h2 className="text-lg font-semibold">Schedule</h2>

              <div className="space-y-2">
              {draftPeptides.map((stackPeptide) => {
                const compound = trackableCompounds.find(p => p.id === stackPeptide.peptideId);
                return (
                  <div key={stackPeptide.peptideId} className="min-w-0 overflow-hidden rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{compound?.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {stackPeptide.frequency} · {stackPeptide.timing} · {stackPeptide.route.toUpperCase()}
                          </p>
                        </div>
                      <span className="shrink-0 text-sm font-medium">
                          {formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={`schedule-${stackPeptide.peptideId}`}>Schedule</Label>
                        <Select
                          value={getSchedulePreset(stackPeptide)}
                          onValueChange={(value) => updateDraftPeptideSchedule(stackPeptide.peptideId, value as SchedulePreset)}
                        >
                          <SelectTrigger id={`schedule-${stackPeptide.peptideId}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="twice-daily">2x daily</SelectItem>
                            <SelectItem value="weekdays">Weekdays</SelectItem>
                            <SelectItem value="weekly">Weekly · Monday</SelectItem>
                            <SelectItem value="twice-weekly">2x weekly · Monday, Thursday</SelectItem>
                            <SelectItem value="every-other-day">Every other day</SelectItem>
                            <SelectItem value="five-on-two-off">5 days on / 2 days off</SelectItem>
                            <SelectItem value="custom" disabled>Custom cadence</SelectItem>
                          </SelectContent>
                        </Select>
                        <ScheduleTimeFields
                          stackPeptide={stackPeptide}
                          idPrefix={`builder-${stackPeptide.peptideId}`}
                          onTimesChange={(timesOfDay) => updateDraftPeptideScheduleTimes(stackPeptide.peptideId, timesOfDay)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {currentStepName === 'Peptides' && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Review</h2>

              {conflictWarnings.length > 0 && (
                <div className="rounded-lg border border-chart-4/50 bg-chart-4/10 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Review warnings</h3>
                  <div className="space-y-2">
                    {conflictWarnings.map((warning) => (
                      <div key={warning.id} className="rounded-md bg-background/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{warning.title}</p>
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {warning.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Stack</p>
                  <p className="font-semibold">{name}</p>
                  {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{durationDays} days</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Compounds</p>
                  {draftPeptides.map((stackPeptide) => {
                    const compound = trackableCompounds.find(p => p.id === stackPeptide.peptideId);
                    return (
                      <div key={stackPeptide.peptideId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{compound?.name}</span>
                        <span>{formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                className="flex-1"
                onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
                disabled={!canGoNext()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                onClick={handleCreate}
                disabled={!name || selectedPeptides.length === 0}
              >
                <Check className="w-4 h-4 mr-1" />
                Create Stack
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
