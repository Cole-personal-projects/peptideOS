"use client";

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import { Calendar, AlertTriangle, Clock, Play, Pause, CheckCircle2, Syringe, Edit3, Trash2, Activity } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { formatDose } from '@/lib/dose-helpers';
import { buildEstimatedRemainingPreview } from '@/lib/estimated-remaining-preview';
import { getSchedulePreset, getScheduleSummary } from '@/lib/schedules';
import { cn } from '@/lib/utils';
import type { ScheduleLogStatus, StackStatus } from '@/lib/types';
import type { SchedulePreset } from '@/lib/schedules';

const statusConfig = {
  active: { icon: Play, label: 'Active', className: 'bg-primary/20 text-primary' },
  planned: { icon: Clock, label: 'Planned', className: 'bg-chart-4/20 text-chart-4' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'bg-chart-3/20 text-chart-3' },
  paused: { icon: Pause, label: 'Paused', className: 'bg-muted text-muted-foreground' },
};

const calendarFilters = ['all', 'pending', 'taken', 'skipped', 'missed'] as const;
type CalendarFilter = typeof calendarFilters[number];

function formatEstimatedRemainingMg(value: number): string {
  if (value < 0.01) return '<0.01 mg';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} mg`;
}

function formatHalfLife(hours: number): string {
  if (hours % 24 === 0) return `${hours / 24} day${hours === 24 ? '' : 's'}`;
  return `${hours} hours`;
}

const scheduleStatusConfig: Record<ScheduleLogStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-chart-4' },
  taken: { label: 'Taken', className: 'bg-chart-3' },
  skipped: { label: 'Skipped', className: 'bg-muted-foreground' },
  missed: { label: 'Missed', className: 'bg-destructive' },
};

export default function StackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, getStack, updateStack, deleteStack, activateStack, updateStackItemSchedule, getScheduleLogsForStack } = useApp();
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>('all');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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

  const config = statusConfig[stack.status];
  const StatusIcon = config.icon;

  const startDate = new Date(stack.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + stack.durationDays);

  const getProgressPercentage = () => {
    if (stack.status === 'planned') return 0;
    if (stack.status === 'completed') return 100;
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max((elapsed / stack.durationDays) * 100, 0), 100);
  };

  const progress = getProgressPercentage();

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
    setIsDeleteOpen(false);
    await deleteStack(stack.id);
    window.location.assign('/stacks');
  };

  const scheduleLogs = getScheduleLogsForStack(stack.id);
  const filteredScheduleLogs = calendarFilter === 'all'
    ? scheduleLogs
    : scheduleLogs.filter((log) => log.status === calendarFilter);
  const scheduleLogsByDate = filteredScheduleLogs.reduce<Record<string, typeof scheduleLogs>>((groups, log) => {
    const key = log.dueAt.slice(0, 10);
    groups[key] = [...(groups[key] ?? []), log];
    return groups;
  }, {});
  const trackableCompounds = getTrackableCompounds(data);
  const hasSchedulableItems = stack.peptides.length > 0;
  const scheduleCounts = scheduleLogs.reduce<Record<ScheduleLogStatus, number>>((counts, log) => {
    counts[log.status] += 1;
    return counts;
  }, { pending: 0, taken: 0, skipped: 0, missed: 0 });
  const estimatedRemainingRows = buildEstimatedRemainingPreview(stack, data);

  return (
    <AppShell>
      <PageHeader
        title={stack.name}
        backHref="/stacks"
        rightElement={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="text-primary" onClick={openEditDialog}>
              <Edit3 className="w-4 h-4 mr-1" /> Edit
              <span className="sr-only"> protocol</span>
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
              <span className="sr-only"> protocol</span>
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Status and Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className={cn("text-sm", config.className)}>
                <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                {config.label}
              </Badge>
              <div className="flex gap-2">
                {stack.status === 'planned' && (
                  <Button size="sm" disabled={!hasSchedulableItems} onClick={() => handleStatusChange('active')}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Start
                  </Button>
                )}
                {stack.status === 'active' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange('paused')}>
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange('completed')}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                    </Button>
                  </>
                )}
                {stack.status === 'paused' && (
                  <Button size="sm" onClick={() => handleStatusChange('active')}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Resume
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{stack.description}</p>
            {!hasSchedulableItems && (
              <p className="mb-4 rounded-md border border-chart-4/40 bg-chart-4/10 p-3 text-sm text-chart-4">
                Add at least one peptide before starting this stack.
              </p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{stack.durationDays} days total</span>
                <span>{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {estimatedRemainingRows.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Estimated remaining amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {estimatedRemainingRows.map((row) => (
                <div key={row.compoundId} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.compoundName}</p>
                      <p className="text-xs text-muted-foreground">
                        Half-life assumption: {formatHalfLife(row.halfLifeHours)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {row.evidenceTier}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Actual estimate</p>
                      <p className="font-medium">{formatEstimatedRemainingMg(row.actualEstimatedRemainingMg)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.actualEventCount} completed event{row.actualEventCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Pending estimate</p>
                      <p className="font-medium">{formatEstimatedRemainingMg(row.plannedEstimatedRemainingMg)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.plannedEventCount} pending event{row.plannedEventCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {row.halfLifeSource} {row.modelNotes}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="protocol" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="protocol" className="flex-1">Protocol</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="protocol" className="mt-4 space-y-3">
            {stack.peptides.map((sp) => {
              const compound = trackableCompounds.find((candidate) => candidate.id === sp.peptideId);
              return (
                <Card key={sp.id ?? sp.peptideId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{compound?.name ?? sp.peptideId}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {compound?.source === 'user' ? 'custom' : compound?.source ?? 'reference'}
                        </Badge>
                      </div>
                      <Syringe className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Dose</p>
                        <p className="font-medium">{formatDose(sp.doseValue, sp.doseUnit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Frequency</p>
                        <p className="font-medium">{sp.frequency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Route</p>
                        <p className="font-medium uppercase">{sp.route}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Timing</p>
                        <p className="font-medium">{sp.timing}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`schedule-${sp.id ?? sp.peptideId}`}>Schedule</Label>
                      <Select
                        value={getSchedulePreset(sp)}
                        onValueChange={(value) => sp.id && updateStackItemSchedule(stack.id, sp.id, value as SchedulePreset)}
                      >
                        <SelectTrigger id={`schedule-${sp.id ?? sp.peptideId}`} aria-label={`${compound?.name ?? sp.peptideId} schedule`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily · 8:00 AM</SelectItem>
                          <SelectItem value="twice-daily">2x daily · 8:00 AM, 8:00 PM</SelectItem>
                          <SelectItem value="weekdays">Weekdays · 8:00 AM</SelectItem>
                          <SelectItem value="weekly">Weekly · Monday</SelectItem>
                          <SelectItem value="twice-weekly">2x weekly · Monday, Thursday</SelectItem>
                          <SelectItem value="every-other-day">Every other day · 8:00 AM</SelectItem>
                          <SelectItem value="five-on-two-off">5 days on / 2 days off · 8:00 AM</SelectItem>
                          <SelectItem value="custom" disabled>Custom AI schedule</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {getScheduleSummary(sp.schedule ?? { frequency: 'daily', timesOfDay: ['08:00'] })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Protocol Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2" aria-label="Calendar status filters">
                  {calendarFilters.map((filter) => (
                    <Button
                      key={filter}
                      type="button"
                      size="sm"
                      variant={calendarFilter === filter ? 'default' : 'outline'}
                      className="h-8 capitalize"
                      onClick={() => setCalendarFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-muted-foreground py-1">{day}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dayNum = i - startDate.getDay() + 1;
                    const isInRange = dayNum > 0 && dayNum <= stack.durationDays;
                    const isToday = dayNum === Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + Math.max(dayNum - 1, 0));
                    const logsForDay = isInRange ? scheduleLogsByDate[dayDate.toISOString().slice(0, 10)] ?? [] : [];
                    const hasTaken = logsForDay.some((log) => log.status === 'taken');
                    const hasSkipped = logsForDay.some((log) => log.status === 'skipped');
                    const hasMissed = logsForDay.some((log) => log.status === 'missed');
                    const hasPending = logsForDay.some((log) => log.status === 'pending');
                    return (
                      <div 
                        key={i} 
                        aria-label={isInRange && logsForDay.length > 0 ? `Day ${dayNum}: ${logsForDay.length} scheduled, ${logsForDay.map((log) => log.status).join(', ')}` : undefined}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-md text-xs",
                          isInRange && "bg-secondary",
                          isToday && "bg-primary text-primary-foreground font-bold",
                          hasPending && "ring-1 ring-chart-4",
                          hasTaken && "bg-chart-3/20 text-chart-3",
                          hasSkipped && "bg-muted text-muted-foreground line-through",
                          hasMissed && "bg-destructive/15 text-destructive",
                          !isInRange && "text-muted-foreground/30"
                        )}
                      >
                        <span>{isInRange ? dayNum : ''}</span>
                        {logsForDay.length > 0 && <span className="text-[9px]">{logsForDay.length}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Calendar legend">
                  {(Object.keys(scheduleStatusConfig) as ScheduleLogStatus[]).map((status) => (
                    <span key={status} className="inline-flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', scheduleStatusConfig[status].className)} />
                      {scheduleStatusConfig[status].label}
                    </span>
                  ))}
                </div>
                {scheduleLogs.length === 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Start this stack to generate scheduled due doses.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {stack.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{stack.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes added</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {scheduleLogs.length > 0 && (
          <Card className="border-chart-4/50 bg-chart-4/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-chart-4">
                <AlertTriangle className="w-4 h-4" />
                Schedule State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {scheduleCounts.pending} pending · {scheduleCounts.taken} taken · {scheduleCounts.skipped} skipped · {scheduleCounts.missed} missed
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit protocol</DialogTitle>
            <DialogDescription>
              Update the saved protocol basics. Dose schedules remain editable from the Protocol tab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-name">Protocol name</Label>
              <Input
                id="edit-protocol-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-description">Description</Label>
              <Textarea
                id="edit-protocol-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-duration">Duration (days)</Label>
              <Input
                id="edit-protocol-duration"
                type="number"
                min="1"
                value={editDurationDays}
                onChange={(event) => setEditDurationDays(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-protocol-notes">Notes</Label>
              <Textarea
                id="edit-protocol-notes"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim() || Number(editDurationDays) < 1}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete protocol?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved protocol, its generated schedule, and due-dose calendar entries. Dose logs created from that schedule are also removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void handleDelete()}>
              Delete protocol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
