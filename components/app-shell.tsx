'use client';

import { BottomNav } from '@/components/navigation/bottom-nav';
import { FloatingActionButton } from '@/components/navigation/floating-action-button';
import { RouteHistory } from '@/components/navigation/route-history';
import { DisclaimerDialog } from '@/components/disclaimer-dialog';

interface AppShellProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

export function AppShell({ children, showDisclaimer = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background pb-32">
      <RouteHistory />
      {showDisclaimer && <DisclaimerDialog />}
      {children}
      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
