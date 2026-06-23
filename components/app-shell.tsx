'use client';

import { BottomNav } from '@/components/navigation/bottom-nav';
import { FloatingActionButton } from '@/components/navigation/floating-action-button';
import { RouteHistory } from '@/components/navigation/route-history';
import { DisclaimerDialog } from '@/components/disclaimer-dialog';

interface AppShellProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
  showFloatingAction?: boolean;
}

export function AppShell({ children, showDisclaimer = true, showFloatingAction = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <RouteHistory />
      {showDisclaimer && <DisclaimerDialog />}
      <main className="mx-auto min-h-screen w-full max-w-lg">
        {children}
      </main>
      {showFloatingAction && <FloatingActionButton />}
      <BottomNav />
    </div>
  );
}
