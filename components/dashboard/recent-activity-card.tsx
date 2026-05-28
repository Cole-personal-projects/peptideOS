"use client";

import Link from 'next/link';
import { ChevronRight, Syringe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { formatDose } from '@/lib/dose-helpers';

export function RecentActivityCard() {
  const { getRecentDoses, getPeptide } = useApp();
  const recentDoses = getRecentDoses(5);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Syringe className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <Link href="/log" className="text-sm text-primary flex items-center">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentDoses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent doses logged</p>
        ) : (
          <div className="space-y-2">
            {recentDoses.map((dose) => {
              const peptide = getPeptide(dose.peptideId);
              return (
                <div key={dose.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium">{peptide?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dose.scheduleLogId ? 'Completed scheduled dose' : 'Logged dose'} · {formatDateTime(dose.dateTime)}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDose(dose.doseValue, dose.doseUnit)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
