"use client";

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Share2, Beaker, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDose } from '@/lib/dose-helpers';
import type { DoseUnit } from '@/lib/types';
import { useApp } from '@/lib/context';

import {
  peptideConversions,
  syringeTypes,
  quickPresets,
  educationalContent,
  getConversionById,
  type PeptideConversion,
  type SyringeType,
  type QuickPreset,
} from '@/lib/peptide-conversions';
import {
  calculateReconstitution,
  getReconstitutionWarnings,
  type VialUnit,
} from '@/lib/reconstitution-calculations';

import { SyringeVisualization } from '@/components/reconstitution/syringe-visualization';
import { InfoPopover } from '@/components/reconstitution/info-popover';
import { WarningsPanel, type Warning } from '@/components/reconstitution/warnings-panel';
import { QuickPresets } from '@/components/reconstitution/quick-presets';
import { 
  SavedCalculations, 
  generateShareText, 
  type SavedCalculation 
} from '@/components/reconstitution/saved-calculations';

export default function ReconstitutionPage() {
  const { data, addReconstitutionCalculation, deleteReconstitutionCalculation } = useApp();
  const searchParams = useSearchParams();
  const initialCompoundFromQuery = getConversionById(searchParams.get('compound') ?? '');
  const initialCompoundId = initialCompoundFromQuery?.id ?? 'bpc-157';
  const initialCompound = getConversionById(initialCompoundId);
  // State
  const [selectedCompoundId, setSelectedCompoundId] = useState<string>(initialCompoundId);
  const [vialSize, setVialSize] = useState<string>(() => initialCompoundFromQuery?.typicalVialSizes[0]?.value.toString() ?? '5');
  const [vialUnit, setVialUnit] = useState<VialUnit>(initialCompoundFromQuery?.dosingMode === 'iu-primary' ? 'iu' : 'mg');
  const [bacWaterMl, setBacWaterMl] = useState<number>(2);
  const [doseValue, setDoseValue] = useState<string>(() => initialCompoundFromQuery?.typicalDoseRange.min.toString() ?? '250');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>(
    initialCompoundFromQuery?.dosingMode === 'iu-primary' ? 'iu' : initialCompoundFromQuery?.defaultUnit === 'mg' ? 'mg' : 'mcg',
  );
  const [syringeTypeId, setSyringeTypeId] = useState<string>('u100-1ml');
  const [vialCost, setVialCost] = useState<string>('');
  const [cycleDays, setCycleDays] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  // Get current compound and syringe
  const compound = useMemo(() => getConversionById(selectedCompoundId), [selectedCompoundId]);
  const syringe = useMemo(() => 
    syringeTypes.find(s => s.id === syringeTypeId) || syringeTypes[0], 
    [syringeTypeId]
  );
  
  const isIUCompound = compound?.dosingMode === 'iu-primary';
  const isMcgOnlyCompound = compound?.dosingMode === 'mcg-only';

  const applyCompoundDefaults = useCallback((compoundId: string) => {
    const nextCompound = getConversionById(compoundId);
    if (!nextCompound) return;

    setSelectedCompoundId(compoundId);
    setVialUnit(nextCompound.dosingMode === 'iu-primary' ? 'iu' : 'mg');
    setDoseUnit(nextCompound.dosingMode === 'iu-primary' ? 'iu' : nextCompound.defaultUnit === 'mg' ? 'mg' : 'mcg');

    const defaultVial = nextCompound.typicalVialSizes[0];
    if (defaultVial) {
      setVialSize(defaultVial.value.toString());
    }
    setDoseValue(nextCompound.typicalDoseRange.min.toString());
  }, []);

  // Calculations
  const calculations = useMemo(() => {
    const vialNum = parseFloat(vialSize) || 0;
    const doseNum = parseFloat(doseValue) || 0;
    const cost = parseFloat(vialCost);
    const days = parseInt(cycleDays);

    if (!compound) return null;

    return calculateReconstitution({
      compound,
      syringe,
      vialSize: vialNum,
      vialUnit,
      bacWaterMl,
      doseValue: doseNum,
      doseUnit,
      vialCost: Number.isNaN(cost) ? null : cost,
      cycleDays: Number.isNaN(days) ? null : days,
    });
  }, [vialSize, vialUnit, bacWaterMl, doseValue, doseUnit, syringe, compound, vialCost, cycleDays]);

  // Generate warnings
  const warnings = useMemo<Warning[]>(() => {
    const doseNum = parseFloat(doseValue) || 0;
    return getReconstitutionWarnings({
      calculations,
      compound,
      syringe,
      doseValue: doseNum,
      doseUnit,
      isIUCompound,
    });
  }, [calculations, compound, syringe, doseValue, doseUnit, isIUCompound]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: QuickPreset) => {
    applyCompoundDefaults(preset.compoundId);
    setDoseValue(preset.doseValue.toString());
    setDoseUnit(preset.doseUnit);
    setSelectedPresetId(preset.id);
    setVialUnit(preset.doseUnit === 'iu' ? 'iu' : 'mg');
  }, [applyCompoundDefaults]);

  // Save calculation
  const handleSave = useCallback(() => {
    if (!calculations || !compound) return;
    
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      compoundName: compound.name,
      compoundId: compound.id,
      vialSize: parseFloat(vialSize),
      vialUnit,
      bacWaterMl,
      doseValue: parseFloat(doseValue),
      doseUnit,
      drawUnits: calculations.syringeUnits,
      drawMl: calculations.volumeToDrawMl,
      concentration: calculations.concentrationDisplay,
      dosesPerVial: calculations.totalDoses,
      savedAt: new Date().toISOString(),
    };
    
    addReconstitutionCalculation(newCalc);
    toast.success('Calculation saved');
  }, [addReconstitutionCalculation, calculations, compound, vialSize, vialUnit, bacWaterMl, doseValue, doseUnit]);

  // Share calculation
  const handleShare = useCallback(async () => {
    if (!calculations || !compound) return;
    
    const calc: SavedCalculation = {
      id: 'share',
      compoundName: compound.name,
      compoundId: compound.id,
      vialSize: parseFloat(vialSize),
      vialUnit,
      bacWaterMl,
      doseValue: parseFloat(doseValue),
      doseUnit,
      drawUnits: calculations.syringeUnits,
      drawMl: calculations.volumeToDrawMl,
      concentration: calculations.concentrationDisplay,
      dosesPerVial: calculations.totalDoses,
      savedAt: new Date().toISOString(),
    };
    
    const text = generateShareText(calc);
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, [calculations, compound, vialSize, vialUnit, bacWaterMl, doseValue, doseUnit]);

  // Handle copy from saved
  const handleCopyFromSaved = useCallback(async (calc: SavedCalculation) => {
    const text = generateShareText(calc);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  // Handle use for logging
  const handleUseForLogging = useCallback((calc: SavedCalculation) => {
    toast.info('Opening dose logger...', { description: `Pre-filled with ${formatDose(calc.doseValue, calc.doseUnit)} of ${calc.compoundName}` });
    // In a real app, this would navigate to the dose logger with pre-filled data
  }, []);

  // Handle delete saved
  const handleDeleteSaved = useCallback((id: string) => {
    deleteReconstitutionCalculation(id);
    toast.success('Calculation deleted');
  }, [deleteReconstitutionCalculation]);

  // Get dose label for syringe visualization
  const doseLabel = useMemo(() => {
    if (!calculations) return '';
    const doseNum = parseFloat(doseValue) || 0;
    return formatDose(doseNum, doseUnit);
  }, [calculations, doseValue, doseUnit]);

  return (
    <AppShell>
      <PageHeader title="Reconstitution Calculator" backHref="/more" />
      
      <div className="p-4 pb-32 space-y-4">
        {/* Compound Selector */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Compound
              </Label>
              <Select value={selectedCompoundId} onValueChange={(v) => {
                applyCompoundDefaults(v);
                setSelectedPresetId(undefined);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select compound" />
                </SelectTrigger>
                <SelectContent>
                  {peptideConversions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.dosingMode === 'iu-primary' && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">IU</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {compound?.notes && (
                <p className="text-xs text-muted-foreground">{compound.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Presets */}
        <QuickPresets 
          presets={quickPresets} 
          onSelect={handlePresetSelect}
          selectedId={selectedPresetId}
        />

        {/* Inputs */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Vial Size */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Vial Size
                <InfoPopover 
                  title="Vial Size"
                  content="Enter the total amount of peptide in your vial as printed on the label. For IU compounds like hGH, this is usually in IU (e.g., 10 IU, 36 IU)."
                />
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="any"
                  value={vialSize}
                  onChange={(e) => setVialSize(e.target.value)}
                  className="flex-1"
                  placeholder="e.g., 5"
                />
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    onClick={() => setVialUnit('mg')}
                    className={cn(
                      "px-3 py-2 text-sm font-medium transition-colors",
                      vialUnit === 'mg' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    mg
                  </button>
                  <button
                    onClick={() => isIUCompound && setVialUnit('iu')}
                    disabled={!isIUCompound}
                    className={cn(
                      "px-3 py-2 text-sm font-medium transition-colors",
                      vialUnit === 'iu' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground",
                      !isIUCompound && "opacity-50 cursor-not-allowed"
                    )}
                    title={!isIUCompound ? `${compound?.name || 'This compound'} is dosed by mass, not biological activity.` : undefined}
                  >
                    IU
                  </button>
                </div>
              </div>
            </div>

            {/* BAC Water */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                BAC Water (mL)
                <InfoPopover 
                  title={educationalContent.bacWater.title}
                  content={educationalContent.bacWater.content}
                />
              </Label>
              <div className="space-y-3">
                <Slider
                  value={[bacWaterMl]}
                  onValueChange={([v]) => setBacWaterMl(v)}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0.5 mL</span>
                  <span className="text-sm font-medium text-foreground">{bacWaterMl} mL</span>
                  <span>10 mL</span>
                </div>
              </div>
            </div>

            {/* Desired Dose */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Desired Dose
                <InfoPopover 
                  title={educationalContent.mgVsIU.title}
                  content={educationalContent.mgVsIU.content}
                />
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="any"
                  value={doseValue}
                  onChange={(e) => {
                    setDoseValue(e.target.value);
                    setSelectedPresetId(undefined);
                  }}
                  className="flex-1"
                  placeholder="e.g., 250"
                />
                <div className="flex rounded-md border border-input overflow-hidden">
                  {!isMcgOnlyCompound && (
                    <button
                      onClick={() => setDoseUnit('mg')}
                      className={cn(
                        "px-2.5 py-2 text-sm font-medium transition-colors",
                        doseUnit === 'mg' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      mg
                    </button>
                  )}
                  <button
                    onClick={() => setDoseUnit('mcg')}
                    className={cn(
                      "px-2.5 py-2 text-sm font-medium transition-colors",
                      doseUnit === 'mcg' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    mcg
                  </button>
                  <button
                    onClick={() => isIUCompound && setDoseUnit('iu')}
                    disabled={!isIUCompound}
                    className={cn(
                      "px-2.5 py-2 text-sm font-medium transition-colors",
                      doseUnit === 'iu' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground",
                      !isIUCompound && "opacity-50 cursor-not-allowed"
                    )}
                    title={!isIUCompound ? `${compound?.name || 'This compound'} is dosed by mass, not biological activity.` : undefined}
                  >
                    IU
                  </button>
                </div>
              </div>
            </div>

            {/* Syringe Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Syringe Type
                <InfoPopover 
                  title={educationalContent.syringeUnits.title}
                  content={educationalContent.syringeUnits.content}
                />
              </Label>
              <Select value={syringeTypeId} onValueChange={setSyringeTypeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {syringeTypes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  Vial Cost (optional)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={vialCost}
                  onChange={(e) => setVialCost(e.target.value)}
                  placeholder="$"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cycle Days</Label>
                <Input
                  type="number"
                  value={cycleDays}
                  onChange={(e) => setCycleDays(e.target.value)}
                  placeholder="Days"
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Output */}
        {calculations && (
          <>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 pb-4">
                {/* Hero Number */}
                <div className="text-center mb-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Draw to
                  </div>
<div className="font-mono text-3xl font-bold text-primary">
                    {calculations.syringeUnits.toFixed(1)}
                  </div>
                  <div className="text-lg font-medium text-primary/80">
                    units
                  </div>
                </div>

                {/* Trifecta Row */}
                <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground">
                  <span>{calculations.volumeToDrawMl.toFixed(3)} mL</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{calculations.syringeUnits.toFixed(1)} units</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{doseLabel}</span>
                </div>
              </CardContent>
            </Card>

            {/* Syringe Visualization */}
            <Card>
              <CardContent className="pt-4 pb-2">
                <SyringeVisualization
                  syringeType={syringe}
                  drawUnits={calculations.syringeUnits}
                  doseLabel={doseLabel}
                />
              </CardContent>
            </Card>

            {/* Warnings */}
            <WarningsPanel warnings={warnings} />

            {/* Secondary Outputs */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-1">Concentration</div>
                  <div className="text-sm font-mono font-medium leading-snug">
                    {calculations.concentrationDisplay}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-1">Doses per Vial</div>
                  <div className="font-mono text-xl font-bold">
                    {calculations.totalDoses.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    doses of {doseLabel}
                  </div>
                </CardContent>
              </Card>
              {calculations.costPerDose !== null && (
                <>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-xs text-muted-foreground mb-1">Cost per Dose</div>
                      <div className="text-xl font-bold font-mono text-emerald-500">
                        ${calculations.costPerDose.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  {calculations.costPerCycle !== null && (
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="text-xs text-muted-foreground mb-1">Cost per Cycle</div>
                        <div className="text-xl font-bold font-mono text-emerald-500">
                          ${calculations.costPerCycle.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({cycleDays} days)
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </>
        )}

        {/* Saved Calculations */}
        <SavedCalculations
          calculations={data.reconstitutionCalculations}
          onDelete={handleDeleteSaved}
          onUseForLogging={handleUseForLogging}
          onCopy={handleCopyFromSaved}
        />

        {/* Educational Footer */}
        <div className="text-xs text-muted-foreground text-center px-4 space-y-2">
          <p>
            Always verify your calculations before use. This calculator is for research purposes only.
          </p>
          {isIUCompound && (
            <p className="text-primary/70">
              Remember: Syringe unit markings are volume-based, not IU dose units.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
