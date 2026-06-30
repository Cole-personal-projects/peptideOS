"use client";

import { useState } from 'react';
import { BookOpen, CheckCircle2, FlaskConical, Layers, ShieldCheck } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { emitClientDiagnostic } from '@/lib/client-diagnostics';
import { useApp } from '@/lib/context';
import type { UserMode } from '@/lib/types';

const onboardingSteps = [
  { label: 'Purpose', detail: 'Research-use framing' },
  { label: 'Depth', detail: 'Beginner or Researcher' },
  { label: 'Workflow', detail: 'Protocols, stock, labs, logs' },
  { label: 'Ready', detail: 'Saved once, then opens normally' },
];

export function DisclaimerDialog() {
  const { data, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<UserMode>(data.userMode);
  const [saving, setSaving] = useState(false);
  const open = !data.hasCompletedOnboarding || saving;
 const progressLabel = `${step} / ${onboardingSteps.length}`;

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

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-h-[calc(100dvh-1rem)] max-w-md overflow-y-auto p-4 sm:p-6">
        {step === 1 ? (
          <>
            <AlertDialogHeader>
              <div className="relative overflow-hidden rounded-lg border bg-secondary/30 p-5 text-left">
                <div className="absolute right-4 top-4 rounded-full border border-primary/30 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                  First run
                </div>
                <div className="mb-5 flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FlaskConical className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">Welcome to</p>
                <h2 className="mt-1 text-2xl font-bold tracking-normal">PeptideOS</h2>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                  A private operating surface for protocols, dose logs, stock, labs, site rotation, and estimated remaining amount.
                </p>

                <div className="mt-5 space-y-2">
                  {onboardingSteps.map((item, index) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-md border bg-background/70 p-2.5 text-sm">
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{progressLabel}</p>
              <AlertDialogTitle className="text-center">One-time setup</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-center text-sm text-muted-foreground">
                  <p>PeptideOS starts with a short setup so the app can use the right content depth and clearly frame what it does.</p>
                  <p className="font-medium text-foreground">
                    This appears once. After you finish, PeptideOS saves completion locally and opens directly into the app.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <Button type="button" variant="outline" onClick={() => void handleAccept()} className="w-full sm:w-auto" disabled={saving}>
                I Understand
              </Button>
              <Button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto" disabled={saving}>
                Start setup
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <AlertDialogHeader>
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <BookOpen className="size-8 text-primary" />
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{progressLabel}</p>
              <AlertDialogTitle className="text-center">Choose content depth</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Pick the default library language. You can still switch modes on library pages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as UserMode)} className="gap-3">
              <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="beginner" aria-label="Beginner" className="mt-1" />
                <span className="space-y-1">
                  <span className="block font-medium">Beginner</span>
                  <span className="block text-sm text-muted-foreground">Clear summaries, protocol context, and storage notes.</span>
                </span>
              </Label>
              <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="researcher" aria-label="Researcher" className="mt-1" />
                <span className="space-y-1">
                  <span className="block font-medium">Researcher</span>
                  <span className="block text-sm text-muted-foreground">More technical mechanisms and literature-oriented detail.</span>
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
              <div className="flex justify-center">
                <div className="rounded-full bg-chart-3/10 p-3">
                  <Layers className="size-8 text-chart-3" />
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{progressLabel}</p>
              <AlertDialogTitle className="text-center">What you will use first</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Add a protocol, add stock, log doses, and review labs when you have them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Protocols', 'Stock', 'Log', 'Labs'].map((item) => (
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
              <div className="flex justify-center">
                <div className="rounded-full bg-chart-2/10 p-3">
                  <ShieldCheck className="size-8 text-chart-2" />
                </div>
              </div>
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{progressLabel}</p>
              <AlertDialogTitle className="text-center">Ready to track</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Your default library mode is {selectedMode === 'researcher' ? 'Researcher' : 'Beginner'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-lg border bg-secondary/35 p-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-chart-2" />
                <div>
                  <p className="font-medium">Research purposes only</p>
                  <p className="mt-1 text-muted-foreground">
                    PeptideOS tracks saved records, then estimates remaining amount from saved assumptions. No diagnosis,
                    treatment, dosing, safety, or optimization advice.
                  </p>
                </div>
              </div>
            </div>
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
