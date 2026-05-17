"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BodyMannequin } from '@/components/site-picker/body-mannequin';
import { useApp } from '@/lib/context';
import { getAllowedDoseUnits, getDefaultDoseUnit, getDoseUnitLabel } from '@/lib/dose-helpers';
import type { DoseUnit, Route, SiteCode } from '@/lib/types';

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
  const { data, addDose, getPeptide } = useApp();
  const [peptideId, setPeptideId] = useState('');
  const [vialId, setVialId] = useState('');
  const [doseValue, setDoseValue] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg');
  const [route, setRoute] = useState<Route>('subq');
  const [site, setSite] = useState<SiteCode | ''>('');
  const [notes, setNotes] = useState('');

  const activeVials = data.vials.filter(v => v.status === 'active');
  const selectedPeptide = getPeptide(peptideId);
  const filteredVials = activeVials.filter(v => v.peptideId === peptideId);
  const allowedDoseUnits: DoseUnit[] = peptideId ? getAllowedDoseUnits(peptideId) : ['mcg', 'mg'];
  const requiresSite = injectableRoutes.includes(route);

  const handlePeptideChange = (value: string) => {
    const peptide = getPeptide(value);
    setPeptideId(value);
    setVialId('');
    setDoseUnit(getDefaultDoseUnit(value));
    setRoute(peptide?.defaultRoute || 'subq');
    setSite('');
  };

  const handleRouteChange = (value: Route) => {
    setRoute(value);
    setSite('');
  };

  const handleSubmit = () => {
    const parsedDoseValue = parseFloat(doseValue);
    if (!peptideId || !vialId || Number.isNaN(parsedDoseValue) || parsedDoseValue <= 0) return;
    if (requiresSite && !site) return;
    
    addDose({
      peptideId,
      vialId,
      dateTime: new Date().toISOString(),
      doseValue: parsedDoseValue,
      doseUnit,
      route,
      site,
      notes,
      completed: true
    });

    // Reset form
    setPeptideId('');
    setVialId('');
    setDoseValue('');
    setDoseUnit('mcg');
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
            <Select value={peptideId} onValueChange={handlePeptideChange}>
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
            <Label>Dose</Label>
            <div className="grid grid-cols-[1fr_104px] gap-2">
              <Input
                type="number"
                step="any"
                placeholder="e.g., 250"
                value={doseValue}
                onChange={(e) => setDoseValue(e.target.value)}
              />
              <Select value={doseUnit} onValueChange={(v) => setDoseUnit(v as DoseUnit)}>
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
            {selectedPeptide && (
              <p className="text-xs text-muted-foreground">
                Typical: {selectedPeptide.protocols[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Route</Label>
            <Select value={route} onValueChange={(v) => handleRouteChange(v as Route)}>
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
                  <SelectItem value="none" disabled>No injection site for this route</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
            disabled={!peptideId || !vialId || !doseValue || (requiresSite && !site)}
          >
            Log Dose
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
