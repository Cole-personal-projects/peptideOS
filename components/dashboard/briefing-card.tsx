"use client";

import { Activity, FlaskConical, Layers, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/lib/context';
import { buildDashboardBriefing } from '@/lib/dashboard-summary';

export function BriefingCard() {
  const { data } = useApp();
  const briefing = buildDashboardBriefing(data);

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Today&apos;s Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dose completion</span>
            <span className="text-sm font-medium">
              {briefing.completedToday}/{briefing.scheduledToday}
            </span>
          </div>
          <Progress value={briefing.completionPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border bg-secondary/30 p-3">
            <Target className="mb-2 w-4 h-4 text-primary" />
            <p className="text-lg font-semibold">{briefing.pendingToday}</p>
            <p className="text-[11px] text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-md border bg-secondary/30 p-3">
            <Layers className="mb-2 w-4 h-4 text-chart-3" />
            <p className="text-lg font-semibold">{briefing.activeStacks}</p>
            <p className="text-[11px] text-muted-foreground">Protocols</p>
          </div>
          <div className="rounded-md border bg-secondary/30 p-3">
            <FlaskConical className="mb-2 w-4 h-4 text-chart-4" />
            <p className="text-lg font-semibold">{briefing.activeVials}</p>
            <p className="text-[11px] text-muted-foreground">Vials</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
