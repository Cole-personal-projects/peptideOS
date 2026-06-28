"use client";

import { CalendarCheck2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { buildAdherenceSummary, type AdherenceDayStatus } from '@/lib/dashboard-summary';
import { cn } from '@/lib/utils';

const statusClassName: Record<AdherenceDayStatus, string> = {
  empty: 'bg-secondary',
  pending: 'border-chart-4/40 bg-chart-4/30',
  completed: 'border-chart-3/40 bg-chart-3',
  mixed: 'border-destructive/40 bg-destructive/60',
  missed: 'border-destructive/40 bg-destructive',
  skipped: 'border-muted-foreground/30 bg-muted-foreground/50',
};

export function AdherenceCard() {
  const { data } = useApp();
  const summary = buildAdherenceSummary(data, new Date(), 14);
  const activeDays = summary.days.filter((day) => day.completedCount > 0).length;
  const headline = summary.completionPercent === null ? 'No scheduled doses' : `${summary.completionPercent}% complete`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
            Adherence
          </CardTitle>
          <span className="text-xs text-muted-foreground">{headline}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }} aria-label="Recent adherence">
          {summary.days.map((day) => (
            <div
              key={day.dateKey}
              title={`${day.label}: ${day.completedCount} completed, ${day.missedCount} missed, ${day.skippedCount} skipped`}
              aria-label={`${day.label}: ${day.completedCount} completed, ${day.missedCount} missed, ${day.skippedCount} skipped`}
              className={cn('h-8 rounded-sm border border-border/60', statusClassName[day.status])}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px]">
          <div className="rounded-md bg-secondary px-2 py-1">
            <p className="font-semibold">{activeDays}</p>
            <p className="text-muted-foreground">active</p>
          </div>
          <div className="rounded-md bg-secondary px-2 py-1">
            <p className="font-semibold">{summary.delayedCount}</p>
            <p className="text-muted-foreground">late</p>
          </div>
          <div className="rounded-md bg-secondary px-2 py-1">
            <p className="font-semibold">{summary.missedCount}</p>
            <p className="text-muted-foreground">missed</p>
          </div>
          <div className="rounded-md bg-secondary px-2 py-1">
            <p className="font-semibold">{summary.skippedCount}</p>
            <p className="text-muted-foreground">skipped</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
