"use client";

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, CalendarDays, Search, Syringe, Waves } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/lib/context';
import { formatDose, getDosePresetsForPeptide } from '@/lib/dose-helpers';
import { buildHalfLifeSimulation, halfLifeFrequencyOptions, type HalfLifeFrequencyId } from '@/lib/half-life-simulator';
import { normalizeScheduleRecurrence } from '@/lib/schedules';
import { cn } from '@/lib/utils';
import type { Compound, DoseUnit, ScheduleRecurrence, Stack, StackPeptide } from '@/lib/types';

const windowOptions = [14, 30, 90, 120];
const doseCountOptions = [1, 2, 4, 8, 12];
const maxDoseCount = 365;

type ProtocolPreset = {
  id: string;
  stackName: string;
  compound: Compound;
  peptide: StackPeptide;
  frequencyId: HalfLifeFrequencyId;
  doseCount: number;
  windowDays: number;
  scheduleLabel: string;
};

export default function HalfLifeVisualizerPage() {
  const { data } = useApp();
  const pkCompounds = useMemo(
    () =>
      data.compounds
        .filter((compound) => compound.pharmacokinetics?.halfLifeHours)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.compounds],
  );
  const [selectedCompoundId, setSelectedCompoundId] = useState(pkCompounds[0]?.id ?? '');
  const selectedCompound = pkCompounds.find((compound) => compound.id === selectedCompoundId) ?? pkCompounds[0];
  const [compoundSearch, setCompoundSearch] = useState('');
  const [doseValue, setDoseValue] = useState('1');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mg');
  const [frequencyId, setFrequencyId] = useState<HalfLifeFrequencyId>('weekly');
  const [windowDays, setWindowDays] = useState(30);
  const [doseCount, setDoseCount] = useState(4);
  const [activeProtocolPresetId, setActiveProtocolPresetId] = useState<string | null>(null);

  const availableUnits = selectedCompound ? getHalfLifeDoseUnits(selectedCompound) : (['mcg', 'mg'] satisfies DoseUnit[]);
  const filteredCompounds = pkCompounds.filter((compound) => compound.name.toLowerCase().includes(compoundSearch.trim().toLowerCase()));
  const protocolPresets = useMemo(() => buildProtocolPresets(data.stacks, data.compounds), [data.stacks, data.compounds]);
  const selectedProtocolPreset = protocolPresets.find((preset) => preset.id === activeProtocolPresetId) ?? null;
  const simulation = selectedCompound
    ? buildHalfLifeSimulation({
        compound: selectedCompound,
        doseValue: Number(doseValue),
        doseUnit,
        frequencyId,
        doseCount,
        windowDays,
      })
    : null;
  const nextDoseLabel = getNextDoseLabel(simulation);

  const applyCompound = (compound: Compound) => {
    setSelectedCompoundId(compound.id);
    setActiveProtocolPresetId(null);
    const units = getHalfLifeDoseUnits(compound);
    setDoseUnit(units.includes(compound.defaultDoseUnit) ? compound.defaultDoseUnit : units[0]);
    const preset = getDosePresetsForPeptide(compound.id)[0];
    if (preset) {
      setDoseValue(String(preset.doseValue));
      setDoseUnit(preset.doseUnit);
    }
  };

  const applyProtocolPreset = (preset: ProtocolPreset) => {
    setActiveProtocolPresetId(preset.id);
    setSelectedCompoundId(preset.compound.id);
    setDoseValue(String(preset.peptide.doseValue));
    setDoseUnit(preset.peptide.doseUnit);
    setFrequencyId(preset.frequencyId);
    setDoseCount(preset.doseCount);
    setWindowDays(preset.windowDays);
  };

  return (
    <AppShell>
      <PageHeader title="Half-Life" backHref="/more" />
      <div className="space-y-4 p-4 pb-32">
        <section className="overflow-hidden rounded-[24px] border border-primary/25 bg-card">
          <div className="relative min-h-[188px] p-4">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_25%_10%,hsl(var(--primary)/0.28),transparent_42%),linear-gradient(135deg,hsl(var(--primary)/0.14),transparent_68%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  <Waves className="size-3.5" />
                  Simulator
                </div>
                <h2 className="mt-4 max-w-[13rem] text-2xl font-black leading-[0.95] tracking-normal">
                  Estimated remaining timeline.
                </h2>
              </div>
              <div className="grid size-16 shrink-0 place-items-center rounded-[20px] border border-primary/25 bg-background/70 text-primary shadow-sm">
                <Activity className="size-7" />
              </div>
            </div>
            <div className="relative mt-5 grid grid-cols-3 gap-2">
              <HeroMetric label="Now" value={formatEstimatedMg(simulation?.currentEstimatedMg ?? 0)} />
              <HeroMetric label="Peak" value={formatEstimatedMg(simulation?.peakEstimatedMg ?? 0)} />
              <HeroMetric label="Next dose" value={nextDoseLabel} />
            </div>
          </div>
        </section>

        {protocolPresets.length > 0 ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Use active protocol</p>
                  <p className="text-xs text-muted-foreground">Load saved protocol dose, unit, cadence, window.</p>
                </div>
                <Syringe className="size-4 text-primary" />
              </div>
              <Select value={activeProtocolPresetId ?? ''} onValueChange={(value) => {
                const preset = protocolPresets.find((candidate) => candidate.id === value);
                if (preset) applyProtocolPreset(preset);
              }}>
                <SelectTrigger aria-label="Use active protocol">
                  <SelectValue placeholder="Choose protocol dose" />
                </SelectTrigger>
                <SelectContent>
                  {protocolPresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.stackName} · {preset.compound.name} · {formatDose(preset.peptide.doseValue, preset.peptide.doseUnit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProtocolPreset ? (
                <div className="rounded-[14px] border bg-secondary/35 px-3 py-2 text-xs text-muted-foreground">
                  {selectedProtocolPreset.scheduleLabel}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <HalfLifeGraph compound={selectedCompound} simulation={simulation} windowDays={windowDays} />

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="compound-search">Search compounds</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="compound-search"
                  aria-label="Search compounds"
                  value={compoundSearch}
                  onChange={(event) => setCompoundSearch(event.target.value)}
                  placeholder="Search source-backed compounds"
                  className="pl-9"
                />
              </div>
              <Select value={selectedCompound?.id ?? ''} onValueChange={(value) => {
                const compound = pkCompounds.find((candidate) => candidate.id === value);
                if (compound) applyCompound(compound);
              }}>
                <SelectTrigger aria-label="Compound picker">
                  <SelectValue placeholder="Select compound" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCompounds.map((compound) => (
                    <SelectItem key={compound.id} value={compound.id}>
                      {compound.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[1fr_104px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="dose-value">Dose amount</Label>
                <Input
                  id="dose-value"
                  aria-label="Dose amount"
                  value={doseValue}
                  onChange={(event) => {
                    setActiveProtocolPresetId(null);
                    setDoseValue(event.target.value);
                  }}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label>Dose unit</Label>
                <Select value={doseUnit} onValueChange={(value) => {
                  setActiveProtocolPresetId(null);
                  setDoseUnit(value as DoseUnit);
                }}>
                  <SelectTrigger aria-label="Dose unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dose-count">Doses to model</Label>
              <Input
                id="dose-count"
                aria-label="Doses to model"
                value={String(doseCount)}
                onChange={(event) => {
                  setActiveProtocolPresetId(null);
                  setDoseCount(clampDoseCount(event.target.value));
                }}
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">Enter 1-{maxDoseCount} planned dose events.</p>
            </div>

            <ChipGroup label="Dose count">
              {doseCountOptions.map((count) => (
                <Chip key={count} active={doseCount === count} onClick={() => {
                  setActiveProtocolPresetId(null);
                  setDoseCount(count);
                }}>
                  {count}
                </Chip>
              ))}
            </ChipGroup>

            <ChipGroup label="Frequency" icon={<CalendarDays className="size-3.5" />}>
              {halfLifeFrequencyOptions.map((option) => (
                <Chip key={option.id} active={frequencyId === option.id} onClick={() => {
                  setActiveProtocolPresetId(null);
                  setFrequencyId(option.id);
                }}>
                  {option.label}
                </Chip>
              ))}
            </ChipGroup>

            <ChipGroup label="Window">
              {windowOptions.map((days) => (
                <Chip key={days} active={windowDays === days} onClick={() => {
                  setActiveProtocolPresetId(null);
                  setWindowDays(days);
                }}>
                  {days}d
                </Chip>
              ))}
            </ChipGroup>
          </CardContent>
        </Card>

        <div className="rounded-[20px] border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Assumption</p>
            {selectedCompound?.pharmacokinetics?.evidenceTier ? (
              <Badge variant="outline">{selectedCompound.pharmacokinetics.evidenceTier}</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {selectedCompound?.pharmacokinetics?.halfLifeSource ?? simulation?.unsupportedReason}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selectedCompound?.pharmacokinetics?.modelNotes}</p>
        </div>
      </div>
    </AppShell>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-border bg-background/80 px-3 py-2">
      <p className="truncate text-sm font-black text-primary">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}

function HalfLifeGraph({
  compound,
  simulation,
  windowDays,
}: {
  compound?: Compound;
  simulation: ReturnType<typeof buildHalfLifeSimulation> | null;
  windowDays: number;
}) {
  const points = simulation?.points ?? [];
  const events = simulation?.events ?? [];
  const max = Math.max(...points.map((point) => point.estimatedRemainingMg), simulation?.peakEstimatedMg ?? 0, 0.001);
  const fallbackStart = 0;
  const start = points[0] ? new Date(points[0].sampledAt).getTime() : fallbackStart;
  const end = points.at(-1) ? new Date(points.at(-1)?.sampledAt ?? '').getTime() : fallbackStart + windowDays * 24 * 60 * 60 * 1000;
  const path = buildGraphPath(points, max, start, end);
  const area = path ? closeGraphArea(path) : '';
  const gradientId = `half-life-fill-${compound?.id?.replace(/[^a-z0-9_-]/gi, '-') ?? 'empty'}`;
  const currentPoint = points[0] ? pointToChart(points[0], max, start, end) : null;
  const peakPoint = getPeakPoint(points, max, start, end);

  return (
    <section className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold">{compound?.name ?? 'Select compound'}</h2>
          <p className="text-xs text-muted-foreground">Estimated remaining amount · {windowDays} days</p>
        </div>
        <Badge variant="secondary">{events.length} doses</Badge>
      </div>
      <div className="space-y-2 px-3 py-3">
        <svg viewBox="0 0 320 188" className="h-60 w-full" role="img" aria-label={`${compound?.name ?? 'Compound'} estimated remaining amount curve`}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.48" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <path d="M20 146 H300" stroke="var(--border)" strokeWidth="1" />
          <path d="M20 104 H300" stroke="var(--border)" strokeOpacity="0.55" strokeWidth="1" />
          <path d="M20 62 H300" stroke="var(--border)" strokeOpacity="0.55" strokeWidth="1" />
          <text x="20" y="166" fill="var(--muted-foreground)" fontSize="10" fontWeight="700">Today</text>
          <text x="270" y="166" fill="var(--muted-foreground)" fontSize="10" fontWeight="700">{windowDays}d</text>
          <text x="21" y="58" fill="var(--muted-foreground)" fontSize="10" fontWeight="700">{formatEstimatedMg(max)}</text>
          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {path ? <path d={path} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {events.slice(0, 24).map((event, index) => {
            const x = getXForTime(new Date(event.occurredAt).getTime(), start, end);
            return (
              <g key={event.id}>
                <line x1={x} y1="28" x2={x} y2="146" stroke="var(--chart-3)" strokeOpacity="0.22" strokeWidth="1" />
                <circle cx={x} cy="146" r="3.5" fill="var(--chart-3)" />
                {index === 0 ? <text x={x + 5} y="139" fill="var(--chart-3)" fontSize="10" fontWeight="700">dose</text> : null}
              </g>
            );
          })}
          {currentPoint ? (
            <g>
              <circle cx={currentPoint.x} cy={currentPoint.y} r="5" fill="var(--background)" stroke="var(--primary)" strokeWidth="3" />
              <text x={Math.min(250, currentPoint.x + 8)} y={Math.max(24, currentPoint.y - 8)} fill="var(--primary)" fontSize="10" fontWeight="800">
                now
              </text>
            </g>
          ) : null}
          {peakPoint ? (
            <g>
              <circle cx={peakPoint.x} cy={peakPoint.y} r="4" fill="var(--primary)" />
              <text x={Math.max(22, peakPoint.x - 18)} y={Math.max(18, peakPoint.y - 10)} fill="var(--primary)" fontSize="10" fontWeight="800">
                peak
              </text>
            </g>
          ) : null}
        </svg>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <GraphStat label="Current" value={formatEstimatedMg(simulation?.currentEstimatedMg ?? 0)} />
          <GraphStat label="Modeled high" value={formatEstimatedMg(simulation?.peakEstimatedMg ?? 0)} />
          <GraphStat label="Clearance" value={formatRelativeClearance(simulation?.clearsAt)} />
        </div>
        {simulation?.unsupportedReason ? (
          <div className="rounded-[16px] border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            {simulation.unsupportedReason}
          </div>
        ) : (
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Uses saved half-life metadata plus planned dose events. Not blood level. Not safety guidance. Not dose advice.
          </p>
        )}
      </div>
    </section>
  );
}

function GraphStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border bg-background px-2 py-2">
      <p className="truncate font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}

function ChipGroup({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

function buildProtocolPresets(stacks: Stack[], compounds: Compound[]): ProtocolPreset[] {
  const compoundsById = new Map(compounds.map((compound) => [compound.id, compound]));
  return stacks
    .filter((stack) => stack.status === 'active' && !stack.deletedAt)
    .flatMap((stack) =>
      stack.peptides.flatMap((peptide) => {
        const compound = compoundsById.get(peptide.peptideId);
        if (!compound?.pharmacokinetics?.halfLifeHours) return [];
        const recurrence = normalizeScheduleRecurrence(peptide.schedule ?? { frequency: 'daily', timesOfDay: ['08:00'] });
        const frequencyId = frequencyFromRecurrence(recurrence);
        return [
          {
            id: `${stack.id}:${peptide.id ?? peptide.peptideId}`,
            stackName: stack.name,
            compound,
            peptide,
            frequencyId,
            doseCount: estimateDoseCount(stack, recurrence),
            windowDays: Math.max(14, Math.min(120, stack.durationDays || 30)),
            scheduleLabel: `${stack.name} · ${formatDose(peptide.doseValue, peptide.doseUnit)} · ${describeRecurrence(recurrence)}`,
          },
        ];
      }),
    );
}

function frequencyFromRecurrence(recurrence: ScheduleRecurrence): HalfLifeFrequencyId {
  if (recurrence.frequency === 'daily' && recurrence.timesOfDay.length > 1) return 'twice-daily';
  if (recurrence.frequency === 'interval') {
    if ((recurrence.intervalDays ?? 1) <= 1) return 'daily';
    if (recurrence.intervalDays === 2) return 'every-2-days';
    if (recurrence.intervalDays === 3) return 'every-3-days';
  }
  if (recurrence.frequency === 'weekly') {
    const count = recurrence.weekdays?.length ?? 1;
    if (count >= 3) return 'every-2-days';
    if (count === 2) return 'every-3-days';
    return 'weekly';
  }
  return 'daily';
}

function estimateDoseCount(stack: Stack, recurrence: ScheduleRecurrence) {
  const durationDays = Math.max(1, stack.durationDays || 30);
  if (recurrence.frequency === 'daily') return Math.min(maxDoseCount, durationDays * Math.max(1, recurrence.timesOfDay.length));
  if (recurrence.frequency === 'interval') return Math.min(maxDoseCount, Math.ceil(durationDays / Math.max(1, recurrence.intervalDays ?? 1)));
  if (recurrence.frequency === 'weekly') return Math.min(maxDoseCount, Math.ceil(durationDays / 7) * Math.max(1, recurrence.weekdays?.length ?? 1));
  if (recurrence.frequency === 'cycle') {
    const cycleLength = Math.max(1, (recurrence.cycleOnDays ?? 5) + (recurrence.cycleOffDays ?? 2));
    return Math.min(maxDoseCount, Math.ceil(durationDays / cycleLength) * Math.max(1, recurrence.cycleOnDays ?? 5));
  }
  return Math.min(maxDoseCount, durationDays);
}

function describeRecurrence(recurrence: ScheduleRecurrence) {
  if (recurrence.frequency === 'daily') return recurrence.timesOfDay.length > 1 ? '2x daily' : 'Daily';
  if (recurrence.frequency === 'interval') return `Every ${recurrence.intervalDays ?? 1}d`;
  if (recurrence.frequency === 'weekly') return `${recurrence.weekdays?.length ?? 1}x weekly`;
  if (recurrence.frequency === 'cycle') return `${recurrence.cycleOnDays ?? 5} on / ${recurrence.cycleOffDays ?? 2} off`;
  return 'Planned';
}

function buildGraphPath(points: Array<{ sampledAt: string; estimatedRemainingMg: number }>, max: number, start: number, end: number) {
  if (points.length === 0) return '';
  return points
    .map((point, index) => {
      const chartPoint = pointToChart(point, max, start, end);
      return `${index === 0 ? 'M' : 'L'} ${chartPoint.x.toFixed(1)} ${chartPoint.y.toFixed(1)}`;
    })
    .join(' ');
}

function pointToChart(point: { sampledAt: string; estimatedRemainingMg: number }, max: number, start: number, end: number) {
  return {
    x: getXForTime(new Date(point.sampledAt).getTime(), start, end),
    y: Math.max(20, 146 - (point.estimatedRemainingMg / max) * 126),
  };
}

function getXForTime(time: number, start: number, end: number) {
  const timeline = Math.max(end - start, 1);
  return 20 + ((time - start) / timeline) * 280;
}

function getPeakPoint(points: Array<{ sampledAt: string; estimatedRemainingMg: number }>, max: number, start: number, end: number) {
  const peak = points.reduce<(typeof points)[number] | null>((best, point) => {
    if (!best || point.estimatedRemainingMg > best.estimatedRemainingMg) return point;
    return best;
  }, null);
  return peak ? pointToChart(peak, max, start, end) : null;
}

function closeGraphArea(path: string) {
  const matches = Array.from(path.matchAll(/[ML] ([\d.]+) [\d.]+/g));
  const firstX = matches[0]?.[1] ?? '20';
  const lastX = matches.at(-1)?.[1] ?? '300';
  return `${path} L ${lastX} 146 L ${firstX} 146 Z`;
}

function formatEstimatedMg(value: number) {
  if (value <= 0) return '-';
  if (value < 0.01) return '<0.01 mg';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: value >= 1 ? 1 : 2 })} mg`;
}

function formatRelativeClearance(value?: string | null) {
  if (!value) return '-';
  const diffDays = Math.max(0, Math.round((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  if (diffDays === 0) return '<1d';
  if (diffDays < 14) return `${diffDays}d`;
  return `${Math.round(diffDays / 7)}w`;
}

function getNextDoseLabel(simulation: ReturnType<typeof buildHalfLifeSimulation> | null) {
  const next = simulation?.events.find((event, index) => index > 0 && new Date(event.occurredAt).getTime() > Date.now());
  if (!next) return '-';
  const diffHours = Math.max(1, Math.round((new Date(next.occurredAt).getTime() - Date.now()) / (60 * 60 * 1000)));
  if (diffHours < 48) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

function getHalfLifeDoseUnits(compound: Compound): DoseUnit[] {
  const units = new Set<DoseUnit>(['mcg', 'mg']);
  if (
    compound.defaultDoseUnit === 'iu'
    || compound.conversion?.iuPerMg
    || compound.conversion?.mgPerIU
    || compound.dosePresets.some((preset) => preset.unit === 'iu')
    || compound.vialPresets.some((preset) => preset.totalAmount?.unit === 'iu')
  ) {
    units.add('iu');
  }
  return Array.from(units).sort((a, b) => unitOrder(a) - unitOrder(b));
}

function unitOrder(unit: DoseUnit) {
  if (unit === 'iu') return 0;
  if (unit === 'mg') return 1;
  return 2;
}

function clampDoseCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(maxDoseCount, parsed));
}
