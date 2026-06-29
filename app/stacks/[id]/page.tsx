"use client";

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Beaker, CalendarDays, CheckCircle2, Clock, Pause, Play, Plus, Settings, Trash2, Waves } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScheduleTimeFields } from '@/components/stacks/schedule-time-fields';
import { popRouteHistory } from '@/components/navigation/route-history';
import { SyringeVisualization } from '@/components/reconstitution/syringe-visualization';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { formatDose } from '@/lib/dose-helpers';
import { getDoseDrawVolumePreview, type DoseDrawVolumePreview } from '@/lib/draw-volume';
import { syringeTypes } from '@/lib/peptide-conversions';
import { getDefaultScheduleRecurrence, getSchedulePreset, getScheduleSummary, normalizeScheduleRecurrence } from '@/lib/schedules';
import { buildProtocolPkView, type ProtocolPkCompoundView } from '@/lib/protocol-pk-view';
import { cn } from '@/lib/utils';
import type { LabResult, ReconstitutionCalculation, ScheduleLog, Stack, StackPeptide, StackStatus, Vial } from '@/lib/types';
import type { SchedulePreset } from '@/lib/schedules';

const statusLabels: Record<StackStatus, string> = {
  active: 'Active',
  planned: 'Planned',
  completed: 'Complete',
  paused: 'Paused',
};

const trajectoryWindow = 14;
const u100Syringe = syringeTypes.find((syringe) => syringe.id === 'u100-1ml') ?? syringeTypes[0];

