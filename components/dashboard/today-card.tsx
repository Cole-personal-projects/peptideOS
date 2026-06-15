"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';
import { formatDose } from '@/lib/dose-helpers';
import { getVialInventoryMetrics } from '@/lib/inventory-metrics';
import { buildDueDoseInbox, type DueDoseInboxItem, type DueDoseState } from '@/lib/due-doses';
import type { Schedule, ScheduleLog, SiteCode } from '@/lib/types';

const injectableRoutes = new Set(['subq', 'im']);

export function TodayCard() {
  const { data, getTodaysDoses, getTodaysScheduleLogs, getPeptide, updateDose, completeScheduleLog, skipScheduleLog } = useApp();
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
  const [activeLog, setActiveLog] = useState<ScheduleLog | null>(null);
  const [vialId, setVialId] = useState('');
  const [site, setSite] = useState<SiteCode | ''>('');
  const [notes, setNotes] = useState('');
  const [savingLogId, setSavingLogId] = useState<string | null>(null);

  const activeSchedule = useMemo(
    () => activeLog ? data.schedules.find((schedule) => schedule.id === activeLog.scheduleId) : undefined,
    [activeLog, data.schedules],
  );
  const activeVials = activeSchedule
    ? data.vials.filter((vial) => vial.status === 'active' && vial.peptideId === activeSchedule.peptideId)
    : [];
  const requiresSite = activeSchedule ? injectableRoutes.has(activeSchedule.route) : false;
  const canCompleteActiveLog = Boolean(vialId && (!requiresSite || site));

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
    setActiveLog(log);
    setVialId('');
    setSite('');
    setNotes('');
  };

  const closeCompletion = () => {
    setActiveLog(null);
    setVialId('');
    setSite('');
    setNotes('');
  };

  const handleCompleteScheduleLog = async () => {
    if (!activeLog || !vialId || (requiresSite && !site)) return;
    setSavingLogId(activeLog.id);
    try {
      await completeScheduleLog(activeLog.id, { vialId, site, notes });
      closeCompletion();
    } finally {
      setSavingLogId(null);
    }
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
              Start a stack to generate scheduled due doses on the dashboard.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/stacks">Build a stack</Link>
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

      <Dialog open={Boolean(activeLog)} onOpenChange={(open) => !open && closeCompletion()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Complete scheduled dose</DialogTitle>
            <DialogDescription>
              Select the vial and confirm the details used for this scheduled dose.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {activeSchedule && (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-medium">
                  {getPeptide(activeSchedule.peptideId)?.name} · {formatDose(activeSchedule.doseValue, activeSchedule.doseUnit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeSchedule.route.toUpperCase()} route
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Vial</Label>
              {activeVials.length > 0 ? (
                <Select value={vialId} onValueChange={setVialId}>
                  <SelectTrigger aria-label="Vial">
                    <SelectValue placeholder="Select active vial" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVials.map((vial) => {
                      const metrics = getVialInventoryMetrics(vial, data.doses);
                      return (
                        <SelectItem key={vial.id} value={vial.id}>
                          {vial.name} · {vial.lotNumber || 'no lot'} · {metrics.remainingLabel} left
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-chart-4/40 bg-chart-4/10 p-3 text-sm">
                  <p className="font-medium text-chart-4">No active vial available</p>
                  <p className="mt-1 text-muted-foreground">
                    Activate or add a vial in Inventory before completing this scheduled dose.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/more/inventory">Open Inventory</Link>
                  </Button>
                </div>
              )}
            </div>

            {activeSchedule && requiresSite && (
              <div className="space-y-2">
                <Label>Injection Site</Label>
                <BodyMannequin
                  compact
                  doses={data.doses}
                  route={activeSchedule.route}
                  selectedSite={site}
                  onSiteChange={setSite}
                  onRouteChange={() => undefined}
                  getPeptide={getPeptide}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCompletion}>Cancel</Button>
            <Button onClick={() => void handleCompleteScheduleLog()} disabled={!canCompleteActiveLog || savingLogId === activeLog?.id}>
              Complete dose
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
