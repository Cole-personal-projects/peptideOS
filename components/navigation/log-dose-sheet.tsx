"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import type { Route } from '@/lib/types';

interface LogDoseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sites = [
  { value: 'abdomen-upper-left', label: 'Abdomen Upper Left' },
  { value: 'abdomen-upper-right', label: 'Abdomen Upper Right' },
  { value: 'abdomen-lower-left', label: 'Abdomen Lower Left' },
  { value: 'abdomen-lower-right', label: 'Abdomen Lower Right' },
  { value: 'thigh-left', label: 'Left Thigh' },
  { value: 'thigh-right', label: 'Right Thigh' },
  { value: 'deltoid-left', label: 'Left Deltoid' },
  { value: 'deltoid-right', label: 'Right Deltoid' },
  { value: 'glute-left', label: 'Left Glute' },
  { value: 'glute-right', label: 'Right Glute' },
];

const routes: { value: Route; label: string }[] = [
  { value: 'subq', label: 'Subcutaneous' },
  { value: 'im', label: 'Intramuscular' },
  { value: 'intranasal', label: 'Intranasal' },
  { value: 'oral', label: 'Oral' },
];

export function LogDoseSheet({ open, onOpenChange }: LogDoseSheetProps) {
  const { data, addDose, getPeptide } = useApp();
  const [peptideId, setPeptideId] = useState('');
  const [vialId, setVialId] = useState('');
  const [doseMcg, setDoseMcg] = useState('');
  const [route, setRoute] = useState<Route>('subq');
  const [site, setSite] = useState('');
  const [notes, setNotes] = useState('');

  const activeVials = data.vials.filter(v => v.status === 'active');
  const selectedPeptide = getPeptide(peptideId);
  const filteredVials = activeVials.filter(v => v.peptideId === peptideId);

  const handleSubmit = () => {
    if (!peptideId || !vialId || !doseMcg) return;
    
    addDose({
      peptideId,
      vialId,
      dateTime: new Date().toISOString(),
      doseMcg: parseInt(doseMcg),
      route,
      site,
      notes,
      completed: true
    });

    // Reset form
    setPeptideId('');
    setVialId('');
    setDoseMcg('');
    setRoute('subq');
    setSite('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Log Dose</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 pb-8">
          <div className="space-y-2">
            <Label>Peptide</Label>
            <Select value={peptideId} onValueChange={(v) => { setPeptideId(v); setVialId(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select peptide" />
              </SelectTrigger>
              <SelectContent>
                {data.peptides.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                    filteredVials.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.lotNumber} ({v.mg}mg)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No active vials</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Dose (mcg)</Label>
            <Input
              type="number"
              placeholder="e.g., 250"
              value={doseMcg}
              onChange={(e) => setDoseMcg(e.target.value)}
            />
            {selectedPeptide && (
              <p className="text-xs text-muted-foreground">
                Typical: {selectedPeptide.protocols[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Route</Label>
            <Select value={route} onValueChange={(v) => setRoute(v as Route)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routes.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Injection Site</Label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any observations or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            className="w-full mt-6" 
            size="lg"
            onClick={handleSubmit}
            disabled={!peptideId || !vialId || !doseMcg}
          >
            Log Dose
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
