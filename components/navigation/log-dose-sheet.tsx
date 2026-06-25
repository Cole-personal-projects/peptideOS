"use client";

import { useMemo, useState } from 'react';

import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { StatusDot } from '@/components/ui/visual-primitives';
import { getAllowedWorkflowDoseUnits, getTrackableCompounds, getWorkflowDosePresets } from '@/lib/compound-workflows';
import { useApp } from '@/lib/context';
import { formatDose, getDoseUnitLabel } from '@/lib/dose-helpers';
import { getVialInventoryMetrics } from '@/lib/inventory-metrics';
import type { DoseUnit, Route, Schedule, ScheduleLog, SiteCode } from '@/lib/types';

interface LogDoseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const routes: { value: Route; label: string }[] = [
  { value: 'subq', label: 'Subcutaneous' },
  { value: 'im', label: 'Intramuscular' },
  { value: 'intranasal', label: 'Intranasal' },
  { value: 'oral', label: 'Oral' },
  { value: 'topical', label: 'Topical' },
];

const injectableRoutes: Route[] = ['subq', 'im'];

function formatDueTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function LogDoseSheet({ open, onOpenChange }: LogDoseSheetProps) {
  const { data, addDose, completeScheduleLog, getPeptide } = useApp();
  const [peptideId, setPeptideId] = useState('');
  const [vialId, setVialId] = useState('');
  const [doseValue, setDoseValue] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg');
  const [route, setRoute] = useState<Route>('subq');
  const [site, setSite] = useState<SiteCode | ''>('');
  const [notes, setNotes] = useState('');
  const [scheduleLogId, setScheduleLogId] = useState('');
  const [saving, setSaving] = useState(false);

  const trackableCompounds = getTrackableCompounds(data);
  const activeVials = data.vials.filter((vial) => vial.status === 'active');
  const selectedCompound = trackableCompounds.find((compound) => compound.id === peptideId);
  const filteredVials = activeVials.filter((vial) => vial.peptideId === peptideId);
  const selectedVial = filteredVials.find((vial) => vial.id === vialId) ?? null;
  const allowedDoseUnits: DoseUnit[] = getAllowedWorkflowDoseUnits(selectedCompound);
  const dosePresets = getWorkflowDosePresets(selectedCompound);
  const requiresSite = injectableRoutes.includes(route);

  const dueProtocolLogs = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    return data.scheduleLogs
      .filter((log) => log.status === 'pending' && new Date(log.dueAt).getTime() <= endOfToday.getTime())
      .map((log) => ({
        log,
        schedule: data.schedules.find((schedule) => schedule.id === log.scheduleId) ?? null,
      }))
      .filter((entry): entry is { log: ScheduleLog; schedule: Schedule } => Boolean(entry.schedule))
      .sort((a, b) => new Date(a.log.dueAt).getTime() - new Date(b.log.dueAt).getTime());
  }, [data.scheduleLogs, data.schedules]);

  const selectedScheduleLog = scheduleLogId
    ? dueProtocolLogs.find((entry) => entry.log.id === scheduleLogId) ?? null
    : null;

  const resetForm = () => {
    setScheduleLogId('');
    setPeptideId('');
    setVialId('');
    setDoseValue('');
    setDoseUnit('mcg');
    setRoute('subq');
    setSite('');
    setNotes('');
    setSaving(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handlePeptideChange = (value: string) => {
    const compound = trackableCompounds.find((candidate) => candidate.id === value);
    setScheduleLogId('');
    setPeptideId(value);
    setVialId('');
    setDoseValue('');
    setDoseUnit(compound?.defaultDoseUnit ?? 'mcg');
    setRoute(compound?.defaultRoute || 'subq');
    setSite('');
  };

  const handleRouteChange = (value: Route) => {
    setScheduleLogId('');
    setRoute(value);
    setSite('');
  };

  const handleScheduledLogSelect = (log: ScheduleLog, schedule: Schedule) => {
    const matchingVials = activeVials.filter((vial) => vial.peptideId === log.peptideId);
    setScheduleLogId(log.id);
    setPeptideId(log.peptideId);
    setVialId(matchingVials.length === 1 ? matchingVials[0].id : '');
    setDoseValue(schedule.doseValue.toString());
    setDoseUnit(schedule.doseUnit);
    setRoute(schedule.route);
    setSite('');
  };

  const handleSubmit = async () => {
    const parsedDoseValue = Number.parseFloat(doseValue);
    if (saving || !peptideId || !vialId || Number.isNaN(parsedDoseValue) || parsedDoseValue <= 0) return;
    if (requiresSite && !site) return;

    setSaving(true);
    try {
      if (selectedScheduleLog) {
        await completeScheduleLog(selectedScheduleLog.log.id, { vialId, site, notes });
      } else {
        addDose({
          peptideId,
          vialId,
          dateTime: new Date().toISOString(),
          doseValue: parsedDoseValue,
          doseUnit,
          route,
          site,
          notes,
          completed: true,
        });
      }

      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = Boolean(peptideId && vialId && doseValue && (!requiresSite || site));

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="flex h-[88vh] flex-col overflow-hidden rounded-t-3xl px-0">
        <SheetHeader className="shrink-0 px-4 pb-3">
          <SheetTitle>Log Dose</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="rounded-[18px] border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {selectedScheduleLog ? 'Scheduled' : 'Manual'}
                </p>
                <h2 className="mt-1 truncate text-base font-bold">{selectedCompound?.name ?? 'Select compound'}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doseValue ? formatDose(Number.parseFloat(doseValue) || 0, doseUnit) : 'Dose not set'} - {route.toUpperCase()}
                </p>
              </div>
              <Badge variant={selectedScheduleLog ? 'secondary' : 'outline'}>{selectedScheduleLog ? 'Due dose' : 'Manual log'}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[12px] bg-secondary/60 p-2">
                <p className="font-bold text-muted-foreground">Vial</p>
                <p className="mt-1 truncate font-semibold">{selectedVial?.name ?? 'Not selected'}</p>
              </div>
              <div className="rounded-[12px] bg-secondary/60 p-2">
                <p className="font-bold text-muted-foreground">Site</p>
                <p className="mt-1 truncate font-semibold">{requiresSite ? site || 'Required' : 'Not needed'}</p>
              </div>
            </div>
          </div>

          {dueProtocolLogs.length > 0 && (
            <div className="space-y-2 rounded-[18px] border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Due protocol doses</Label>
                {selectedScheduleLog && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setScheduleLogId('')}>
                    Manual
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {dueProtocolLogs.slice(0, 3).map(({ log, schedule }) => {
                  const peptide = getPeptide(log.peptideId);
                  const selected = log.id === scheduleLogId;
                  return (
                    <Button
                      key={log.id}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      className="h-auto w-full justify-between gap-3 rounded-[14px] px-3 py-2 text-left"
                      onClick={() => handleScheduledLogSelect(log, schedule)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{peptide?.name ?? log.peptideId}</span>
                        <span className="block text-xs opacity-80">{formatDose(schedule.doseValue, schedule.doseUnit)} - {schedule.route.toUpperCase()}</span>
                      </span>
                      <span className="text-xs font-semibold">{formatDueTime(log.dueAt)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedScheduleLog && (
            <div className="rounded-[14px] border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              Completing this protocol dose. This will clear the scheduled item after submission.
            </div>
          )}

          <div className="space-y-2">
            <Label>Compound</Label>
            <Select value={peptideId} onValueChange={handlePeptideChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select compound" />
              </SelectTrigger>
              <SelectContent>
                {trackableCompounds.map((compound) => (
                  <SelectItem key={compound.id} value={compound.id}>
                    {compound.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {peptideId && (
            <div className="space-y-2">
              <Label>Vial</Label>
              <Select value={vialId} onValueChange={setVialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vial" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVials.length > 0 ? (
                    filteredVials.map((vial) => (
                      <SelectItem key={vial.id} value={vial.id}>
                        {vial.name} - {vial.lotNumber || 'no lot'} ({vial.mg}mg)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No active vials
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {peptideId && filteredVials.length > 0 && (
            <div className="grid gap-2">
              {filteredVials.map((vial) => {
                const metrics = getVialInventoryMetrics(vial, data.doses);
                const selected = vial.id === vialId;
                return (
                  <button
                    key={vial.id}
                    type="button"
                    className={`rounded-[16px] border p-3 text-left transition-colors ${selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-secondary/40'}`}
                    onClick={() => setVialId(vial.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusDot tone={selected ? 'primary' : 'success'} />
                          <p className="truncate text-sm font-bold">{vial.name}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{vial.lotNumber || 'no lot'} - {metrics.remainingLabel} left</p>
                      </div>
                      <Badge variant={selected ? 'default' : 'secondary'}>{vial.status}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label>Dose</Label>
            <div className="grid grid-cols-[1fr_104px] gap-2">
              <Input type="number" step="any" placeholder="e.g., 250" value={doseValue} onChange={(event) => setDoseValue(event.target.value)} />
              <Select value={doseUnit} onValueChange={(value) => setDoseUnit(value as DoseUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedDoseUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {getDoseUnitLabel(unit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dosePresets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dosePresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setDoseValue(preset.doseValue.toString());
                      setDoseUnit(preset.doseUnit);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Route</Label>
            <Select value={route} onValueChange={(value) => handleRouteChange(value as Route)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routes.map((candidate) => (
                  <SelectItem key={candidate.value} value={candidate.value}>
                    {candidate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresSite ? (
            <div className="space-y-2">
              <Label>Injection Site</Label>
              <BodyMannequin compact doses={data.doses} route={route} selectedSite={site} onSiteChange={setSite} onRouteChange={handleRouteChange} getPeptide={getPeptide} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={site} onValueChange={(value) => setSite(value as SiteCode)} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="No injection site for this route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    No injection site for this route
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea placeholder="Any observations or notes..." value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <Button className="w-full" size="lg" onClick={() => void handleSubmit()} disabled={saving || !canSubmit}>
            {selectedScheduleLog ? 'Complete Scheduled Dose' : 'Log Dose'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
