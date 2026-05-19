"use client";

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/lib/context';
import { formatDose, getDefaultDoseUnit } from '@/lib/dose-helpers';
import { getStackConflictWarnings } from '@/lib/stack-conflicts';
import { stackTemplates, templateToStackDraft } from '@/lib/stack-templates';
import { cn } from '@/lib/utils';
import type { StackPeptide } from '@/lib/types';

interface NewStackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = ['Basics', 'Peptides', 'Schedule', 'Review'] as const;
type BuilderStep = typeof steps[number];

export function NewStackSheet({ open, onOpenChange }: NewStackSheetProps) {
  const { data, addStack } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPeptides, setSelectedPeptides] = useState<string[]>([]);
  const [templatePeptides, setTemplatePeptides] = useState<StackPeptide[] | null>(null);
  const [durationDays, setDurationDays] = useState('28');

  const resetForm = () => {
    setCurrentStep(0);
    setName('');
    setDescription('');
    setSelectedPeptides([]);
    setTemplatePeptides(null);
    setDurationDays('28');
  };

  const getDraftPeptides = (): StackPeptide[] => {
    return selectedPeptides.map(peptideId => {
      const templatePeptide = templatePeptides?.find((item) => item.peptideId === peptideId);
      if (templatePeptide) return { ...templatePeptide };

      const peptide = data.peptides.find(p => p.id === peptideId);
      const doseUnit = getDefaultDoseUnit(peptideId);
      return {
        peptideId,
        doseValue: doseUnit === 'mg' ? 1 : doseUnit === 'iu' ? 2 : 250,
        doseUnit,
        frequency: 'daily',
        route: peptide?.defaultRoute || 'subq',
        timing: 'Morning'
      };
    });
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
  const peptideNameById = Object.fromEntries(data.peptides.map((peptide) => [peptide.id, peptide.name]));
  const conflictWarnings = getStackConflictWarnings({
    draftPeptides,
    existingStacks: data.stacks,
    recentDoses: data.doses,
    peptideNameById,
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>New Stack</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
            <div className="grid grid-cols-4 gap-2" aria-label="Stack builder steps">
              {steps.map((step, index) => (
                <div key={step} className="space-y-1">
                  <div
                    className={cn(
                      "h-1.5 rounded-full bg-secondary",
                      index <= currentStep && "bg-primary"
                    )}
                  />
                  <p className={cn(
                    "text-[10px] font-medium text-muted-foreground truncate",
                    index === currentStep && "text-foreground"
                  )}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {currentStepName === 'Basics' && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Basics</h2>

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
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Peptides</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[42vh] overflow-y-auto p-1">
                {data.peptides.map((peptide) => {
                  const checkboxId = `stack-peptide-${peptide.id}`;
                  return (
                    <label
                      key={peptide.id}
                      htmlFor={checkboxId}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={selectedPeptides.includes(peptide.id)}
                        onCheckedChange={() => handlePeptideToggle(peptide.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium">{peptide.name}</span>
                        <span className="block text-xs text-muted-foreground capitalize">{peptide.defaultRoute}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {currentStepName === 'Schedule' && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Schedule</h2>

              <div className="space-y-2">
                {draftPeptides.map((stackPeptide) => {
                  const peptide = data.peptides.find(p => p.id === stackPeptide.peptideId);
                  return (
                    <div key={stackPeptide.peptideId} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{peptide?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {stackPeptide.frequency} · {stackPeptide.timing} · {stackPeptide.route.toUpperCase()}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {currentStepName === 'Review' && (
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
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground">Peptides</p>
                  {draftPeptides.map((stackPeptide) => {
                    const peptide = data.peptides.find(p => p.id === stackPeptide.peptideId);
                    return (
                      <div key={stackPeptide.peptideId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{peptide?.name}</span>
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
