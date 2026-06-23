"use client";

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { CarbonDashboard } from '@/components/dashboard/carbon-dashboard';
import { WelcomeScreen } from '@/components/welcome-screen';
import { useApp } from '@/lib/context';

export default function DashboardPage() {
  const { data } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (!data.hasCompletedOnboarding && !showOnboarding) {
    return <WelcomeScreen onGetStarted={() => setShowOnboarding(true)} />;
  }

  return (
    <AppShell>
      <CarbonDashboard />
    </AppShell>
  );
}
