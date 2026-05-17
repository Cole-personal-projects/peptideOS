"use client";

import { cn } from '@/lib/utils';
import type { QuickPreset } from '@/lib/peptide-conversions';

interface QuickPresetsProps {
  presets: QuickPreset[];
  onSelect: (preset: QuickPreset) => void;
  selectedId?: string;
}

export function QuickPresets({ presets, onSelect, selectedId }: QuickPresetsProps) {
  const massPresets = presets.filter(p => p.category === 'mass');
  const iuPresets = presets.filter(p => p.category === 'iu');
  
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Quick Presets
      </div>
      
      {/* Mass-based row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {massPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium",
              "border transition-all duration-200",
              selectedId === preset.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* IU-based row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {iuPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium",
              "border transition-all duration-200",
              selectedId === preset.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
