"use client";

import { Activity, BarChart3, MapPin, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  calculateRotationScore,
  getMostUsedZone,
  getUnderusedZones,
  getZoneStats,
  INJECTION_ZONES,
} from '@/lib/injection-zones';
import type { Dose } from '@/lib/types';

interface RotationStatsPanelProps {
  doses: Dose[];
}

export function RotationStatsPanel({ doses }: RotationStatsPanelProps) {
  const score = calculateRotationScore(doses);
  const mostUsed = getMostUsedZone(doses);
  const underused = getUnderusedZones(doses, 10).slice(0, 6);
  const zoneBars = INJECTION_ZONES
    .map((zone) => ({ zone, count: getZoneStats(doses, zone.id).dosesLast30Days }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxCount = Math.max(1, ...zoneBars.map((entry) => entry.count));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              Rotation
            </div>
            <p className="text-2xl font-semibold">{score}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Most Used
            </div>
            <p className="truncate text-sm font-medium">{mostUsed?.zone.label ?? 'None'}</p>
            <p className="text-xs text-muted-foreground">{mostUsed ? `${mostUsed.count} in 30d` : 'No history'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4" />
            Underused
          </div>
          <div className="flex flex-wrap gap-2">
            {underused.map((zone) => (
              <Badge key={zone.id} variant="secondary" className="text-xs">
                {zone.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Last 30 Days
          </div>
          {zoneBars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed injection history yet.</p>
          ) : (
            zoneBars.map(({ zone, count }) => (
              <div key={zone.id} className="grid grid-cols-[126px_1fr_24px] items-center gap-2 text-xs">
                <span className="truncate text-muted-foreground">{zone.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.max(10, (count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="text-right tabular-nums">{count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
