"use client";

import { CalendarCheck2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { buildAdherenceGrid, type AdherenceLevel } from '@/lib/dashboard-summary';
import { cn } from '@/lib/utils';

const levelClassName: Record<AdherenceLevel, string> = {
  none: 'bg-secondary',
  low: 'bg-primary/35',
  medium: 'bg-primary/70',
  high: 'bg-primary',
};

export function AdherenceCard() {
  const { data } = useApp();
  const grid = buildAdherenceGrid(data.doses, new Date(), 14);
  const activeDays = grid.filter((day) => day.completedCount > 0).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-muted-foreground" />
            Adherence
          </CardTitle>
          <span className="text-xs text-muted-foreground">{activeDays}/14 days</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }} aria-label="Recent adherence">
          {grid.map((day) => (
            <div
              key={day.dateKey}
              title={`${day.label}: ${day.completedCount} completed`}
              aria-label={`${day.label}: ${day.completedCount} completed`}
              className={cn('h-8 rounded-sm border border-border/60', levelClassName[day.level])}
            />
          ))}
        </div>
<div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </CardContent>
    </Card>
  );
}
