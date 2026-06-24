"use client";

import { useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, FlaskConical, Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { AddVialSheet } from '@/components/navigation/add-vial-sheet';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricTile, StatusDot } from '@/components/ui/visual-primitives';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { useApp } from '@/lib/context';
import { getEmptyStateContent, type EmptyStateKey } from '@/lib/empty-states';
import { getInventoryStockHealthSummary, getVialInventoryMetrics, getVialRunoutForecast } from '@/lib/inventory-metrics';
import { cn } from '@/lib/utils';
import type { InventoryBatch, Vial } from '@/lib/types';

export default function InventoryPage() {
  const { data } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('active');
  const [isAddOpen, setIsAddOpen] = useState(() => searchParams.get('add') === 'inventory');
  const initialCompoundId = searchParams.get('compound') ?? undefined;
  const compounds = getTrackableCompounds(data);
  const stockHealth = getInventoryStockHealthSummary({
    vials: data.vials,
    doses: data.doses,
    schedules: data.schedules,
    scheduleLogs: data.scheduleLogs,
  });

  const activeVials = data.vials.filter((vial) => vial.status === 'active');
  const sealedVials = data.vials.filter((vial) => vial.status === 'sealed');
  const historyVials = data.vials.filter((vial) => vial.status === 'finished' || vial.status === 'expired');
  const activeCards = getInventoryCardItems(activeVials, data.vials, data.inventoryBatches);
  const sealedCards = getInventoryCardItems(sealedVials, data.vials, data.inventoryBatches);
  const historyCards = getInventoryCardItems(historyVials, data.vials, data.inventoryBatches);
  const stockRiskLabel = stockHealth.runoutCount > 0
    ? `${stockHealth.runoutCount} runout`
    : stockHealth.lowStockCount > 0
      ? `${stockHealth.lowStockCount} low`
      : stockHealth.expiringSoonCount > 0
        ? `${stockHealth.expiringSoonCount} expiring`
        : 'Clear';

  const renderEmpty = (key: EmptyStateKey) => {
    const emptyState = getEmptyStateContent(key);
    return (
      <Empty className="rounded-[20px] bg-secondary/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Plus className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>{emptyState.title}</EmptyTitle>
          <EmptyDescription>{emptyState.description}</EmptyDescription>
        </EmptyHeader>
        {emptyState.actionLabel && (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> {emptyState.actionLabel}
            </Button>
          </EmptyContent>
        )}
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
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        }
      />

      <div className="space-y-4 p-4">
        <section className="grid grid-cols-4 gap-2">
          <MetricTile label="Active" value={activeVials.length} tone="success" />
          <MetricTile label="Sealed" value={sealedVials.length} tone="primary" />
          <MetricTile label="History" value={historyVials.length} tone="muted" />
          <MetricTile label="Risk" value={stockRiskLabel} tone={stockRiskLabel === 'Clear' ? 'success' : stockHealth.runoutCount > 0 ? 'danger' : 'warning'} />
        </section>

        {activeVials.length > 0 && (
          <section className="rounded-[20px] border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Stock health</p>
                <p className="text-xs text-muted-foreground">{stockHealth.healthyCount} healthy · {stockHealth.unscheduledCount} unscheduled</p>
              </div>
              <Badge variant={stockHealth.runoutCount > 0 || stockHealth.lowStockCount > 0 ? 'destructive' : 'secondary'}>
                {stockHealth.runoutCount > 0
                  ? `${stockHealth.runoutCount} runout risk`
                  : stockHealth.lowStockCount > 0
                    ? `${stockHealth.lowStockCount} low stock`
                    : 'Covered'}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                ['Covered', stockHealth.healthyCount, 'bg-chart-3'],
                ['Runout', stockHealth.runoutCount, 'bg-destructive'],
                ['Low', stockHealth.lowStockCount, 'bg-chart-4'],
                ['Expiring', stockHealth.expiringSoonCount, 'bg-chart-4'],
              ].map(([label, value, color]) => (
                <div key={label} className="space-y-1">
                  <div className="h-8 overflow-hidden rounded-[8px] bg-secondary">
                    <div className={cn('h-full rounded-[8px]', color)} style={{ width: `${Math.min(Number(value) * 28, 100)}%` }} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active ({activeVials.length})</TabsTrigger>
            <TabsTrigger value="sealed">Sealed ({sealedVials.length})</TabsTrigger>
            <TabsTrigger value="history">History ({historyVials.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
              {activeCards.length === 0 ? renderEmpty('inventory-active-empty') : activeCards.map((item) => <StockCard key={item.batch?.id ?? item.vial.id} item={item} compounds={compounds} doses={data.doses} schedules={data.schedules} scheduleLogs={data.scheduleLogs} />)}
          </TabsContent>
          <TabsContent value="sealed" className="mt-4 space-y-3">
              {sealedCards.length === 0 ? renderEmpty('inventory-sealed-empty') : sealedCards.map((item) => <StockCard key={item.batch?.id ?? item.vial.id} item={item} compounds={compounds} doses={data.doses} schedules={data.schedules} scheduleLogs={data.scheduleLogs} />)}
          </TabsContent>
          <TabsContent value="history" className="mt-4 space-y-3">
              {historyCards.length === 0 ? renderEmpty('inventory-history-empty') : historyCards.map((item) => <StockCard key={item.batch?.id ?? item.vial.id} item={item} compounds={compounds} doses={data.doses} schedules={data.schedules} scheduleLogs={data.scheduleLogs} />)}
          </TabsContent>
        </Tabs>
      </div>

      <AddVialSheet
        key={initialCompoundId ?? 'manual-inventory'}
        open={isAddOpen}
        initialCompoundId={initialCompoundId}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setActiveTab('sealed');
          if (searchParams.get('add') === 'inventory' || searchParams.get('compound')) router.replace('/more/inventory');
        }}
      />
    </AppShell>
  );
}

interface InventoryCardItem {
  vial: Vial;
  batch?: InventoryBatch;
  batchVials: Vial[];
}

function StockCard({
  item,
  compounds,
  doses,
  schedules,
  scheduleLogs,
}: {
  item: InventoryCardItem;
  compounds: ReturnType<typeof getTrackableCompounds>;
  doses: Parameters<typeof getVialInventoryMetrics>[1];
  schedules: Parameters<typeof getVialRunoutForecast>[0]['schedules'];
  scheduleLogs: Parameters<typeof getVialRunoutForecast>[0]['scheduleLogs'];
}) {
  const { vial, batch, batchVials } = item;
  const compound = compounds.find((candidate) => candidate.id === vial.peptideId);
  const metrics = getVialInventoryMetrics(vial, doses);
  const forecast = getVialRunoutForecast({ vial, doses, schedules, scheduleLogs });
  const remainingPercent = metrics.originalMg > 0 ? Math.min(Math.max((metrics.remainingMg / metrics.originalMg) * 100, 0), 100) : 0;
  const expirationDays = vial.expirationDate ? getDaysUntil(vial.expirationDate) : null;
  const riskTone = vial.status === 'expired' || forecast.status === 'runout' ? 'danger' : forecast.isLowStock || (expirationDays !== null && expirationDays <= 14) ? 'warning' : 'success';
  const displayName = batch?.name ?? vial.name;
  const lotNumber = batch?.lotNumber || vial.lotNumber || 'no lot';
  const addedLabel = `Added ${formatInventoryDate(vial.dateAdded)}`;
  const sourceLabel = `Source ${batch?.source || vial.source || 'Unknown'}`;
  const batchSummary = batch ? getBatchInventorySummary(batch, batchVials) : null;
  const batchAmount = batch ? `${formatAmount(batch.totalAmount?.value ?? batch.mg)} ${batch.totalAmount?.unit ?? 'mg'} each` : null;
  const batchStatus = batch ? getBatchStatusSummary(batchVials) : null;
  const linkLabel = `${displayName} ${compound?.name ?? vial.peptideId} ${lotNumber} ${addedLabel} ${sourceLabel} ${batchSummary ?? ''} ${batchAmount ?? ''} ${batchStatus ?? vial.status}`;

  return (
    <Link href={`/more/inventory/${vial.id}`} className="block" aria-label={linkLabel}>
      <article className="rounded-[20px] border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusDot tone={riskTone} />
              <h3 className="truncate text-sm font-bold">{displayName}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{compound?.name ?? vial.peptideId} · {lotNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {addedLabel} · {sourceLabel}
            </p>
            {batch && (
              <p className="mt-1 text-xs font-semibold text-foreground">
                {batchSummary} · {batchAmount} · {batchStatus}
              </p>
            )}
          </div>
          <Badge variant={riskTone === 'danger' ? 'destructive' : 'secondary'} className="capitalize">{vial.status}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Remaining</span>
            <span className="font-bold">{metrics.remainingLabel}</span>
          </div>
          <Progress value={remainingPercent} className="h-2 bg-secondary" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs min-[420px]:grid-cols-4">
          <VisualFact icon={<FlaskConical className="h-3.5 w-3.5" />} label="Start" value={metrics.originalLabel} />
          <VisualFact icon={<AlertCircle className="h-3.5 w-3.5" />} label="Expiration" value={expirationDays === null ? 'None' : expirationDays < 0 ? 'Expired' : `${expirationDays} days left`} />
          <VisualFact icon={<StatusDot tone={riskTone} className="h-3.5 w-3.5" />} label="Status" value={forecast.label} />
          <VisualFact icon={<StatusDot tone="muted" className="h-3.5 w-3.5" />} label="Source" value={vial.source || 'Unknown'} />
        </div>
      </article>
    </Link>
  );
}

function VisualFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-secondary/60 p-2">
      <div className="mb-1 flex items-center gap-1.5 text-primary">{icon}<span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span></div>
      <p className="truncate text-xs font-bold">{value}</p>
    </div>
  );
}

function getInventoryCardItems(filteredVials: Vial[], allVials: Vial[], batches: InventoryBatch[]): InventoryCardItem[] {
  const batchesById = new Map(batches.map((batch) => [batch.id, batch]));
  const seenBatchIds = new Set<string>();

  return filteredVials.flatMap((vial) => {
    const batch = vial.inventoryBatchId ? batchesById.get(vial.inventoryBatchId) : undefined;
    if (!batch || batch.vialCount <= 1) return [{ vial, batchVials: [vial] }];
    if (seenBatchIds.has(batch.id)) return [];

    seenBatchIds.add(batch.id);
    const batchVials = allVials.filter((candidate) => candidate.inventoryBatchId === batch.id);
    return [{ vial, batch, batchVials }];
  });
}

function getBatchInventorySummary(batch: InventoryBatch, batchVials: Vial[]) {
  if (batch.packageUnit === 'kit' && batch.packageQuantity) {
    return `${batch.packageQuantity} kit${batch.packageQuantity === 1 ? '' : 's'} / ${batch.vialCount} vials`;
  }
  return `${batchVials.length || batch.vialCount} vials`;
}

function getBatchStatusSummary(batchVials: Vial[]) {
  const counts = batchVials.reduce<Record<Vial['status'], number>>(
    (next, vial) => {
      next[vial.status] += 1;
      return next;
    },
    { active: 0, sealed: 0, finished: 0, expired: 0 },
  );

  return (Object.entries(counts) as Array<[Vial['status'], number]>)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${status} vial${count === 1 ? '' : 's'}`)
    .join(' · ');
}

function formatAmount(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
}

function getDaysUntil(dateValue: string) {
  const target = new Date(dateValue);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function formatInventoryDate(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateValue));
}
