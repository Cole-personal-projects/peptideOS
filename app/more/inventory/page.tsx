"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Plus, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { AddVialSheet } from '@/components/navigation/add-vial-sheet';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { getEmptyStateContent, type EmptyStateKey } from '@/lib/empty-states';
import { getVialInventoryMetrics, getVialRunoutForecast } from '@/lib/inventory-metrics';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { data } = useApp();
  const [activeTab, setActiveTab] = useState('active');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const trackableCompounds = getTrackableCompounds(data);

  const getDaysUntilExpiration = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const now = new Date();
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpirationProgress = (reconstitutedDate: string | null, expirationDate: string) => {
    if (!reconstitutedDate) return 100;
    const recon = new Date(reconstitutedDate);
    const exp = new Date(expirationDate);
    const now = new Date();
    const total = exp.getTime() - recon.getTime();
    const remaining = exp.getTime() - now.getTime();
    return Math.max(Math.min((remaining / total) * 100, 100), 0);
  };

  const activeVials = data.vials.filter(v => v.status === 'active');
  const sealedVials = data.vials.filter(v => v.status === 'sealed');
  const finishedVials = data.vials.filter(v => v.status === 'finished' || v.status === 'expired');

  const formatDate = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const renderVialCard = (vial: typeof data.vials[0]) => {
    const compound = trackableCompounds.find((candidate) => candidate.id === vial.peptideId);
    const daysLeft = getDaysUntilExpiration(vial.expirationDate);
    const progress = getExpirationProgress(vial.reconstitutedDate, vial.expirationDate);
    const metrics = getVialInventoryMetrics(vial, data.doses);
    const forecast = getVialRunoutForecast({
      vial,
      doses: data.doses,
      schedules: data.schedules,
      scheduleLogs: data.scheduleLogs,
    });
    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
    const isExpired = daysLeft <= 0;

    return (
      <Link key={vial.id} href={`/more/inventory/${vial.id}`}>
        <Card className="hover:bg-secondary/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{vial.name}</h3>
                  {(isExpiringSoon || isExpired || forecast.isLowStock) && (
                    <AlertCircle className={cn(
                      "w-4 h-4",
                      isExpired || forecast.status === 'runout' ? "text-destructive" : "text-chart-4"
                    )} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {compound?.name ?? 'Unknown compound'} · Added {formatDate(vial.dateAdded)}
                </p>
              </div>
              <Badge variant={vial.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {vial.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium">{metrics.originalLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-medium">{metrics.remainingLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-medium">{vial.source || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Forecast</p>
                <p className={cn("font-medium", forecast.isLowStock && "text-destructive")}>
                  {forecast.label}
                </p>
              </div>
            </div>

            {vial.status === 'active' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Expiration</span>
                  <span className={cn(
                    isExpired ? "text-destructive" : isExpiringSoon ? "text-chart-4" : "text-muted-foreground"
                  )}>
                    {isExpired ? 'Expired' : `${daysLeft} days left`}
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-1.5",
                    isExpired && "[&>div]:bg-destructive",
                    isExpiringSoon && !isExpired && "[&>div]:bg-chart-4"
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderInventoryEmpty = (key: EmptyStateKey) => {
    const emptyState = getEmptyStateContent(key);

    return (
      <Empty className="bg-secondary/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Plus className="w-5 h-5" />
          </EmptyMedia>
          <EmptyTitle>{emptyState.title}</EmptyTitle>
          <EmptyDescription>{emptyState.description}</EmptyDescription>
        </EmptyHeader>
        {emptyState.actionLabel ? (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> {emptyState.actionLabel}
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  };

  return (
    <AppShell>
      <PageHeader 
        title="Inventory" 
        backHref="/more"
        rightElement={
          <Button size="sm" variant="ghost" className="text-primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        }
      />

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeVials.length})
            </TabsTrigger>
            <TabsTrigger value="sealed">
              Sealed ({sealedVials.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({finishedVials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {activeVials.length === 0 ? (
              renderInventoryEmpty('inventory-active-empty')
            ) : (
              activeVials.map(renderVialCard)
            )}
          </TabsContent>

          <TabsContent value="sealed" className="mt-4 space-y-3">
            {sealedVials.length === 0 ? (
              renderInventoryEmpty('inventory-sealed-empty')
            ) : (
              sealedVials.map(renderVialCard)
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {finishedVials.length === 0 ? (
              renderInventoryEmpty('inventory-history-empty')
            ) : (
              finishedVials.map(renderVialCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddVialSheet
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setActiveTab('sealed');
        }}
      />
    </AppShell>
  );
}
