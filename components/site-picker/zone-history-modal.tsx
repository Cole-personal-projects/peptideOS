"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDose } from '@/lib/dose-helpers';
import type { SelectedZoneSummary } from '@/lib/site-picker';
import type { Peptide } from '@/lib/types';

interface ZoneHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SelectedZoneSummary | null;
  getPeptide: (id: string) => Peptide | undefined;
}

export function ZoneHistoryModal({ open, onOpenChange, summary, getPeptide }: ZoneHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{summary?.label ?? 'Site history'}</DialogTitle>
        </DialogHeader>

        {!summary || summary.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed doses logged for this site.</p>
        ) : (
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {summary.history.map((dose) => {
              const peptide = getPeptide(dose.peptideId);

              return (
                <div key={dose.id} className="rounded-md border border-border bg-secondary/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{peptide?.name ?? dose.peptideId}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dose.dateTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">{formatDose(dose.doseValue, dose.doseUnit)}</Badge>
                  </div>
                  {dose.notes && <p className="mt-2 text-xs text-muted-foreground">{dose.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
