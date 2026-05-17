"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Syringe, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDose, getDoseUnitLabel } from '@/lib/dose-helpers';

export interface SavedCalculation {
  id: string;
  compoundName: string;
  compoundId: string;
  vialSize: number;
  vialUnit: 'mg' | 'iu';
  bacWaterMl: number;
  doseValue: number;
  doseUnit: 'mcg' | 'mg' | 'iu';
  drawUnits: number;
  drawMl: number;
  concentration: string;
  dosesPerVial: number;
  savedAt: string;
}

interface SavedCalculationsProps {
  calculations: SavedCalculation[];
  onDelete: (id: string) => void;
  onUseForLogging: (calc: SavedCalculation) => void;
  onCopy: (calc: SavedCalculation) => void;
}

export function SavedCalculations({ 
  calculations, 
  onDelete, 
  onUseForLogging,
  onCopy 
}: SavedCalculationsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (calculations.length === 0) return null;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">
          Saved Calculations ({calculations.length})
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="divide-y divide-border">
          {calculations.map((calc) => (
            <div key={calc.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{calc.compoundName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(calc.savedAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(calc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Vial:</div>
                <div className="font-mono">
                  {calc.vialSize} {getDoseUnitLabel(calc.vialUnit)} + {calc.bacWaterMl}mL BAC
                </div>
                <div className="text-muted-foreground">Dose:</div>
                <div className="font-mono">
                  {formatDose(calc.doseValue, calc.doseUnit)}
                </div>
                <div className="text-muted-foreground">Draw:</div>
                <div className="font-mono font-medium text-primary">
                  {calc.drawUnits.toFixed(1)} units ({calc.drawMl.toFixed(3)}mL)
                </div>
                <div className="text-muted-foreground">Doses/vial:</div>
                <div className="font-mono">{calc.dosesPerVial.toFixed(0)}</div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onCopy(calc)}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  Copy
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onUseForLogging(calc)}
                >
                  <Syringe className="h-3 w-3 mr-1.5" />
                  Log Dose
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function generateShareText(calc: SavedCalculation): string {
  const lines = [
    `${calc.compoundName} Reconstitution`,
    `Vial: ${calc.vialSize} ${getDoseUnitLabel(calc.vialUnit)} + ${calc.bacWaterMl} mL BAC water`,
    `Concentration: ${calc.concentration}`,
    `Dose: ${formatDose(calc.doseValue, calc.doseUnit)} = ${calc.drawUnits.toFixed(1)} units on U-100 syringe = ${calc.drawMl.toFixed(3)} mL`,
    `Doses per vial: ${calc.dosesPerVial.toFixed(0)}`,
  ];
  return lines.join('\n');
}
