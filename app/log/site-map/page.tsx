"use client";

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { useApp } from '@/lib/context';
import type { Route, SiteCode } from '@/lib/types';

export default function SiteMapPage() {
  const { data, getPeptide } = useApp();
  const [route, setRoute] = useState<Route>('subq');
  const [selectedSite, setSelectedSite] = useState<SiteCode | ''>('');

  return (
    <AppShell>
      <PageHeader title="Site Map" backHref="/log" />

      <main className="space-y-4 p-4">
        <BodyMannequin
          doses={data.doses}
          route={route}
          selectedSite={selectedSite}
          onSiteChange={setSelectedSite}
          onRouteChange={(nextRoute) => {
            setRoute(nextRoute);
            setSelectedSite('');
          }}
          getPeptide={getPeptide}
          showStats
        />
      </main>
    </AppShell>
  );
}
