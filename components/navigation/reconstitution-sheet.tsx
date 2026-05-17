"use client";

import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ReconstitutionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReconstitutionSheet({ open, onOpenChange }: ReconstitutionSheetProps) {
  const [peptideMg, setPeptideMg] = useState('5');
  const [bacWaterMl, setBacWaterMl] = useState('2');
  const [desiredDoseMcg, setDesiredDoseMcg] = useState('250');

  const calculations = useMemo(() => {
    const mg = parseFloat(peptideMg) || 0;
    const ml = parseFloat(bacWaterMl) || 0;
    const doseMcg = parseFloat(desiredDoseMcg) || 0;

    if (mg === 0 || ml === 0) return null;

    const totalMcg = mg * 1000;
    const concentrationMcgPerMl = totalMcg / ml;
    const mlPerDose = doseMcg / concentrationMcgPerMl;
    const unitsPerDose = mlPerDose * 100; // 100 units per mL
    const dosesPerVial = totalMcg / doseMcg;

    return {
      concentrationMcgPerMl: concentrationMcgPerMl.toFixed(0),
      mlPerDose: mlPerDose.toFixed(3),
      unitsPerDose: unitsPerDose.toFixed(1),
      dosesPerVial: dosesPerVial.toFixed(1)
    };
  }, [peptideMg, bacWaterMl, desiredDoseMcg]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Reconstitution Calculator</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 pb-8">
          <div className="space-y-2">
            <Label>Peptide Amount (mg)</Label>
            <Input
              type="number"
              step="0.5"
              value={peptideMg}
              onChange={(e) => setPeptideMg(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Bacteriostatic Water (mL)</Label>
            <Input
              type="number"
              step="0.5"
              value={bacWaterMl}
              onChange={(e) => setBacWaterMl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Desired Dose (mcg)</Label>
            <Input
              type="number"
              step="50"
              value={desiredDoseMcg}
              onChange={(e) => setDesiredDoseMcg(e.target.value)}
            />
          </div>

          {calculations && (
            <Card className="p-4 mt-6 bg-secondary">
              <h3 className="font-semibold mb-4 text-primary">Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concentration</span>
                  <span className="font-mono font-medium">{calculations.concentrationMcgPerMl} mcg/mL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume per dose</span>
                  <span className="font-mono font-medium">{calculations.mlPerDose} mL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insulin units per dose</span>
                  <span className="font-mono font-medium text-primary">{calculations.unitsPerDose} IU</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Doses per vial</span>
                  <span className="font-mono font-medium">{calculations.dosesPerVial}</span>
                </div>
              </div>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center pt-4">
            Standard insulin syringes: 100 units = 1 mL
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
