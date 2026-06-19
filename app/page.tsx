"use client";

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TodayCard } from '@/components/dashboard/today-card';
import { ActiveStacksCarousel } from '@/components/dashboard/active-stacks-carousel';
import { InventoryStatusCard } from '@/components/dashboard/inventory-status-card';
import { StreakCard } from '@/components/dashboard/streak-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { BriefingCard } from '@/components/dashboard/briefing-card';
import { AdherenceCard } from '@/components/dashboard/adherence-card';
import { WelcomeScreen } from '@/components/welcome-screen';
import { useApp } from '@/lib/context';

function DashboardHeader() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="px-4 pt-6 pb-4">
      <p className="text-muted-foreground text-sm">{dateStr}</p>
      <h1 className="text-2xl font-bold mt-1">{greeting}</h1>
    </header>
  );
}

export default function DashboardPage() {
  const { data } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (!data.hasCompletedOnboarding && !showOnboarding) {
    return <WelcomeScreen onGetStarted={() => setShowOnboarding(true)} />;
  }

  return (
    <AppShell>
      <DashboardHeader />
      
      <div className="space-y-4">
        <div className="px-4">
          <BriefingCard />
        </div>

        <div className="px-4">
          <TodayCard />
        </div>

        <ActiveStacksCarousel />

        <div className="px-4 space-y-4">
          <StreakCard />

          <AdherenceCard />
          
          <InventoryStatusCard />
          
          <RecentActivityCard />
        </div>
      </div>
    </AppShell>
  );
}
