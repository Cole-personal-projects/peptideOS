"use client";

import { AppShell } from '@/components/app-shell';
import { CarbonDashboard } from '@/components/dashboard/carbon-dashboard';

export default function DashboardPage() {
  return (
    <AppShell>
      <CarbonDashboard />
    </AppShell>
  );
}
