"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
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

import {
  peptideConversions,
  syringeTypes,
  quickPresets,
  educationalContent,
  getConversionById,
  canUseIU,
  convertMgToIU,
  convertIUToMg,
  convertMcgToMg,
  convertMgToMcg,
  type PeptideConversion,
  type SyringeType,
  type QuickPreset,
} from '@/lib/peptide-conversions';

import { SyringeVisualization } from '@/components/reconstitution/syringe-visualization';
import { InfoPopover } from '@/components/reconstitution/info-popover';
import { WarningsPanel, type Warning } from '@/components/reconstitution/warnings-panel';
import { QuickPresets } from '@/components/reconstitution/quick-presets';
import { 
  SavedCalculations, 
  generateShareText, 
  type SavedCalculation 
} from '@/components/reconstitution/saved-calculations';

type VialUnit = 'mg' | 'iu';
type DoseUnit = 'mcg' | 'mg' | 'iu';

export default function ReconstitutionPage() {
  // State
  const [selectedCompoundId, setSelectedCompoundId] = useState<string>('bpc-157');
  const [vialSize, setVialSize] = useState<string>('5');
  const [vialUnit, setVialUnit] = useState<VialUnit>('mg');
  const [bacWaterMl, setBacWaterMl] = useState<number>(2);
  const [doseValue, setDoseValue] = useState<string>('250');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mcg');
  const [syringeTypeId, setSyringeTypeId] = useState<string>('u100-1ml');
  const [vialCost, setVialCost] = useState<string>('');
  const [cycleDays, setCycleDays] = useState<string>('');
  const [savedCalcs, setSavedCalcs] = useState<SavedCalculation[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  // Get current compound and syringe
  const compound = useMemo(() => getConversionById(selectedCompoundId), [selectedCompoundId]);
  const syringe = useMemo(() => 
    syringeTypes.find(s => s.id === syringeTypeId) || syringeTypes[0], 
    [syringeTypeId]
  );
  
  const isIUCompound = compound?.dosingMode === 'iu-primary';
  const isMcgOnlyCompound = compound?.dosingMode === 'mcg-only';

  // Reset units when compound changes
  useEffect(() => {
    if (compound) {
      if (compound.dosingMode === 'iu-primary') {
        setVialUnit('iu');
        setDoseUnit('iu');
        // Set default vial size for IU compounds
        const defaultVial = compound.typicalVialSizes[0];
        if (defaultVial) {
          setVialSize(defaultVial.value.toString());
        }
        // Set default dose
        setDoseValue(compound.typicalDoseRange.min.toString());
      } else if (compound.dosingMode === 'mcg-only') {
        setVialUnit('mg');
        setDoseUnit('mcg');
        const defaultVial = compound.typicalVialSizes[0];
        if (defaultVial) {
          setVialSize(defaultVial.value.toString());
        }
        setDoseValue(compound.typicalDoseRange.min.toString());
      } else {
        setVialUnit('mg');
        setDoseUnit(compound.defaultUnit === 'mg' ? 'mg' : 'mcg');
        const defaultVial = compound.typicalVialSizes[0];
        if (defaultVial) {
          setVialSize(defaultVial.value.toString());
        }
        setDoseValue(compound.typicalDoseRange.min.toString());
      }
    }
  }, [selectedCompoundId]);

  // Calculations
  const calculations = useMemo(() => {
    const vialNum = parseFloat(vialSize) || 0;
    const doseNum = parseFloat(doseValue) || 0;
    const bacMl = bacWaterMl || 0;
    
    if (vialNum === 0 || doseNum === 0 || bacMl === 0 || !compound) {
      return null;
    }
    
    // Convert everything to mg for internal calculation
    let vialMg: number;
    if (vialUnit === 'iu' && compound.iuPerMg) {
      vialMg = vialNum / compound.iuPerMg;
    } else {
      vialMg = vialNum;
    }
    
    let doseMg: number;
    if (doseUnit === 'iu' && compound.iuPerMg) {
      doseMg = doseNum / compound.iuPerMg;
    } else if (doseUnit === 'mcg') {
      doseMg = doseNum / 1000;
    } else {
      doseMg = doseNum;
    }
    
    // Core calculations
    const concentrationMgPerMl = vialMg / bacMl;
    const volumeToDrawMl = doseMg / concentrationMgPerMl;
    const syringeUnits = volumeToDrawMl * syringe.unitsPerMl;
    const totalDoses = vialMg / doseMg;
    
    // Dual unit displays
    let concentrationDisplay: string;
    let doseDisplay: string;
    let vialDisplay: string;
    
    if (isIUCompound && compound.iuPerMg) {
      const concentrationIuPerMl = concentrationMgPerMl * compound.iuPerMg;
      concentrationDisplay = `${concentrationIuPerMl.toFixed(1)} IU/mL (${concentrationMgPerMl.toFixed(2)} mg/mL)`;
      
      if (doseUnit === 'iu') {
        const doseMcg = doseMg * 1000;
        doseDisplay = `${doseNum} IU (${doseMcg.toFixed(0)} mcg)`;
      } else {
        const doseIu = doseMg * compound.iuPerMg;
        doseDisplay = `${formatDose(doseNum, doseUnit)} (${doseIu.toFixed(1)} IU)`;
      }
      
      if (vialUnit === 'iu') {
        vialDisplay = `${vialNum} IU (${vialMg.toFixed(2)} mg)`;
      } else {
        const vialIu = vialMg * compound.iuPerMg;
        vialDisplay = `${vialNum} mg (${vialIu.toFixed(0)} IU)`;
      }
    } else {
      const concentrationMcgPerMl = concentrationMgPerMl * 1000;
      concentrationDisplay = `${concentrationMgPerMl.toFixed(2)} mg/mL (${concentrationMcgPerMl.toFixed(0)} mcg/mL)`;
      
      if (doseUnit === 'mcg') {
        doseDisplay = `${doseNum} mcg (${doseMg.toFixed(3)} mg)`;
      } else {
        const doseMcg = doseMg * 1000;
        doseDisplay = `${doseNum} mg (${doseMcg.toFixed(0)} mcg)`;
      }
      
      vialDisplay = `${vialMg} mg (${vialMg * 1000} mcg)`;
    }
    
    // Cost calculations
    let costPerDose: number | null = null;
    let costPerCycle: number | null = null;
    const cost = parseFloat(vialCost);
    const days = parseInt(cycleDays);
    
    if (cost > 0) {
      costPerDose = cost / totalDoses;
      if (days > 0) {
        // Assuming one dose per day for simplicity
        costPerCycle = costPerDose * days;
      }
    }
    
    return {
      volumeToDrawMl,
      syringeUnits,
      concentrationMgPerMl,
      concentrationDisplay,
      doseDisplay,
      vialDisplay,
      totalDoses,
      costPerDose,
      costPerCycle,
      vialMg,
      doseMg,
    };
  }, [vialSize, vialUnit, bacWaterMl, doseValue, doseUnit, syringe, compound, vialCost, cycleDays, isIUCompound]);

  // Generate warnings
  const warnings = useMemo<Warning[]>(() => {
    const result: Warning[] = [];
    if (!calculations || !compound) return result;
    
    const { syringeUnits, volumeToDrawMl, doseMg } = calculations;
    
    // Exceeds syringe capacity
    if (syringeUnits > syringe.totalUnits) {
      result.push({
        id: 'exceeds-capacity',
        type: 'error',
        message: 'Dose exceeds syringe capacity',
        suggestion: `The draw volume (${syringeUnits.toFixed(1)} units) exceeds your ${syringe.totalUnits}-unit syringe. Use a larger syringe or increase BAC water to dilute.`,
      });
    }
    
    // Too dilute
    if (volumeToDrawMl > 0.5 && syringeUnits <= syringe.totalUnits) {
      result.push({
        id: 'too-dilute',
        type: 'warning',
        message: 'Concentration may be too dilute',
        suggestion: `Drawing ${volumeToDrawMl.toFixed(2)}mL per dose. Consider using less BAC water for more concentrated solution.`,
      });
    }
    
    // Too concentrated
    if (volumeToDrawMl < 0.05 && volumeToDrawMl > 0) {
      result.push({
        id: 'too-concentrated',
        type: 'warning',
        message: 'Concentration may be too concentrated',
        suggestion: `Drawing only ${(volumeToDrawMl * 1000).toFixed(1)}µL. Consider adding more BAC water for accurate dosing.`,
      });
    }
    
    // Check typical dose range
    const doseNum = parseFloat(doseValue) || 0;
    const { min, max, unit } = compound.typicalDoseRange;
    
    let doseInRangeUnit: number;
    if (unit === 'iu' && compound.iuPerMg) {
      doseInRangeUnit = doseUnit === 'iu' ? doseNum : (doseUnit === 'mg' ? doseNum * compound.iuPerMg : (doseNum / 1000) * compound.iuPerMg);
    } else if (unit === 'mg') {
      doseInRangeUnit = doseUnit === 'mg' ? doseNum : (doseUnit === 'mcg' ? doseNum / 1000 : doseNum / (compound.iuPerMg || 1));
    } else {
      doseInRangeUnit = doseUnit === 'mcg' ? doseNum : (doseUnit === 'mg' ? doseNum * 1000 : (doseNum / (compound.iuPerMg || 1)) * 1000);
    }
    
    if (doseInRangeUnit < min * 0.5 || doseInRangeUnit > max * 2) {
      result.push({
        id: 'unusual-dose',
        type: 'warning',
        message: `Unusual dose for ${compound.name}`,
        suggestion: `Typical research range: ${min}-${max} ${unit}. Verify your intended dose.`,
      });
    }
    
    // Verify vial label prompt for IU compounds
    if (isIUCompound && compound.typicalVialSizes.length > 0) {
      const sizes = compound.typicalVialSizes.map(s => `${s.value} ${s.unit}`).join(', ');
      result.push({
        id: 'verify-vial',
        type: 'info',
        message: 'Verify your vial label',
        suggestion: `Common vial sizes for ${compound.name}: ${sizes}`,
      });
    }
    
    return result;
  }, [calculations, compound, syringe, doseValue, doseUnit, isIUCompound]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: QuickPreset) => {
    setSelectedCompoundId(preset.compoundId);
    setDoseValue(preset.doseValue.toString());
    setDoseUnit(preset.doseUnit);
    setSelectedPresetId(preset.id);
    
    // Get compound for defaults
    const presetCompound = getConversionById(preset.compoundId);
    if (presetCompound) {
      if (preset.doseUnit === 'iu') {
        setVialUnit('iu');
      } else {
        setVialUnit('mg');
      }
    }
  }, []);

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
    
    setSavedCalcs(prev => [newCalc, ...prev]);
    toast.success('Calculation saved');
  }, [calculations, compound, vialSize, vialUnit, bacWaterMl, doseValue, doseUnit]);

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
    setSavedCalcs(prev => prev.filter(c => c.id !== id));
    toast.success('Calculation deleted');
  }, []);

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
                setSelectedCompoundId(v);
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
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">IU</Badge>
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
                  <div className="text-5xl font-bold text-primary font-mono">
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
                  <div className="text-2xl font-bold font-mono">
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
          calculations={savedCalcs}
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
