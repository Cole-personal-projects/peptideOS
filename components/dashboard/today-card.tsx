"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickConfirmDoseDialog } from '@/components/dashboard/quick-confirm-dose-dialog';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';
import { formatDose } from '@/lib/dose-helpers';
import { buildDueDoseInbox, type DueDoseInboxItem, type DueDoseState } from '@/lib/due-doses';
import type { Schedule, ScheduleLog } from '@/lib/types';

export function TodayCard() {
  const { data, getTodaysDoses, getTodaysScheduleLogs, getPeptide, updateDose, skipScheduleLog } = useApp();
  const todaysDoses = getTodaysDoses();
  const todaysScheduleLogs = getTodaysScheduleLogs();
  const dueDoseInbox = useMemo(() => buildDueDoseInbox(data), [data]);
  const overdueLogIds = new Set(dueDoseInbox.filter((item) => item.state === 'overdue').map((item) => item.log.id));
  const todayScheduleItems = todaysScheduleLogs
    .filter((log) => !overdueLogIds.has(log.id))
    .reduce<DueDoseInboxItem[]>((items, log) => {
      const schedule = data.schedules.find((candidate) => candidate.id === log.scheduleId);
      if (!schedule) return items;

      const state: DueDoseState = log.status === 'pending' && new Date(log.dueAt) > new Date() ? 'upcoming' : 'due';
      return [...items, { log, schedule, state }];
    }, []);
  const scheduleRows: DueDoseInboxItem[] = [
    ...dueDoseInbox.filter((item) => item.state === 'overdue'),
    ...todayScheduleItems,
  ];
  const standaloneDoses = todaysDoses.filter((dose) => !dose.scheduleLogId);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [savingLogId, setSavingLogId] = useState<string | null>(null);

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

  const openCompletion = (log: ScheduleLog) => {
    setActiveLogId(log.id);
  };

  const closeCompletion = () => {
    setActiveLogId(null);
  };

  const handleSkipScheduleLog = async (logId: string) => {
    setSavingLogId(logId);
    try {
      await skipScheduleLog(logId);
    } finally {
      setSavingLogId(null);
    }
  };

  if (scheduleRows.length === 0 && standaloneDoses.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">No doses due today</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a protocol to generate scheduled due doses on the dashboard.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/stacks">Build a protocol</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedCount = scheduleRows.filter(({ log }) => log.status === 'taken' || log.status === 'skipped').length + standaloneDoses.filter(d => d.completed).length;
  const totalCount = scheduleRows.length + standaloneDoses.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const pendingCount = scheduleRows.filter(({ log }) => log.status === 'pending').length + standaloneDoses.filter((dose) => !dose.completed).length;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Today
            </CardTitle>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} completed
              </span>
              <span className="text-xs font-medium text-primary">
                {pendingCount > 0 ? 'Due today' : 'Taken today'}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingCount === 0 && (
            <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
              All scheduled items are handled for today.
            </p>
          )}
          {scheduleRows.map(({ log, schedule, state }) => {
            const peptide = getPeptide(log.peptideId);
            const isTaken = log.status === 'taken';
            const isSkipped = log.status === 'skipped';
            const isSavingLog = savingLogId === log.id;
            const statusLabel = isSavingLog ? 'Saving...' : isTaken ? 'Taken today' : isSkipped ? 'Skipped today' : state === 'overdue' ? 'Overdue' : 'Pending action';
            return (
              <div key={log.id} className={cn("rounded-md border border-border p-3", state === 'overdue' && "border-destructive/50 bg-destructive/5", (isTaken || isSkipped) && "opacity-60")}>
                <div className="flex items-start gap-3">
                  {isTaken ? (
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("font-medium text-sm", isTaken && "line-through")}>
                        {peptide?.name} - {formatDose(schedule.doseValue, schedule.doseUnit)}
                      </p>
                      <Badge variant={isTaken ? 'default' : isSkipped ? 'secondary' : state === 'overdue' ? 'destructive' : 'outline'}>
                        {statusLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {formatTime(log.dueAt)} · {schedule?.route.toUpperCase()}
                    </p>
                  </div>
                </div>
                {log.status === 'pending' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled={isSavingLog} onClick={() => void handleSkipScheduleLog(log.id)}>
                      Skip
                    </Button>
                    <Button size="sm" disabled={isSavingLog} onClick={() => openCompletion(log)}>
                      Complete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {standaloneDoses.map((dose) => {
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
                    {formatTime(dose.dateTime)} · {dose.route.toUpperCase()} · {dose.completed ? 'Taken today' : 'Pending action'}
                  </p>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <QuickConfirmDoseDialog
        logId={activeLogId}
        open={Boolean(activeLogId)}
        onOpenChange={(open) => !open && closeCompletion()}
        title="Complete scheduled dose"
        description="Select the vial and confirm the details used for this scheduled dose."
        confirmLabel="Complete dose"
      />
    </>
  );
}
