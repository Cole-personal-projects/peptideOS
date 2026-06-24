"use client";

import { cn } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

const toneClasses: Record<Tone, string> = {
  primary: 'text-primary bg-primary/15 border-primary/35',
  success: 'text-chart-3 bg-chart-3/15 border-chart-3/35',
  warning: 'text-chart-4 bg-chart-4/15 border-chart-4/35',
  danger: 'text-destructive bg-destructive/15 border-destructive/35',
  muted: 'text-muted-foreground bg-secondary border-border',
};

const strokeByTone: Record<Tone, string> = {
  primary: 'var(--primary)',
  success: 'var(--chart-3)',
  warning: 'var(--chart-4)',
  danger: 'var(--destructive)',
  muted: 'var(--muted-foreground)',
};

export function MiniProgressRing({
  value,
  label,
  tone = 'primary',
  size = 52,
}: {
  value: number | null;
  label?: string;
  tone?: Tone;
  size?: number;
}) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const normalized = value === null ? 0 : Math.min(Math.max(value, 0), 100);
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="4.5" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke={strokeByTone[tone]}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth="4.5"
        />
      </svg>
      <span className="absolute text-[10px] font-bold leading-none text-foreground">{value === null ? '--' : Math.round(normalized)}</span>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export function StatusDot({ tone = 'primary', className }: { tone?: Tone; className?: string }) {
  return <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full border', toneClasses[tone], className)} />;
}

export function MetricTile({ label, value, tone = 'primary' }: { label: string; value: string | number; tone?: Tone }) {
  return (
    <div className={cn('rounded-[14px] border p-3', toneClasses[tone])}>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] opacity-80">{label}</p>
    </div>
  );
}

export function AdherenceStrip({
  states,
  max = 14,
}: {
  states: Array<'done' | 'due' | 'missed' | 'skipped' | 'empty'>;
  max?: number;
}) {
  const padded = [...states.slice(-max)];
  while (padded.length < max) padded.unshift('empty');

  return (
    <div className="flex h-7 items-end gap-1" aria-label="Recent protocol activity">
      {padded.map((state, index) => (
        <span
          key={`${state}-${index}`}
          className={cn(
            'flex-1 rounded-sm border transition-colors',
            state === 'done' && 'border-chart-3/20 bg-chart-3',
            state === 'due' && 'border-primary/40 bg-primary shadow-[0_0_10px_rgb(240_116_52_/_0.35)]',
            state === 'missed' && 'border-destructive/30 bg-destructive/80',
            state === 'skipped' && 'border-chart-4/30 bg-chart-4/80',
            state === 'empty' && 'border-border bg-secondary',
          )}
          style={{ height: `${state === 'empty' ? 10 : index % 3 === 0 ? 28 : index % 2 === 0 ? 22 : 16}px` }}
        />
      ))}
    </div>
  );
}

export function RangeBar({
  percent,
  label = 'Reference range',
  tone = 'primary',
}: {
  percent: number;
  label?: string;
  tone?: Tone;
}) {
  const normalized = Math.min(Math.max(percent, 0), 100);
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full',
            tone === 'danger' ? 'bg-destructive' : tone === 'warning' ? 'bg-chart-4' : 'ember-gradient',
          )}
          style={{ width: `${normalized}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}
