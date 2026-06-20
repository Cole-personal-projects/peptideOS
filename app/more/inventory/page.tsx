"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { getInventoryStockHealthSummary, getVialInventoryMetrics, getVialRunoutForecast } from '@/lib/inventory-metrics';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { data } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('active');
  const [isAddOpen, setIsAddOpen] = useState(() => searchParams.get('add') === 'inventory');
  const initialCompoundId = searchParams.get('compound') ?? undefined;
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
  const stockHealth = getInventoryStockHealthSummary({
    vials: data.vials,
    doses: data.doses,
    schedules: data.schedules,
    scheduleLogs: data.scheduleLogs,
  });
  const batchesById = new Map(data.inventoryBatches.map((batch) => [batch.id, batch]));

  const formatDate = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getInventoryGroups = (vials: typeof data.vials) => {
    const groupedVials = new Map<string, typeof data.vials>();
    const ungroupedVials: typeof data.vials = [];

    for (const vial of vials) {
      if (!vial.inventoryBatchId) {
        ungroupedVials.push(vial);
        continue;
      }

      groupedVials.set(vial.inventoryBatchId, [...(groupedVials.get(vial.inventoryBatchId) ?? []), vial]);
    }

    return [
      ...Array.from(groupedVials.entries()).map(([batchId, batchVials]) => ({
        type: 'batch' as const,
        batchId,
        vials: batchVials,
      })),
      ...ungroupedVials.map((vial) => ({
        type: 'vial' as const,
        vial,
      })),
    ].sort((a, b) => {
      const aDate = a.type === 'batch' ? a.vials[0]?.dateAdded ?? '' : a.vial.dateAdded;
      const bDate = b.type === 'batch' ? b.vials[0]?.dateAdded ?? '' : b.vial.dateAdded;
      return bDate.localeCompare(aDate);
    });
  };

  const renderBatchCard = (batchId: string, batchVials: typeof data.vials) => {
    const firstVial = batchVials[0];
    if (!firstVial) return null;

    const batch = batchesById.get(batchId);
    const compound = trackableCompounds.find((candidate) => candidate.id === firstVial.peptideId);
    const metrics = getVialInventoryMetrics(firstVial, data.doses);
    const statusLabel = firstVial.status === 'expired'
      ? 'expired'
      : firstVial.status === 'finished'
        ? 'finished'
        : firstVial.status;
    const batchName = batch?.name ?? firstVial.name.replace(/\s+vial\s+\d+\s+of\s+\d+$/i, '');
    const statusCounts = batchVials.reduce<Record<string, number>>((counts, vial) => ({
      ...counts,
      [vial.status]: (counts[vial.status] ?? 0) + 1,
    }), {});
    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status} vial${count === 1 ? '' : 's'}`)
      .join(' · ');
    const inventorySummary = batch?.packageUnit === 'kit' && batch.packageQuantity
      ? `${batch.packageQuantity} kit${batch.packageQuantity === 1 ? '' : 's'} / ${batch.vialCount} vials`
      : `${batch?.vialCount ?? batchVials.length} vial${(batch?.vialCount ?? batchVials.length) === 1 ? '' : 's'}`;

    return (
      <Link key={batchId} href={`/more/inventory/${firstVial.id}`}>
        <Card className="hover:bg-secondary/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h3 className="truncate font-semibold">{batchName}</h3>
                <p className="text-xs text-muted-foreground">
                  {compound?.name ?? 'Unknown compound'} · Added {formatDate(firstVial.dateAdded)}
                </p>
              </div>
              <Badge variant={firstVial.status === 'active' ? 'default' : 'secondary'} className="shrink-0 capitalize">
                {statusLabel}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Inventory</p>
                <p className="font-medium">{inventorySummary}</p>
                <p className="text-xs text-muted-foreground">{statusSummary}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium">{metrics.originalLabel} each</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-medium">{firstVial.source || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lot</p>
                <p className="font-medium">{firstVial.lotNumber || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderInventoryItems = (vials: typeof data.vials) => getInventoryGroups(vials).map((item) => {
    if (item.type === 'vial') return renderVialCard(item.vial);
    if (item.vials.length === 1) return renderVialCard(item.vials[0]);
    return renderBatchCard(item.batchId, item.vials);
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
            {activeVials.length > 0 ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Stock health</p>
                      <p className="text-xs text-muted-foreground">Active inventory coverage based on remaining quantity, pending schedules, and expiration timing.</p>
                    </div>
                    <Badge variant={stockHealth.runoutCount > 0 || stockHealth.lowStockCount > 0 ? 'destructive' : 'secondary'}>
                      {stockHealth.runoutCount > 0
                        ? `${stockHealth.runoutCount} runout risk`
                        : stockHealth.lowStockCount > 0
                          ? `${stockHealth.lowStockCount} low stock`
                          : 'Healthy'}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-lg font-semibold">{stockHealth.activeCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Runout risk</p>
                      <p className={cn('text-lg font-semibold', stockHealth.runoutCount > 0 && 'text-destructive')}>{stockHealth.runoutCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Low stock</p>
                      <p className={cn('text-lg font-semibold', stockHealth.lowStockCount > 0 && 'text-chart-4')}>{stockHealth.lowStockCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiring soon</p>
                      <p className={cn('text-lg font-semibold', stockHealth.expiringSoonCount > 0 && 'text-chart-4')}>{stockHealth.expiringSoonCount}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {stockHealth.healthyCount} healthy · {stockHealth.unscheduledCount} unscheduled
                  </p>
                </CardContent>
              </Card>
            ) : null}
            {activeVials.length === 0 ? (
              renderInventoryEmpty('inventory-active-empty')
            ) : (
              renderInventoryItems(activeVials)
            )}
          </TabsContent>

          <TabsContent value="sealed" className="mt-4 space-y-3">
            {sealedVials.length === 0 ? (
              renderInventoryEmpty('inventory-sealed-empty')
            ) : (
              renderInventoryItems(sealedVials)
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {finishedVials.length === 0 ? (
              renderInventoryEmpty('inventory-history-empty')
            ) : (
              renderInventoryItems(finishedVials)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddVialSheet
        key={initialCompoundId ?? 'manual-inventory'}
        open={isAddOpen}
        initialCompoundId={initialCompoundId}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setActiveTab('sealed');
            if (searchParams.get('add') === 'inventory' || searchParams.get('compound')) {
              router.replace('/more/inventory');
            }
          }
        }}
      />
    </AppShell>
  );
}