export default function StackDetailPage({ params }: { params: Promise<{ id: string }> }) {
const { id } = use(params);
const router = useRouter();
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
const [doseDetailPeptideId, setDoseDetailPeptideId] = useState<string | null>(null);

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
const pkView = buildProtocolPkView(data, stack);
const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (adherence / 100) * circumference;

const hasSchedulableItems = stack.peptides.length > 0;
const selectedDosePeptide = doseDetailPeptideId ? stack.peptides.find((peptide) => peptide.peptideId === doseDetailPeptideId) ?? null : null;
const selectedDoseCompound = selectedDosePeptide ? trackableCompounds.find((candidate) => candidate.id === selectedDosePeptide.peptideId) : undefined;
const selectedDoseDetail = selectedDosePeptide ? buildProtocolDoseDetail(selectedDosePeptide, data.vials, data.reconstitutionCalculations) : null;

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

const handleBack = () => {
  router.push(popRouteHistory('/stacks'));
};

  return (
    <AppShell showFloatingAction={false}>
      <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur min-[420px]:px-5">
        <div className="flex items-center gap-2.5">
<button type="button" aria-label="Back to previous screen" className="grid h-9 w-9 shrink-0 place-items-center text-foreground" onClick={handleBack}>
<ArrowLeft className="h-4 w-4" />
</button>
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
<section className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[20px] border border-[#332012] bg-card p-3.5">
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
<div className="flex items-center gap-2 rounded-[14px] border border-[#3a2012] bg-[#1d120c] px-3 py-2 text-xs font-bold text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Week {Math.max(Math.ceil(currentDay / 7), 1)} of {Math.max(Math.ceil(stack.durationDays / 7), 1)}
              </div>
<div className="flex items-center gap-2 rounded-[14px] border border-[#3a2012] bg-[#1d120c] px-3 py-2 text-xs font-bold text-muted-foreground">
              <Archive className="h-3.5 w-3.5 text-emerald-400" />
                {remainingDays} days left
              </div>
            </div>
          </section>

	<section className="rounded-[20px] border border-[#332012] bg-card p-3.5">
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

          <ProtocolPkCard view={pkView} />
	
	<section className="overflow-hidden rounded-[20px] border border-[#332012] bg-[#211208]">
          <div className="flex items-center justify-between gap-3 border-b border-[#332012] px-3.5 py-3">
<h2 className="shrink-0 text-sm font-bold tracking-normal">Upcoming Doses</h2>
<Button type="button" variant="ghost" className="h-auto shrink-0 p-0 text-xs font-extrabold uppercase tracking-[0.08em] text-primary" onClick={openEditDialog}>
                Edit Protocol
              </Button>
            </div>
            <div>
              {upcomingRows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-3 border-b border-[#332012] bg-[#28170c] px-3.5 py-2.5 last:border-b-0">
<div className="grid h-8 w-8 shrink-0 place-items-center rounded-[12px] bg-[#321f12]">
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
<Button asChild className="h-9 w-full rounded-[14px] bg-primary text-sm font-bold tracking-normal text-black hover:bg-primary/90">
<Link href="/log"><Plus className="mr-2 h-5 w-5" /> Log Dose Now</Link>
              </Button>
            </div>
          </section>

	<section className="rounded-[22px] border border-[#332012] bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-bold tracking-normal">Protocol</h2>
            <span className="rounded-full border border-[#3a2012] bg-[#211208] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{statusLabels[stack.status]}</span>
          </div>
          <div className="space-y-3">
            {stack.peptides.map((peptide) => {
              const compound = trackableCompounds.find((candidate) => candidate.id === peptide.peptideId);
              const compoundName = compound?.name ?? peptide.peptideId;
              return (
                <button
                  key={peptide.id ?? peptide.peptideId}
                  type="button"
                  className="w-full rounded-[18px] border border-[#332012] bg-[#211208] p-3.5 text-left transition-colors hover:bg-[#28170c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                  onClick={() => setDoseDetailPeptideId(peptide.peptideId)}
                  aria-label={`Open dose view for ${compoundName}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold leading-tight">{compoundName}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{formatRoute(peptide.route)}</p>
                    </div>
                    <div className="shrink-0 rounded-[14px] bg-[#2b180d] px-3 py-2 text-right">
                      <p className="text-sm font-extrabold text-primary">{formatDose(peptide.doseValue, peptide.doseUnit)}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Dose</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[14px] border border-[#3a2012] bg-[#1b100a] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Schedule</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-primary">{formatScheduleSummary(peptide)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {(stack.description || stack.notes) && (
            <div className="mt-4 space-y-2 border-t border-[#332012] pt-3">
              {stack.description && <p className="text-sm leading-relaxed text-muted-foreground">{stack.description}</p>}
              {stack.notes && <p className="text-sm leading-relaxed text-muted-foreground">{stack.notes}</p>}
            </div>
          )}
        </section>

        <section className="space-y-2.5">
<h2 className="text-sm font-bold tracking-normal">Linked Labs</h2>
	<div className="relative overflow-hidden rounded-[22px] border border-[#332012] bg-card p-4">
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
	                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Import labs and link them to this protocol.</p>
	                    </div>
	                  </div>
	              <Button asChild variant="outline" className="mt-4 h-11 w-full rounded-[14px] border-[#332012] bg-[#211208] text-sm font-semibold tracking-normal">
	                    <Link href="/labs">Open Labs</Link>
	                  </Button>
                </>
              )}
            </div>
          </section>
</main>
</div>

<Dialog open={Boolean(selectedDosePeptide)} onOpenChange={(open) => !open && setDoseDetailPeptideId(null)}>
<DialogContent className="max-w-lg">
<DialogHeader>
            <DialogTitle>{selectedDoseCompound?.name ?? selectedDosePeptide?.peptideId ?? 'Dose view'}</DialogTitle>
            <DialogDescription>Read-only draw view from your saved protocol and reconstitution data.</DialogDescription>
          </DialogHeader>
{selectedDosePeptide && (
<div className="space-y-4">
<div className="grid grid-cols-2 gap-2">
<div className="rounded-[14px] border border-[#332012] bg-[#211208] p-3">
<p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Protocol dose</p>
<p className="mt-1 text-lg font-extrabold text-primary">{formatDose(selectedDosePeptide.doseValue, selectedDosePeptide.doseUnit)}</p>
</div>
<div className="rounded-[14px] border border-[#332012] bg-[#211208] p-3">
<p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Route</p>
<p className="mt-1 text-lg font-extrabold text-primary">{formatRoute(selectedDosePeptide.route)}</p>
</div>
</div>
{selectedDoseDetail?.preview ? (
<div className="space-y-3">
<div className="rounded-[18px] border border-primary/30 bg-primary/10 p-4 text-center">
<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Draw amount</p>
<p className="mt-1 text-4xl font-black tracking-normal text-primary">{formatSyringeUnits(selectedDoseDetail.preview.syringeUnits)}</p>
<p className="mt-1 text-sm font-semibold text-primary">{selectedDoseDetail.preview.syringeLabel}</p>
</div>
<SyringeVisualization syringeType={u100Syringe} drawUnits={selectedDoseDetail.preview.syringeUnits} doseLabel={formatDose(selectedDosePeptide.doseValue, selectedDosePeptide.doseUnit)} />
<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
<div className="rounded-[12px] bg-secondary/70 p-3">
<p className="font-semibold text-foreground">{selectedDoseDetail.preview.drawLabel}</p>
<p>Draw volume</p>
</div>
<div className="rounded-[12px] bg-secondary/70 p-3">
<p className="font-semibold text-foreground">{selectedDoseDetail.preview.concentrationLabel}</p>
<p>{selectedDoseDetail.sourceLabel}</p>
</div>
</div>
<p className="text-xs leading-relaxed text-muted-foreground">Syringe units are U-100 volume markings, not dose recommendations.</p>
</div>
) : selectedDoseDetail?.savedCalculation ? (
<div className="space-y-3">
<div className="rounded-[18px] border border-primary/30 bg-primary/10 p-4 text-center">
<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Saved draw amount</p>
<p className="mt-1 text-4xl font-black tracking-normal text-primary">{formatSyringeUnits(selectedDoseDetail.savedCalculation.drawUnits)}</p>
<p className="mt-1 text-sm font-semibold text-primary">{formatSavedDrawLabel(selectedDoseDetail.savedCalculation)}</p>
</div>
<SyringeVisualization syringeType={u100Syringe} drawUnits={selectedDoseDetail.savedCalculation.drawUnits} doseLabel={formatDose(selectedDosePeptide.doseValue, selectedDosePeptide.doseUnit)} />
<p className="text-xs leading-relaxed text-muted-foreground">Using saved reconstitution math. Activate matching inventory to keep future dose logging tied to a vial.</p>
</div>
) : (
<div className="rounded-[18px] border border-chart-4/40 bg-chart-4/10 p-4">
<p className="text-sm font-extrabold text-chart-4">No reconstitution saved yet</p>
<p className="mt-2 text-sm leading-6 text-muted-foreground">Save vial amount and BAC water first, then PeptideOS can show syringe draw units for this protocol dose.</p>
<Button asChild className="mt-4 w-full">
<Link href={`/more/reconstitution?compound=${selectedDosePeptide.peptideId}`} onClick={() => setDoseDetailPeptideId(null)}>
Open reconstitution
</Link>
</Button>
</div>
)}
</div>
)}
</DialogContent>
</Dialog>

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
<DialogContent className="top-auto bottom-0 left-0 flex max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 grid-rows-none flex-col gap-0 overflow-hidden rounded-b-none rounded-t-3xl border-x-0 p-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(760px,92vh)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border-x">
<DialogHeader className="shrink-0 border-b border-border px-5 pb-4 pt-5 text-left">
            <DialogTitle>Edit protocol</DialogTitle>
            <DialogDescription>
              Update saved protocol basics and schedule timing.
            </DialogDescription>
          </DialogHeader>

<div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
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

<div className="min-w-0 space-y-4 overflow-hidden rounded-[18px] border p-3">
              {stack.peptides.map((sp) => {
                const compound = trackableCompounds.find((candidate) => candidate.id === sp.peptideId);
                return (
<div key={sp.id ?? sp.peptideId} className="min-w-0 space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
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

<DialogFooter className="shrink-0 border-t border-border bg-background/95 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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

interface ProtocolDoseDetail {
  preview: DoseDrawVolumePreview | null;
  sourceLabel: string;
  savedCalculation: ReconstitutionCalculation | null;
}

function buildProtocolDoseDetail(
  stackPeptide: StackPeptide,
  vials: Vial[],
  savedCalculations: ReconstitutionCalculation[],
): ProtocolDoseDetail {
  const activeVials = vials.filter((vial) => vial.peptideId === stackPeptide.peptideId && vial.status === 'active');
  for (const vial of activeVials) {
    const preview = getDoseDrawVolumePreview({
      vial,
      doseValue: stackPeptide.doseValue,
      doseUnit: stackPeptide.doseUnit,
    });
    if (preview) {
      return {
        preview,
        sourceLabel: vial.name || 'Active vial',
        savedCalculation: null,
      };
    }
  }

  const savedCalculation = [...savedCalculations]
    .filter((calculation) => (
      calculation.compoundId === stackPeptide.peptideId &&
      calculation.doseUnit === stackPeptide.doseUnit &&
      Math.abs(calculation.doseValue - stackPeptide.doseValue) < 0.0001
    ))
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0] ?? null;

  return {
    preview: null,
    sourceLabel: savedCalculation ? 'Saved reconstitution' : '',
    savedCalculation,
  };
}

function formatSyringeUnits(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: value % 1 === 0 ? 0 : 1 })} U`;
}

function formatSavedDrawLabel(calculation: ReconstitutionCalculation) {
  return `${formatSyringeUnits(calculation.drawUnits)} / ${calculation.drawMl.toFixed(2)} mL`;
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

function formatEstimatedMg(value: number) {
  if (value < 0.01 && value > 0) return '<0.01 mg';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: value >= 1 ? 1 : 2 })} mg`;
}

function formatHalfLife(hours: number) {
  if (hours >= 48) return `${Math.round(hours / 24)}d`;
  return `${Math.round(hours)}h`;
}

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function ProtocolPkCard({ view }: { view: ReturnType<typeof buildProtocolPkView> }) {
  const [selectedCompoundId, setSelectedCompoundId] = useState(view.compounds[0]?.compound.id ?? '');
  const selected = view.compounds.find((compound) => compound.compound.id === selectedCompoundId) ?? view.compounds[0];

  return (
    <section className="overflow-hidden rounded-[22px] border border-primary/30 bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-primary/15 text-primary">
            <Waves className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-normal">Estimated Remaining</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Actual solid · projected dashed</p>
          </div>
        </div>
        {selected && (
          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-primary">
            {view.compounds.length} model{view.compounds.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {selected ? (
        <div className="space-y-3 p-3.5">
          {view.compounds.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {view.compounds.map((compound) => {
                const active = compound.compound.id === selected.compound.id;
                return (
                  <button
                    key={compound.compound.id}
                    type="button"
                    onClick={() => setSelectedCompoundId(compound.compound.id)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-muted-foreground',
                    )}
                  >
                    {compound.compound.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <PkMetric label="Now" value={formatEstimatedMg(selected.currentEstimatedMg)} />
            <PkMetric label="Peak" value={`${selected.percentOfPeak}%`} accent />
            <PkMetric label="Half-life" value={formatHalfLife(selected.halfLifeHours)} />
            <PkMetric label="Next" value={selected.nextEventAt ? formatShortDateTime(selected.nextEventAt) : 'None'} />
          </div>

          <PkCurveGraph compound={selected} />

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="rounded-[16px] border border-border bg-secondary p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Assumption</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.compound.pharmacokinetics?.halfLifeSource}</p>
            </div>
            <div className="rounded-[16px] border border-border bg-secondary p-3 sm:min-w-36 sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Events</p>
              <p className="mt-1 text-xs font-bold text-primary">{selected.actualEvents.length} actual · {selected.plannedEvents.length} planned</p>
            </div>
          </div>

          <div className="rounded-[16px] border border-border bg-background/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Model caveat</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selected.compound.pharmacokinetics?.modelNotes}</p>
          </div>
        </div>
      ) : (
        <div className="p-3.5">
          <div className="rounded-[16px] border border-dashed border-border bg-secondary p-4">
            <p className="text-sm font-semibold">No source-backed half-life protocol yet.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add PK metadata to the compound record before PeptideOS draws an estimated remaining amount curve.
            </p>
            {view.unsupportedCompounds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {view.unsupportedCompounds.map((compound) => (
                  <span key={compound.id} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                    {compound.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PkMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[15px] border border-border bg-secondary px-3 py-2">
      <p className={cn('truncate text-base font-extrabold leading-none', accent ? 'text-primary' : 'text-foreground')}>{value}</p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}

function PkCurveGraph({ compound }: { compound: ProtocolPkCompoundView }) {
  const points = [...compound.actualPoints, ...compound.projectedPoints];
  const max = Math.max(...points.map((point) => point.estimatedRemainingMg), compound.peakProjectedMg, 0.001);
  const timelineStart = new Date(points[0]?.sampledAt ?? new Date().toISOString()).getTime();
  const timelineEnd = new Date(points.at(-1)?.sampledAt ?? new Date().toISOString()).getTime();
  const actualPath = buildPkPath(compound.actualPoints, max, timelineStart, timelineEnd);
  const projectedPath = buildPkPath(compound.projectedPoints, max, timelineStart, timelineEnd);
  const doseMarkers = [...compound.actualEvents, ...compound.plannedEvents].slice(-16);
  const gradientId = `pk-fill-${compound.compound.id.replace(/[^a-z0-9_-]/gi, '-')}`;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-border bg-background px-2 py-3">
      <svg viewBox="0 0 320 150" className="h-40 w-full" role="img" aria-label={`${compound.compound.name} estimated remaining amount curve`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d="M20 124 H300" stroke="var(--border)" strokeWidth="1" />
        <path d="M20 82 H300" stroke="var(--border)" strokeOpacity="0.55" strokeWidth="1" />
        <path d="M20 40 H300" stroke="var(--border)" strokeOpacity="0.55" strokeWidth="1" />
        {projectedPath && <path d={closeAreaPath(projectedPath)} fill={`url(#${gradientId})`} />}
        {actualPath && <path d={actualPath} fill="none" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {projectedPath && <path d={projectedPath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 6" />}
        {doseMarkers.map((event) => {
          const x = 20 + ((new Date(event.occurredAt).getTime() - timelineStart) / Math.max(timelineEnd - timelineStart, 1)) * 280;
          return <circle key={event.id} cx={x} cy={event.source === 'actual' ? 128 : 132} r={event.source === 'actual' ? 4 : 3} fill={event.source === 'actual' ? 'var(--foreground)' : 'var(--primary)'} />;
        })}
      </svg>
      <div className="absolute left-3 top-3 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {compound.compound.name}
      </div>
    </div>
  );
}

function buildPkPath(points: Array<{ sampledAt: string; estimatedRemainingMg: number }>, max: number, timelineStart: number, timelineEnd: number) {
  if (points.length === 0) return '';
  const timeline = Math.max(timelineEnd - timelineStart, 1);
  return points.map((point, index) => {
    const x = 20 + ((new Date(point.sampledAt).getTime() - timelineStart) / timeline) * 280;
    const y = 124 - (point.estimatedRemainingMg / max) * 104;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${Math.max(20, y).toFixed(1)}`;
  }).join(' ');
}

function closeAreaPath(path: string) {
  const matches = Array.from(path.matchAll(/[ML] ([\d.]+) [\d.]+/g));
  const firstX = matches[0]?.[1] ?? '20';
  const lastX = matches.at(-1)?.[1] ?? '300';
  return `${path} L ${lastX} 124 L ${firstX} 124 Z`;
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
