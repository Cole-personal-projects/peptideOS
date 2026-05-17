"use client";

import type { PointerEvent } from 'react';
import { useRef } from 'react';
import type { SitePickerTone } from '@/lib/site-picker';
import { cn } from '@/lib/utils';

interface ZoneProps {
  id: string;
  label: string;
  tone: SitePickerTone;
  selected: boolean;
  suggested: boolean;
  compatible: boolean;
  pathData: string;
  hitTargetPathData: string;
  onSelect: () => void;
  onLongPress: () => void;
}

const toneClasses: Record<SitePickerTone, string> = {
  fresh: 'fill-emerald-500/35 stroke-emerald-300/70 hover:fill-emerald-400/45',
  moderate: 'fill-yellow-400/35 stroke-yellow-200/70 hover:fill-yellow-300/45',
  recent: 'fill-orange-500/35 stroke-orange-300/70 hover:fill-orange-400/45',
  avoid: 'fill-red-500/35 stroke-red-300/70 hover:fill-red-400/45',
  incompatible: 'fill-slate-700/20 stroke-slate-600/35 opacity-35',
  'heat-0': 'fill-slate-700/25 stroke-slate-500/40 hover:fill-slate-600/35',
  'heat-low': 'fill-violet-500/25 stroke-violet-300/50 hover:fill-violet-400/35',
  'heat-medium': 'fill-violet-500/45 stroke-violet-300/65 hover:fill-violet-400/55',
  'heat-high': 'fill-violet-500/65 stroke-violet-200/80 hover:fill-violet-400/75',
  'heat-max': 'fill-violet-400/85 stroke-violet-100 hover:fill-violet-300/90',
};

export function Zone({
  id,
  label,
  tone,
  selected,
  suggested,
  compatible,
  pathData,
  hitTargetPathData,
  onSelect,
  onLongPress,
}: ZoneProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    longPressTimer.current = setTimeout(onLongPress, 550);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerUp = (event: PointerEvent<SVGGElement>) => {
    clearLongPress();
    if (!compatible) return;
    if (event.pointerType !== 'mouse' || event.button === 0) {
      onSelect();
    }
  };

  return (
    <g
      role="button"
      tabIndex={compatible ? 0 : -1}
      aria-label={label}
      aria-disabled={!compatible}
      data-zone-id={id}
      onPointerDown={startLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onPointerUp={handlePointerUp}
      onKeyDown={(event) => {
        if (!compatible) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'cursor-pointer outline-none transition-opacity focus-visible:[&>*]:stroke-cyan-200',
        !compatible && 'cursor-not-allowed',
        selected && '[&>*]:stroke-cyan-200 [&>*]:stroke-[3]',
        suggested && !selected && 'animate-pulse',
      )}
    >
      <path d={hitTargetPathData} className="fill-transparent stroke-transparent [pointer-events:all]" />
      <path id={id} d={pathData} className={cn('pointer-events-none stroke-2 transition-colors', toneClasses[tone])} />
    </g>
  );
}
