"use client";

import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WarningType = 'error' | 'warning' | 'info' | 'success';

export interface Warning {
  id: string;
  type: WarningType;
  message: string;
  suggestion?: string;
}

interface WarningsPanelProps {
  warnings: Warning[];
}

export function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings.length === 0) return null;
  
  const getIcon = (type: WarningType) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
  };
  
  const getBgColor = (type: WarningType) => {
    switch (type) {
      case 'error':
        return 'bg-destructive/10 border-destructive/30';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30';
    }
  };
  
  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            getBgColor(warning.type)
          )}
        >
          <div className="mt-0.5">{getIcon(warning.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{warning.message}</p>
            {warning.suggestion && (
              <p className="text-xs text-muted-foreground mt-1">{warning.suggestion}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
