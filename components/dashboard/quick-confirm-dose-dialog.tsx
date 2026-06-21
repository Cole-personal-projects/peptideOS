"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import { formatDose } from '@/lib/dose-helpers';
import { getVialInventoryMetrics } from '@/lib/inventory-metrics';
import type { SiteCode } from '@/lib/types';

interface QuickConfirmDoseDialogProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const injectableRoutes = new Set(['subq', 'im']);

function formatScheduledTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function QuickConfirmDoseDialog({ logId, open, onOpenChange }: QuickConfirmDoseDialogProps) {
  const { data, getPeptide, completeScheduleLog } = useApp();
  const [vialId, setVialId] = useState('');
  const [site, setSite] = useState<SiteCode | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const activeLog = useMemo(
    () => data.scheduleLogs.find((log) => log.id === logId && log.status === 'pending') ?? null,
    [data.scheduleLogs, logId],
  );
  const activeSchedule = useMemo(
    () => data.schedules.find((schedule) => schedule.id === activeLog?.scheduleId) ?? null,
    [activeLog?.scheduleId, data.schedules],
  );
  const activeStack = useMemo(
    () => data.stacks.find((stack) => stack.id === activeLog?.stackId) ?? null,
    [activeLog?.stackId, data.stacks],
  );
  const activeVials = useMemo(
    () => data.vials.filter((vial) => vial.peptideId === activeLog?.peptideId && vial.status === 'active'),
    [activeLog?.peptideId, data.vials],
  );

  const requiresSite = Boolean(activeSchedule && injectableRoutes.has(activeSchedule.route));
  const canConfirm = Boolean(activeLog && activeSchedule && vialId && (!requiresSite || site));

  const resetForm = () => {
    setVialId('');
    setSite('');
    setNotes('');
    setSaving(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!activeLog || !canConfirm) return;
    setSaving(true);
    try {
      await completeScheduleLog(activeLog.id, { vialId, site, notes });
      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const peptide = activeLog ? getPeptide(activeLog.peptideId) : undefined;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick confirm dose</DialogTitle>
          <DialogDescription>
            Review the scheduled dose, choose the inventory source, then confirm the log.
          </DialogDescription>
        </DialogHeader>

        {activeLog && activeSchedule ? (
          <div className="space-y-5">
            <div className="rounded-md bg-secondary p-3 text-sm">
              <p className="font-medium">
                {peptide?.name ?? activeLog.peptideId} · {formatDose(activeSchedule.doseValue, activeSchedule.doseUnit)}
              </p>
              <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>Scheduled</dt>
                  <dd className="text-right text-foreground">{formatScheduledTime(activeLog.dueAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Route</dt>
                  <dd className="text-right text-foreground">{activeSchedule.route.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Stack</dt>
                  <dd className="text-right text-foreground">{activeStack?.name ?? 'Active stack'}</dd>
                </div>
              </dl>
            </div>

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
                  <p className="font-medium text-chart-4">No active inventory source</p>
                  <p className="mt-1 text-muted-foreground">
                    Add or activate inventory before quick confirming this scheduled dose.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/more/inventory">Open Inventory</Link>
                  </Button>
                </div>
              )}
            </div>

            {requiresSite && (
              <div className="space-y-2">
                <Label>Injection site</Label>
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
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm">
            <p className="font-medium">This scheduled dose is no longer pending.</p>
            <p className="mt-1 text-muted-foreground">Open the full log to review or add a manual record.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button asChild variant="outline">
            <Link href="/log">Full log</Link>
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!canConfirm || saving}>
            Confirm dose
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
