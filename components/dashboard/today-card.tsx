"use client";

import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';
import { formatDose } from '@/lib/dose-helpers';
import type { ScheduleLog, SiteCode } from '@/lib/types';

const injectableRoutes = new Set(['subq', 'im']);

export function TodayCard() {
  const { data, getTodaysDoses, getTodaysScheduleLogs, getPeptide, updateDose, completeScheduleLog, skipScheduleLog } = useApp();
  const todaysDoses = getTodaysDoses();
  const todaysScheduleLogs = getTodaysScheduleLogs();
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

  if (todaysScheduleLogs.length === 0 && standaloneDoses.length === 0) {
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

  const completedCount = todaysScheduleLogs.filter(log => log.status === 'taken').length + standaloneDoses.filter(d => d.completed).length;
  const totalCount = todaysScheduleLogs.length + standaloneDoses.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Today
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} completed
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
          {todaysScheduleLogs.map((log) => {
            const schedule = data.schedules.find((candidate) => candidate.id === log.scheduleId);
            const peptide = getPeptide(log.peptideId);
            const isTaken = log.status === 'taken';
            const isSkipped = log.status === 'skipped';
            return (
              <div key={log.id} className={cn("rounded-md border border-border p-3", (isTaken || isSkipped) && "opacity-60")}>
                <div className="flex items-start gap-3">
                  {isTaken ? (
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium text-sm", (isTaken || isSkipped) && "line-through")}>
                      {peptide?.name} - {schedule ? formatDose(schedule.doseValue, schedule.doseUnit) : 'Scheduled dose'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(log.dueAt)} · {schedule?.route.toUpperCase()} · {log.status}
                    </p>
                  </div>
                </div>
                {log.status === 'pending' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled={savingLogId === log.id} onClick={() => void handleSkipScheduleLog(log.id)}>
                      Skip
                    </Button>
                    <Button size="sm" disabled={savingLogId === log.id} onClick={() => openCompletion(log)}>
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
                    {formatTime(dose.dateTime)} · {dose.route.toUpperCase()}
                  </p>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeLog)} onOpenChange={(open) => !open && closeCompletion()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete scheduled dose</DialogTitle>
            <DialogDescription>
              Select the vial used for this scheduled dose.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vial</Label>
              <Select value={vialId} onValueChange={setVialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select active vial" />
                </SelectTrigger>
                <SelectContent>
                  {activeVials.length > 0 ? activeVials.map((vial) => (
                    <SelectItem key={vial.id} value={vial.id}>
                      {vial.name} ({vial.lotNumber || 'no lot'})
                    </SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No active vial</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
            <Button onClick={() => void handleCompleteScheduleLog()} disabled={!vialId || (requiresSite && !site) || savingLogId === activeLog?.id}>
              Complete dose
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
