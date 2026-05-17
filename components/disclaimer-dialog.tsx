"use client";

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/lib/context';

export function DisclaimerDialog() {
  const { data, setHasSeenDisclaimer } = useApp();
  const [open, setOpen] = useState(() => !data.hasSeenDisclaimer);

  const handleAccept = () => {
    setHasSeenDisclaimer(true);
    setOpen(false);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
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
          <AlertDialogAction asChild>
            <Button onClick={handleAccept} className="w-full sm:w-auto">
              I Understand
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
