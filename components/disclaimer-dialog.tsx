"use client";

import { useState } from 'react';
import { AlertTriangle, BookOpen, Layers, ShieldCheck } from 'lucide-react';
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
import { useApp } from '@/lib/context';
import type { UserMode } from '@/lib/types';

export function DisclaimerDialog() {
  const { data, completeOnboarding } = useApp();
  const [open, setOpen] = useState(() => !data.hasCompletedOnboarding);
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<UserMode>(data.userMode);

  const handleAccept = (mode: UserMode = 'beginner') => {
    completeOnboarding(mode);
    setOpen(false);
  };

  const progressLabel = step === 1 ? 'Step 1 of 4' : `Step ${step} of 4`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <AlertDialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
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
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">
                Set up profile
              </Button>
              <Button type="button" onClick={() => handleAccept()} className="w-full sm:w-auto">
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
                PeptideOS centers on dose logging, stack planning, reference review, and vial records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Log', 'Stacks', 'Library', 'Inventory'].map((item) => (
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
              <Button type="button" onClick={() => handleAccept(selectedMode)}>
                Enter PeptideOS
              </Button>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
