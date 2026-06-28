"use client";

import { useState } from 'react';
import { BookOpen, FlaskConical, Layers, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialog,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { emitClientDiagnostic } from '@/lib/client-diagnostics';
import { useApp } from '@/lib/context';
import type { UserMode } from '@/lib/types';

export function DisclaimerDialog() {
  const { data, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<UserMode>(data.userMode);
  const [saving, setSaving] = useState(false);
  const open = !data.hasCompletedOnboarding || saving;

  const handleAccept = async (mode: UserMode = 'beginner') => {
    setSaving(true);
    try {
      emitClientDiagnostic('onboarding_completion_started', { mode, step });
      await completeOnboarding(mode);
      emitClientDiagnostic('onboarding_completed', { mode });
    } finally {
      setSaving(false);
    }
  };

  const progressLabel = step === 1 ? 'Step 1 of 4' : `Step ${step} of 4`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <AlertDialogHeader>
              <div className="relative overflow-hidden rounded-lg border bg-secondary/30 p-5 text-left">
<div className="absolute right-4 top-4 rounded-full border border-primary/30 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                  Research
                </div>
                <div className="mb-5 flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">Welcome to</p>
<h2 className="mt-1 text-2xl font-bold tracking-normal">PeptideOS</h2>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                  A private operating surface for peptide research logs, protocol planning, site rotation, and vial records.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md border bg-background/60 p-2">
                    <p className="font-semibold">Dose</p>
                    <p className="text-muted-foreground">Native units</p>
                  </div>
                  <div className="rounded-md border bg-background/60 p-2">
                    <p className="font-semibold">Sites</p>
                    <p className="text-muted-foreground">Rotation</p>
                  </div>
                  <div className="rounded-md border bg-background/60 p-2">
                    <p className="font-semibold">Vials</p>
                    <p className="text-muted-foreground">Inventory</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {progressLabel}
              </p>
              <AlertDialogTitle className="text-center">Research Purposes Only</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-center space-y-3 text-sm text-muted-foreground">
                  <p>
                    PeptideOS is designed exclusively for tracking research compounds.
                    This application does not provide medical advice, diagnosis, or treatment recommendations.
                  </p>
                  <p className="font-medium text-foreground">
                    All peptides tracked in this app are for legitimate research purposes only.
                    Consult qualified professionals for any health-related decisions.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto" disabled={saving}>
                Set up profile
              </Button>
              <Button type="button" onClick={() => void handleAccept()} className="w-full sm:w-auto" disabled={saving}>
                I Understand
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <AlertDialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {progressLabel}
              </p>
              <AlertDialogTitle className="text-center">Choose content depth</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Pick the default library language. You can still switch modes on library pages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <RadioGroup
              value={selectedMode}
              onValueChange={(value) => setSelectedMode(value as UserMode)}
              className="gap-3"
            >
              <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="beginner" aria-label="Beginner" className="mt-1" />
                <span className="space-y-1">
                  <span className="block font-medium">Beginner</span>
                  <span className="block text-sm text-muted-foreground">
                    Clear summaries, protocol context, and storage notes.
                  </span>
                </span>
              </Label>
              <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="researcher" aria-label="Researcher" className="mt-1" />
                <span className="space-y-1">
                  <span className="block font-medium">Researcher</span>
                  <span className="block text-sm text-muted-foreground">
                    More technical mechanisms and literature-oriented detail.
                  </span>
                </span>
              </Label>
            </RadioGroup>
            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Next
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <AlertDialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-chart-3/10">
                  <Layers className="w-8 h-8 text-chart-3" />
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {progressLabel}
              </p>
              <AlertDialogTitle className="text-center">Core workflows</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                PeptideOS centers on dose logging, protocol planning, reference review, and vial records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Log', 'Protocols', 'Library', 'Inventory'].map((item) => (
                <div key={item} className="rounded-md border bg-secondary/40 p-3 text-center font-medium">
                  {item}
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(4)}>
                Next
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <AlertDialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-chart-2/10">
                  <ShieldCheck className="w-8 h-8 text-chart-2" />
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {progressLabel}
              </p>
              <AlertDialogTitle className="text-center">Ready to track</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Your default library mode is {selectedMode === 'researcher' ? 'Researcher' : 'Beginner'}.
                Research-purpose framing remains available in About and library detail pages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button type="button" onClick={() => void handleAccept(selectedMode)} disabled={saving}>
                Enter PeptideOS
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
