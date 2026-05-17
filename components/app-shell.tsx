"use client";

import { BottomNav } from '@/components/navigation/bottom-nav';
import { FloatingActionButton } from '@/components/navigation/floating-action-button';
import { DisclaimerDialog } from '@/components/disclaimer-dialog';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-32">
      <DisclaimerDialog />
      {children}
      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
