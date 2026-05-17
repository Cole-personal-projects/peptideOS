"use client";

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';
import { formatDose } from '@/lib/dose-helpers';

export function TodayCard() {
  const { getTodaysDoses, getPeptide, updateDose } = useApp();
  const todaysDoses = getTodaysDoses();

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleToggleDose = (doseId: string, completed: boolean) => {
    updateDose(doseId, { completed: !completed });
  };

  if (todaysDoses.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No doses scheduled for today</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = todaysDoses.filter(d => d.completed).length;
  const progress = Math.round((completedCount / todaysDoses.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Today
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{todaysDoses.length} completed
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {todaysDoses.map((dose) => {
          const peptide = getPeptide(dose.peptideId);
          return (
            <Button
              key={dose.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto py-2 px-3",
                dose.completed && "opacity-60"
              )}
              onClick={() => handleToggleDose(dose.id, dose.completed)}
            >
              {dose.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
              )}
              <div className="flex-1 text-left">
                <p className={cn("font-medium text-sm", dose.completed && "line-through")}>
                  {peptide?.name} - {formatDose(dose.doseValue, dose.doseUnit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(dose.dateTime)} · {dose.route.toUpperCase()}
                </p>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
