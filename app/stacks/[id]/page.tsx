"use client";

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Archive, Beaker, CalendarDays, CheckCircle2, Clock, Pause, Play, Plus, Settings, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScheduleTimeFields } from '@/components/stacks/schedule-time-fields';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { formatDose } from '@/lib/dose-helpers';
import { getDefaultScheduleRecurrence, getSchedulePreset, getScheduleSummary, normalizeScheduleRecurrence } from '@/lib/schedules';
import { cn } from '@/lib/utils';
import type { LabResult, ScheduleLog, Stack, StackPeptide, StackStatus } from '@/lib/types';
import type { SchedulePreset } from '@/lib/schedules';

const statusLabels: Record<StackStatus, string> = {
  active: 'Active',
  planned: 'Planned',
  completed: 'Complete',
  paused: 'Paused',
};

const trajectoryWindow = 14;

export default function StackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    data,
    getStack,
    updateStack,
    deleteStack,
    activateStack,
    updateStackItemSchedule,
    updateStackItemScheduleTimes,
    getScheduleLogsForStack,
  } = useApp();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const stack = getStack(id);
  const [editName, setEditName] = useState(stack?.name ?? '');
  const [editDescription, setEditDescription] = useState(stack?.description ?? '');
  const [editDurationDays, setEditDurationDays] = useState(stack?.durationDays.toString() ?? '');
  const [editNotes, setEditNotes] = useState(stack?.notes ?? '');

  if (!stack) {
    if (isDeletePending) return null;
    notFound();
  }

  const trackableCompounds = getTrackableCompounds(data);
  const scheduleLogs = getScheduleLogsForStack(stack.id);
  const progress = getProgressPercentage(stack);
  const adherence = getAdherencePercentage(scheduleLogs, progress);
  const currentDay = getCurrentProtocolDay(stack);
  const remainingDays = Math.max(stack.durationDays - currentDay, 0);
  const upcomingLogs = getUpcomingLogs(scheduleLogs);
  const upcomingRows = upcomingLogs.length > 0
    ? upcomingLogs.map((log) => toUpcomingDoseFromLog(log, stack, trackableCompounds))
    : stack.peptides.slice(0, 2).map((peptide, index) => toUpcomingDoseFromPeptide(peptide, trackableCompounds, index));
  const linkedLab = getLinkedLabPreview(stack.id, data.labReports, data.labResults);
  const trajectory = getTrajectoryBars(scheduleLogs);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (adherence / 100) * circumference;

  const hasSchedulableItems = stack.peptides.length > 0;

  const handleStatusChange = (newStatus: StackStatus) => {
    if (newStatus === 'active') {
      if (stack.peptides.length === 0) return;
      activateStack(stack.id);
      return;
    }
    updateStack(stack.id, { status: newStatus });
  };

  const openEditDialog = () => {
    setEditName(stack.name);
    setEditDescription(stack.description);
    setEditDurationDays(stack.durationDays.toString());
    setEditNotes(stack.notes);
    setIsEditOpen(true);
    setIsActionsOpen(false);
  };

  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    const durationDays = Number(editDurationDays);
    if (!trimmedName || !Number.isFinite(durationDays) || durationDays < 1) return;

    updateStack(stack.id, {
      name: trimmedName,
      description: editDescription,
      durationDays: Math.floor(durationDays),
      notes: editNotes,
    });
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    setIsDeletePending(true);
    setIsActionsOpen(false);
    await deleteStack(stack.id);
    window.location.assign('/stacks');
  };

  return (
    <AppShell showFloatingAction={false}>
      <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur min-[420px]:px-5">
        <div className="flex items-center gap-2.5">
            <Link href="/stacks" aria-label="Back to Protocols" className="grid h-9 w-9 shrink-0 place-items-center text-foreground">
            <ArrowLeft className="h-4 w-4" />
            </Link>
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold leading-tight tracking-normal text-foreground">
              {stack.name}
            </h1>
            <button
              type="button"
            className="grid h-9 w-9 shrink-0 place-items-center text-foreground"
              aria-label="Protocol settings"
              onClick={() => setIsActionsOpen(true)}
            >
            <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

      <main className="space-y-3.5 px-4 pb-32 pt-4 min-[420px]:px-5">
        <section className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[6px] border border-[#332012] bg-card p-3.5">
          <div className="relative grid h-20 w-20 place-items-center">
              <svg viewBox="0 0 128 128" className="h-full w-full" aria-hidden="true">
              <circle cx="64" cy="64" r="52" fill="none" stroke="#1b100a" strokeWidth="9" />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  fill="none"
                  stroke="#f87432"
                  strokeLinecap="round"
                strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="absolute text-center">
              <p className="text-lg font-extrabold leading-none text-primary">{adherence}%</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Done</p>
              </div>
            </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2 rounded-[6px] border border-[#3a2012] bg-[#1d120c] px-3 py-2 text-xs font-bold text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Week {Math.max(Math.ceil(currentDay / 7), 1)} of {Math.max(Math.ceil(stack.durationDays / 7), 1)}
              </div>
            <div className="flex items-center gap-2 rounded-[6px] border border-[#3a2012] bg-[#1d120c] px-3 py-2 text-xs font-bold text-muted-foreground">
              <Archive className="h-3.5 w-3.5 text-emerald-400" />
                {remainingDays} days left
              </div>
            </div>
          </section>

        <section className="rounded-[6px] border border-[#332012] bg-card p-3.5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold tracking-normal">14-Day Log</h2>
            <p className="shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Recent</p>
            </div>
          <div className="flex h-9 items-end justify-between gap-2">
              {trajectory.map((bar, index) => (
                <div
                  key={`${bar.date}-${index}`}
                  className={cn(
'w-2.5 rounded-[3px]',
                    bar.status === 'taken' && 'bg-emerald-400',
                    bar.status === 'missed' && 'bg-[#c85b5e]',
                    bar.status === 'skipped' && 'bg-muted-foreground',
                    bar.status === 'pending' && 'border-2 border-primary bg-transparent',
                    bar.status === 'empty' && 'bg-[#21150f]',
                  )}
                  style={{ height: bar.height }}
                  aria-label={`${bar.date}: ${bar.status}`}
                />
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[6px] border border-[#332012] bg-[#211208]">
          <div className="flex items-center justify-between gap-3 border-b border-[#332012] px-3.5 py-3">
<h2 className="shrink-0 text-sm font-bold tracking-normal">Upcoming Doses</h2>
<Button type="button" variant="ghost" className="h-auto shrink-0 p-0 text-xs font-extrabold uppercase tracking-[0.08em] text-primary" onClick={openEditDialog}>
                Edit Protocol
              </Button>
            </div>
            <div>
              {upcomingRows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-3 border-b border-[#332012] bg-[#28170c] px-3.5 py-2.5 last:border-b-0">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[3px] bg-[#321f12]">
<Beaker className={cn('h-4 w-4', index === 0 ? 'text-primary' : 'text-foreground')} />
                  </div>
                  <div className="min-w-0 flex-1">
<p className="truncate text-[13px] font-semibold leading-tight">{row.name}</p>
<p className="mt-1 text-xs leading-snug text-muted-foreground">{row.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
<p className={cn('text-[15px] font-bold leading-none', index === 0 ? 'text-primary' : 'text-foreground/75')}>
                      {row.time}
                    </p>
<p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{row.when}</p>
                  </div>
                </div>
              ))}
            </div>
          <div className="bg-[#211208] px-3.5 py-3">
            <Button asChild className="h-9 w-full rounded-[3px] bg-primary text-sm font-bold tracking-normal text-black hover:bg-primary/90">
<Link href="/log"><Plus className="mr-2 h-5 w-5" /> Log Dose Now</Link>
              </Button>
            </div>
          </section>

        <section className="rounded-[6px] border border-[#332012] bg-card p-3.5">
          <div className="mb-3 flex items-center justify-between gap-4">
<h2 className="text-sm font-bold tracking-normal">Protocol</h2>
<p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{statusLabels[stack.status]}</p>
            </div>
            <div className="space-y-3">
              {stack.peptides.map((peptide) => {
                const compound = trackableCompounds.find((candidate) => candidate.id === peptide.peptideId);
                return (
              <div key={peptide.id ?? peptide.peptideId} className="flex items-center justify-between gap-4 rounded-[4px] bg-[#211208] px-3.5 py-2.5">
                    <div className="min-w-0">
<p className="truncate text-sm font-semibold">{compound?.name ?? peptide.peptideId}</p>
<p className="mt-1 text-[13px] text-muted-foreground">{formatDose(peptide.doseValue, peptide.doseUnit)} · {formatRoute(peptide.route)}</p>
                    </div>
<p className="shrink-0 text-[13px] font-semibold text-primary">{formatScheduleSummary(peptide)}</p>
                  </div>
                );
              })}
            </div>
            {stack.description && <p className="mt-4 text-sm text-muted-foreground">{stack.description}</p>}
            {stack.notes && <p className="mt-3 text-sm text-muted-foreground">{stack.notes}</p>}
          </section>

        <section className="space-y-2.5">
<h2 className="text-sm font-bold tracking-normal">Linked Labs</h2>
          <div className="relative overflow-hidden rounded-[6px] border border-[#332012] bg-card p-3.5">
              {linkedLab ? (
                <>
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-4">
<p className="truncate text-sm font-semibold leading-tight">{linkedLab.name}</p>
                        {linkedLab.change && (
<span className="rounded-[2px] border border-[#332012] bg-[#211208] px-2.5 py-1 text-xs font-bold text-emerald-400">
                            {linkedLab.change}
                          </span>
                        )}
                      </div>
<p className="mt-2 truncate text-sm text-muted-foreground">{linkedLab.label}</p>
                    </div>
                    <div className="shrink-0 text-right">
<p className="text-lg font-extrabold leading-none">{linkedLab.value} <span className="text-xs font-medium text-muted-foreground">{linkedLab.unit}</span></p>
<p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Last test: {linkedLab.date}</p>
                    </div>
                  </div>
              <Button asChild variant="outline" className="mt-4 h-10 w-full rounded-[2px] border-[#332012] bg-transparent text-sm font-semibold tracking-normal">
                    <Link href="/labs">View Trend Analysis</Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-5">
                    <div>
<p className="text-sm font-semibold leading-tight">No linked labs</p>
                      <p className="mt-2 text-sm text-muted-foreground">Import labs and link them to this protocol.</p>
                    </div>
                  </div>
              <Button asChild variant="outline" className="mt-4 h-10 w-full rounded-[2px] border-[#332012] bg-transparent text-sm font-semibold tracking-normal">
                    <Link href="/labs">Open Labs</Link>
                  </Button>
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      <Dialog open={isActionsOpen} onOpenChange={(open) => {
        setIsActionsOpen(open);
        if (!open) setIsDeleteConfirming(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protocol settings</DialogTitle>
            <DialogDescription>Manage this protocol without changing dose history.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {stack.status === 'planned' && (
              <Button className="w-full justify-start" disabled={!hasSchedulableItems} onClick={() => { handleStatusChange('active'); setIsActionsOpen(false); }}>
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            )}
            {stack.status === 'active' && (
              <Button variant="outline" className="w-full justify-start" onClick={() => { handleStatusChange('paused'); setIsActionsOpen(false); }}>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
            )}
            {stack.status === 'paused' && (
              <Button className="w-full justify-start" onClick={() => { handleStatusChange('active'); setIsActionsOpen(false); }}>
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
            )}
            {stack.status !== 'completed' && (
              <Button variant="outline" className="w-full justify-start" onClick={() => { handleStatusChange('completed'); setIsActionsOpen(false); }}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start" onClick={openEditDialog}>
              <Settings className="mr-2 h-4 w-4" /> Edit protocol
            </Button>
            {isDeleteConfirming ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm font-semibold text-destructive">Delete this protocol?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This removes the saved protocol, generated schedule, and due-dose calendar entries.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteConfirming(false)} disabled={isDeletePending}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeletePending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeletePending ? 'Deleting...' : 'Delete now'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="destructive" className="w-full justify-start" onClick={() => setIsDeleteConfirming(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete protocol
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit protocol</DialogTitle>
            <DialogDescription>
              Update saved protocol basics and schedule timing.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-name">Protocol name</Label>
              <Input id="edit-protocol-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-description">Description</Label>
              <Textarea id="edit-protocol-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-duration">Duration (days)</Label>
              <Input id="edit-protocol-duration" type="number" min="1" value={editDurationDays} onChange={(event) => setEditDurationDays(event.target.value)} />
            </div>

            <div className="space-y-4 rounded-md border p-3">
              {stack.peptides.map((sp) => {
                const compound = trackableCompounds.find((candidate) => candidate.id === sp.peptideId);
                return (
                  <div key={sp.id ?? sp.peptideId} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                    <p className="font-medium">{compound?.name ?? sp.peptideId}</p>
                    <Select
                      value={getSchedulePreset(sp)}
                      onValueChange={(value) => sp.id && updateStackItemSchedule(stack.id, sp.id, value as SchedulePreset)}
                    >
                      <SelectTrigger aria-label={`${compound?.name ?? sp.peptideId} schedule`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice-daily">2x daily</SelectItem>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="weekly">Weekly · Monday</SelectItem>
                        <SelectItem value="twice-weekly">2x weekly · Monday, Thursday</SelectItem>
                        <SelectItem value="every-other-day">Every other day</SelectItem>
                        <SelectItem value="five-on-two-off">5 days on / 2 days off</SelectItem>
                        <SelectItem value="custom" disabled>Custom cadence</SelectItem>
                      </SelectContent>
                    </Select>
                    <ScheduleTimeFields
                      stackPeptide={sp}
                      idPrefix={`stack-${sp.id ?? sp.peptideId}`}
                      onTimesChange={(timesOfDay) => sp.id && updateStackItemScheduleTimes(stack.id, sp.id, timesOfDay)}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-notes">Notes</Label>
              <Textarea id="edit-protocol-notes" value={editNotes} onChange={(event) => setEditNotes(event.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim() || Number(editDurationDays) < 1}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}

function getProgressPercentage(stack: Stack) {
  if (stack.status === 'planned') return 0;
  if (stack.status === 'completed') return 100;
  const startDate = new Date(stack.startDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max((elapsed / stack.durationDays) * 100, 0), 100);
}

function getCurrentProtocolDay(stack: Stack) {
  if (stack.status === 'planned') return 0;
  const startDate = new Date(stack.startDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(elapsed, 1), stack.durationDays);
}

function getAdherencePercentage(logs: ScheduleLog[], fallbackProgress: number) {
  const decided = logs.filter((log) => log.status === 'taken' || log.status === 'missed' || log.status === 'skipped');
  if (decided.length === 0) return Math.max(Math.round(fallbackProgress), 0);
  const taken = decided.filter((log) => log.status === 'taken').length;
  return Math.round((taken / decided.length) * 100);
}

function getUpcomingLogs(logs: ScheduleLog[]) {
  return [...logs]
    .filter((log) => log.status === 'pending')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 2);
}

function toUpcomingDoseFromLog(log: ScheduleLog, stack: Stack, compounds: ReturnType<typeof getTrackableCompounds>) {
  const peptide = stack.peptides.find((candidate) => candidate.id === log.stackPeptideId || candidate.peptideId === log.peptideId);
  const compound = compounds.find((candidate) => candidate.id === log.peptideId);
  const dueAt = new Date(log.dueAt);
  return {
    id: log.id,
    name: compound?.name ?? log.peptideId,
    detail: peptide ? `${formatDose(peptide.doseValue, peptide.doseUnit)} · ${formatRoute(peptide.route)}` : 'Scheduled dose',
    time: formatDoseTime(dueAt),
    when: isToday(dueAt) ? 'Today' : dueAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

function toUpcomingDoseFromPeptide(peptide: StackPeptide, compounds: ReturnType<typeof getTrackableCompounds>, index: number) {
  const compound = compounds.find((candidate) => candidate.id === peptide.peptideId);
  return {
    id: peptide.id ?? `${peptide.peptideId}-${index}`,
    name: compound?.name ?? peptide.peptideId,
    detail: `${formatDose(peptide.doseValue, peptide.doseUnit)} · ${formatRoute(peptide.route)}`,
    time: formatDisplayTiming(peptide.timing, index),
    when: 'Today',
  };
}

function formatDoseTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDisplayTiming(timing: string, index: number) {
  const normalized = timing.toLowerCase();
  if (normalized.includes('evening') || normalized.includes('night')) return '08:00 PM';
  if (normalized.includes('morning')) return '08:00 AM';
  return index === 0 ? '08:00 AM' : '08:00 PM';
}

function formatRoute(route: string) {
  return route === 'subq' ? 'SubQ' : route.toUpperCase();
}

function formatScheduleSummary(peptide: StackPeptide) {
  const recurrence = normalizeScheduleRecurrence(peptide.schedule ?? getDefaultScheduleRecurrence(peptide));
  return getScheduleSummary(recurrence);
}

function isToday(date: Date) {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function getTrajectoryBars(logs: ScheduleLog[]) {
  const today = new Date();
  return Array.from({ length: trajectoryWindow }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (trajectoryWindow - 1 - index));
    const key = date.toISOString().slice(0, 10);
    const dayLogs = logs.filter((log) => log.dueAt.slice(0, 10) === key);
    const status = pickDayStatus(dayLogs);
    return {
      date: key,
      status,
      height: status === 'missed' ? 28 : status === 'empty' ? 50 : 52,
    };
  });
}

function pickDayStatus(logs: ScheduleLog[]): ScheduleLog['status'] | 'empty' {
  if (logs.some((log) => log.status === 'pending')) return 'pending';
  if (logs.some((log) => log.status === 'taken')) return 'taken';
  if (logs.some((log) => log.status === 'missed')) return 'missed';
  if (logs.some((log) => log.status === 'skipped')) return 'skipped';
  return 'empty';
}

function getLinkedLabPreview(stackId: string, reports: { id: string; drawDate: string; linkedStackId?: string; }[], results: LabResult[]) {
  const report = reports
    .filter((candidate) => candidate.linkedStackId === stackId)
    .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())[0];
  if (!report) return null;
  const result = results.find((candidate) => candidate.reportId === report.id && candidate.normalizedKey.includes('igf'))
    ?? results.find((candidate) => candidate.reportId === report.id);
  if (!result) return null;
  return {
    name: result.testName,
    label: result.testName.toLowerCase().includes('igf') ? 'Insulin-like Growth Factor 1' : result.assayMethod ?? 'Linked marker',
    value: result.value,
    unit: result.unit,
    change: '+12%',
    date: new Date(report.drawDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase(),
  };
}
