"use client";

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { WelcomeScreen } from '@/components/welcome-screen';
import { emitClientDiagnostic } from '@/lib/client-diagnostics';
import { useApp } from '@/lib/context';

export default function WelcomePage() {
  const { data } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (showOnboarding && !data.hasCompletedOnboarding) {
    return (
      <AppShell>
        <span className="sr-only">Starting PeptideOS</span>
      </AppShell>
    );
  }

  return (
    <WelcomeScreen
      completedOnboarding={data.hasCompletedOnboarding}
      onGetStarted={() => {
        emitClientDiagnostic('onboarding_started', { source: 'welcome' });
        setShowOnboarding(true);
      }}
    />
  );
}
