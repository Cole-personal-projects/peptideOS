"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, CalendarClock, ChevronRight, ClipboardList, FlaskConical, MessageSquareText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { buildDashboardEstimatedRemainingPreview } from '@/lib/estimated-remaining-preview';
import { buildProtocolCockpitSummary, type ProtocolTimelineEvent } from '@/lib/protocol-timeline';
import { cn } from '@/lib/utils';

type CockpitFilter = 'all' | 'due' | 'runway' | 'signals';

const statusClassName: Record<string, string> = {
  overdue: 'border-destructive/40 bg-destructive/10 text-destructive',
  pending: 'border-primary/40 bg-primary/10 text-primary',
  taken: 'border-chart-3/40 bg-chart-3/10 text-chart-3',
  completed: 'border-chart-3/40 bg-chart-3/10 text-chart-3',
  skipped: 'border-muted bg-secondary text-muted-foreground',
  missed: 'border-destructive/40 bg-destructive/10 text-destructive',
  runout: 'border-destructive/40 bg-destructive/10 text-destructive',
  'low-stock': 'border-chart-4/40 bg-chart-4/10 text-chart-4',
  expiring: 'border-chart-4/40 bg-chart-4/10 text-chart-4',
  expired: 'border-destructive/40 bg-destructive/10 text-destructive',
  logged: 'border-border bg-secondary text-muted-foreground',
};

function eventIcon(event: ProtocolTimelineEvent) {
  if (event.kind === 'inventory') return <FlaskConical className="h-4 w-4" />;
  if (event.kind === 'signal') return <MessageSquareText className="h-4 w-4" />;
  if (event.kind === 'dose-log') return <ClipboardList className="h-4 w-4" />;
  return <CalendarClock className="h-4 w-4" />;
}

function formatEventTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(value: string) {
  return value.replace(/-/g, ' ');
}

function formatEstimatedRemainingMg(value: number): string {
  if (value < 0.01) return '<0.01 mg';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} mg`;
}

function formatHalfLife(hours: number): string {
  if (hours % 24 === 0) return `${hours / 24} day${hours === 24 ? '' : 's'}`;
  return `${hours} hours`;
}

export function ProtocolCockpitCard() {
  const { data } = useApp();
  const [filter, setFilter] = useState<CockpitFilter>('all');
  const summary = buildProtocolCockpitSummary(data);
  const estimatedRemainingRows = buildDashboardEstimatedRemainingPreview(data);
  const filteredEvents = summary.events.filter((event) => {
    if (filter === 'due') return event.kind === 'due-dose';
    if (filter === 'runway') return event.kind === 'inventory';
    if (filter === 'signals') return event.kind === 'signal';
    return true;
  });
  const visibleEvents = filteredEvents.slice(0, 6);

  const hasNoProtocolState = summary.events.length === 0 && summary.activeStackCount === 0;
  const hasNoFilteredEvents = !hasNoProtocolState && visibleEvents.length === 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Protocol Cockpit
          </CardTitle>
          <Button asChild size="sm" variant="ghost" className="h-8 px-2">
            <Link href="/log">
              Log <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-md border bg-secondary/30 p-2">
            <p className="text-lg font-semibold">{summary.dueCount}</p>
            <p className="text-[11px] text-muted-foreground">Due</p>
          </div>
          <div className="rounded-md border bg-secondary/30 p-2">
            <p className="text-lg font-semibold">{summary.completedTodayCount}</p>
            <p className="text-[11px] text-muted-foreground">Done</p>
          </div>
          <div className="rounded-md border bg-secondary/30 p-2">
            <p className="text-lg font-semibold">{summary.inventoryRiskCount}</p>
            <p className="text-[11px] text-muted-foreground">Runway</p>
          </div>
          <div className="rounded-md border bg-secondary/30 p-2">
            <p className="text-lg font-semibold">{summary.activeStackCount}</p>
            <p className="text-[11px] text-muted-foreground">Stacks</p>
          </div>
        </div>

        {(summary.overdueCount > 0 || summary.inventoryRiskCount > 0) && (
          <div className="flex items-start gap-2 rounded-md border border-chart-4/40 bg-chart-4/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-chart-4" />
            <p>
              {summary.overdueCount > 0 ? `${summary.overdueCount} overdue item${summary.overdueCount === 1 ? '' : 's'}. ` : ''}
              {summary.inventoryRiskCount > 0 ? `${summary.inventoryRiskCount} inventory runway warning${summary.inventoryRiskCount === 1 ? '' : 's'}.` : ''}
            </p>
          </div>
        )}

        {summary.nextAction && (
          <Link href={summary.nextAction.href ?? '/'} className="block rounded-md border border-primary/30 bg-primary/10 p-3 transition-colors hover:bg-primary/15">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-primary">{eventIcon(summary.nextAction)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Next action</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{summary.nextAction.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.nextAction.detail}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
            </div>
            </Link>
          )}

          {estimatedRemainingRows.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Estimated remaining amount</p>
              </div>
              <div className="space-y-2">
                {estimatedRemainingRows.map((row) => (
                  <Link key={`${row.stackId}:${row.compoundId}`} href={row.href} className="block rounded-md bg-secondary/50 p-2 transition-colors hover:bg-secondary">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.compoundName}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.stackName} · half-life assumption {formatHalfLife(row.halfLifeHours)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatEstimatedRemainingMg(row.actualEstimatedRemainingMg)}</p>
                        <p className="text-[11px] text-muted-foreground">{row.actualEventCount} completed</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">First-order estimate from logged completed doses. Not measured concentration or dose guidance.</p>
            </div>
          )}

          {!hasNoProtocolState && (
          <div className="grid grid-cols-4 gap-1 rounded-md bg-secondary p-1">
            {([
              ['all', 'All'],
              ['due', 'Due'],
              ['runway', 'Runway'],
              ['signals', 'Signals'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'rounded-sm px-2 py-1.5 text-xs font-medium transition-colors',
                  filter === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {hasNoProtocolState ? (
          <div className="space-y-3 rounded-md border border-dashed p-4">
            <div>
              <p className="text-sm font-medium">No protocol activity yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Build a stack, add inventory, or log a signal to turn the dashboard into your daily protocol cockpit.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button asChild size="sm" variant="outline">
                <Link href="/stacks?add=protocol">Build stack</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/more/inventory?add=inventory">Add inventory</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/more/signals">Log signal</Link>
              </Button>
            </div>
          </div>
        ) : hasNoFilteredEvents ? (
          <div className="rounded-md border border-dashed p-4">
            <p className="text-sm font-medium">No {filter === 'runway' ? 'inventory runway' : filter} events right now</p>
            <p className="mt-1 text-sm text-muted-foreground">Switch filters or add more protocol data to see this view.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleEvents.map((event) => (
              <Link key={event.id} href={event.href ?? '/'} className="block rounded-md border p-3 transition-colors hover:bg-secondary/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">{eventIcon(event)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{event.label}</p>
                      <Badge variant="outline" className={cn('capitalize', statusClassName[event.status])}>
                        {statusLabel(event.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  <p className="text-right text-[11px] text-muted-foreground">{formatEventTime(event.occurredAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {summary.latestSignal && (
          <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            Latest signal: {summary.latestSignal.detail}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
