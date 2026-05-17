"use client";

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ReconstitutionPage() {
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
    <AppShell>
      <PageHeader title="Reconstitution Calculator" backHref="/more" />

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {calculations && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold">{calculations.concentrationMcgPerMl}</p>
                  <p className="text-xs text-muted-foreground mt-1">mcg per mL</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold text-primary">{calculations.unitsPerDose}</p>
                  <p className="text-xs text-muted-foreground mt-1">units per dose</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Volume per dose</span>
                  <span className="font-mono font-medium">{calculations.mlPerDose} mL</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Insulin units per dose</span>
                  <span className="font-mono font-medium">{calculations.unitsPerDose} IU</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Doses per vial</span>
                  <span className="font-mono font-medium">{calculations.dosesPerVial}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center px-4">
          Standard insulin syringes: 100 units = 1 mL. Always verify your calculations before use.
        </p>
      </div>
    </AppShell>
  );
}
