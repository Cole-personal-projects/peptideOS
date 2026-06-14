"use client";

import Link from 'next/link';
import { ChevronRight, AlertCircle, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';
import { getVialRunoutForecast } from '@/lib/inventory-metrics';

export function InventoryStatusCard() {
  const { data, getPeptide } = useApp();
  const activeVials = data.vials.filter(v => v.status === 'active');

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

  if (activeVials.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-muted-foreground" />
              Inventory
            </CardTitle>
            <Link href="/more/inventory" className="text-sm text-primary flex items-center">
              Manage <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No active vials</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
            Active Inventory
          </CardTitle>
          <Link href="/more/inventory" className="text-sm text-primary flex items-center">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeVials.slice(0, 4).map((vial) => {
          const peptide = getPeptide(vial.peptideId);
          const daysLeft = getDaysUntilExpiration(vial.expirationDate);
          const progress = getExpirationProgress(vial.reconstitutedDate, vial.expirationDate);
          const forecast = getVialRunoutForecast({
            vial,
            doses: data.doses,
            schedules: data.schedules,
            scheduleLogs: data.scheduleLogs,
          });
          const isExpiringSoon = daysLeft <= 7;
          const isExpired = daysLeft <= 0;

          return (
            <Link key={vial.id} href={`/more/inventory/${vial.id}`} className="block">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors -mx-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{peptide?.name}</p>
                    {(isExpiringSoon || isExpired || forecast.isLowStock) && (
                      <AlertCircle className={cn(
                        "w-3.5 h-3.5 flex-shrink-0",
                        isExpired || forecast.status === 'runout' ? "text-destructive" : "text-chart-4"
                      )} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {forecast.status === 'unscheduled' ? `${vial.mg}mg · ${vial.lotNumber}` : forecast.label}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    "text-xs font-medium",
                    isExpired ? "text-destructive" : isExpiringSoon ? "text-chart-4" : "text-muted-foreground"
                  )}>
                    {isExpired ? 'Expired' : `${daysLeft}d left`}
                  </p>
                  <Progress 
                    value={progress} 
                    className={cn(
                      "h-1 w-16 mt-1",
                      isExpired && "[&>div]:bg-destructive",
                      isExpiringSoon && !isExpired && "[&>div]:bg-chart-4"
                    )}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
