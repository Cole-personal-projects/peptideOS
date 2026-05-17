"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SyringeType } from '@/lib/peptide-conversions';

interface SyringeVisualizationProps {
  syringeType: SyringeType;
  drawUnits: number;
  doseLabel: string; // e.g., "2 IU" or "250 mcg"
}

export function SyringeVisualization({ 
  syringeType, 
  drawUnits,
  doseLabel 
}: SyringeVisualizationProps) {
  const { totalUnits, tickIntervalUnits } = syringeType;
  
  // Calculate fill percentage
  const fillPercent = Math.min(100, Math.max(0, (drawUnits / totalUnits) * 100));
  
  // Generate tick marks
  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i <= totalUnits; i += tickIntervalUnits) {
      const isMajor = i % (tickIntervalUnits * 5) === 0 || i === 0 || i === totalUnits;
      result.push({ value: i, isMajor, percent: (i / totalUnits) * 100 });
    }
    return result;
  }, [totalUnits, tickIntervalUnits]);
  
  // Clamp draw units to valid range
  const clampedDrawUnits = Math.min(totalUnits, Math.max(0, drawUnits));
  const drawPercent = (clampedDrawUnits / totalUnits) * 100;
  
  return (
    <div className="w-full py-4">
      {/* Syringe container */}
      <div className="relative mx-auto" style={{ maxWidth: '340px' }}>
        {/* Main syringe body */}
        <svg 
          viewBox="0 0 340 80" 
          className="w-full h-auto"
          role="img"
          aria-label={`Syringe showing ${clampedDrawUnits.toFixed(1)} units to draw`}
        >
          {/* Plunger */}
          <rect x="0" y="28" width="30" height="24" rx="2" fill="currentColor" className="text-muted-foreground/40" />
          <rect x="25" y="32" width="15" height="16" rx="1" fill="currentColor" className="text-muted-foreground/60" />
          
          {/* Barrel outline */}
          <rect 
            x="40" 
            y="25" 
            width="260" 
            height="30" 
            rx="3" 
            fill="currentColor" 
            className="text-muted/20"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          />
          
          {/* Liquid fill - animated */}
          <motion.rect
            x="42"
            y="27"
            height="26"
            rx="2"
            fill="currentColor"
            className="text-primary/70"
            initial={{ width: 0 }}
            animate={{ width: Math.max(0, (256 * fillPercent) / 100) }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
          
          {/* Tick marks */}
          {ticks.map((tick) => {
            const x = 42 + (256 * tick.percent) / 100;
            return (
              <g key={tick.value}>
                <line
                  x1={x}
                  y1={tick.isMajor ? 25 : 28}
                  x2={x}
                  y2={tick.isMajor ? 35 : 32}
                  stroke="currentColor"
                  strokeWidth={tick.isMajor ? 1.5 : 0.75}
                  className="text-foreground/60"
                />
                {tick.isMajor && (
                  <text
                    x={x}
                    y={22}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-muted-foreground text-[8px]"
                    style={{ fontSize: '8px' }}
                  >
                    {tick.value}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Draw line indicator */}
          {drawUnits > 0 && drawUnits <= totalUnits && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <line
                x1={42 + (256 * drawPercent) / 100}
                y1={20}
                x2={42 + (256 * drawPercent) / 100}
                y2={60}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
              />
              <circle
                cx={42 + (256 * drawPercent) / 100}
                cy={60}
                r="3"
                fill="currentColor"
                className="text-primary"
              />
            </motion.g>
          )}
          
          {/* Needle hub */}
          <polygon 
            points="300,32 300,48 320,44 320,36" 
            fill="currentColor" 
            className="text-muted-foreground/50"
          />
          
          {/* Needle */}
          <rect x="320" y="38" width="20" height="4" rx="0.5" fill="currentColor" className="text-muted-foreground/70" />
          <polygon points="340,38 340,42 345,40" fill="currentColor" className="text-muted-foreground/70" />
        </svg>
        
        {/* Labels below syringe */}
        {drawUnits > 0 && drawUnits <= totalUnits && (
          <motion.div
            className="absolute text-center"
            style={{ 
              left: `${11.8 + (75.3 * drawPercent) / 100}%`,
              top: '100%',
              transform: 'translateX(-50%)'
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-sm font-bold text-primary">
              {clampedDrawUnits.toFixed(1)} units
            </div>
            <div className="text-xs text-muted-foreground">
              = {doseLabel}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Warning if over capacity */}
      {drawUnits > totalUnits && (
        <motion.div 
          className="mt-6 text-center text-sm text-destructive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Draw volume exceeds syringe capacity ({totalUnits} units max)
        </motion.div>
      )}
    </div>
  );
}
