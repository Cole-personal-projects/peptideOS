"use client";

import { useMemo, useState } from 'react';
import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { getAllowedWorkflowDoseUnits, getTrackableCompounds, getWorkflowDosePresets } from '@/lib/compound-workflows';
import { useApp } from '@/lib/context';
import { formatDose, getDoseUnitLabel } from '@/lib/dose-helpers';
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
    const parsedDoseValue = parseFloat(doseValue);
    if (saving || !peptideId || !vialId || Number.isNaN(parsedDoseValue) || parsedDoseValue <= 0) return;
    if (requiresSite && !site) return;

    if (selectedScheduleLog) {
      setSaving(true);
      try {
        await completeScheduleLog(selectedScheduleLog.log.id, { vialId, site, notes });
        resetForm();
        onOpenChange(false);
      } finally {
        setSaving(false);
      }
      return;
    }

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

    resetForm();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-hidden rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Log Dose</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {dueProtocolLogs.length > 0 && (
            <div className="space-y-2 rounded-[14px] border border-border bg-card p-3">
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
                      className="h-auto w-full justify-between gap-3 rounded-[12px] px-3 py-2 text-left"
                      onClick={() => handleScheduledLogSelect(log, schedule)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{peptide?.name ?? log.peptideId}</span>
                        <span className="block text-xs opacity-80">{formatDose(schedule.doseValue, schedule.doseUnit)} · {schedule.route.toUpperCase()}</span>
                      </span>
                      <span className="text-xs font-semibold">
                        {new Date(log.dueAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedScheduleLog && (
            <div className="rounded-[12px] border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              Completing this protocol dose. The log will clear from today after submission.
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
                        {vial.lotNumber} ({vial.mg}mg)
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

          <div className="space-y-2">
            <Label>Dose</Label>
            <div className="grid grid-cols-[1fr_104px] gap-2">
              <Input
                type="number"
                step="any"
                placeholder="e.g., 250"
                value={doseValue}
                onChange={(event) => setDoseValue(event.target.value)}
              />
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
            {selectedCompound && (
              <p className="text-xs text-muted-foreground">
                Default: {selectedCompound.defaultRoute.toUpperCase()} · {selectedCompound.defaultDoseUnit.toUpperCase()}
              </p>
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
              <BodyMannequin
                compact
                doses={data.doses}
                route={route}
                selectedSite={site}
                onSiteChange={setSite}
                onRouteChange={handleRouteChange}
                getPeptide={getPeptide}
              />
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
            <Textarea
              placeholder="Any observations or notes..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <Button
            className="w-full"
            size="lg"
            onClick={() => void handleSubmit()}
            disabled={saving || !peptideId || !vialId || !doseValue || (requiresSite && !site)}
          >
            {selectedScheduleLog ? 'Complete Scheduled Dose' : 'Log Dose'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
