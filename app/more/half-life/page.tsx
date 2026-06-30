"use client";

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, CalendarDays, Search, Waves } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { Compound, DoseUnit } from '@/lib/types';

const windowOptions = [14, 30, 90, 120];
const doseCountOptions = [1, 2, 4, 8, 12];
const maxDoseCount = 365;

export default function HalfLifeVisualizerPage() {
  const { data } = useApp();
  const pkCompounds = useMemo(() => data.compounds
    .filter((compound) => compound.pharmacokinetics?.halfLifeHours)
    .sort((a, b) => a.name.localeCompare(b.name)), [data.compounds]);
  const [selectedCompoundId, setSelectedCompoundId] = useState(pkCompounds[0]?.id ?? '');
  const selectedCompound = pkCompounds.find((compound) => compound.id === selectedCompoundId) ?? pkCompounds[0];
  const [compoundSearch, setCompoundSearch] = useState('');
  const [doseValue, setDoseValue] = useState('1');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('mg');
  const [doseCount, setDoseCount] = useState(4);
  const [frequencyId, setFrequencyId] = useState<HalfLifeFrequencyId>('weekly');
  const [windowDays, setWindowDays] = useState(14);
  const allowedUnits = useMemo(() => selectedCompound ? getHalfLifeDoseUnits(selectedCompound) : ['mcg', 'mg'] satisfies DoseUnit[], [selectedCompound]);
  const dosePresets = useMemo(() => selectedCompound ? getDosePresetsForPeptide(selectedCompound.id).slice(0, 5) : [], [selectedCompound]);
  const filteredCompounds = useMemo(() => {
    const query = compoundSearch.trim().toLowerCase();
    if (!query) return pkCompounds.slice(0, 10);
    return pkCompounds.filter((compound) => `${compound.name} ${compound.id}`.toLowerCase().includes(query)).slice(0, 12);
  }, [compoundSearch, pkCompounds]);
  const simulation = useMemo(() => {
    if (!selectedCompound) return null;
    return buildHalfLifeSimulation({
      compound: selectedCompound,
      doseValue: Number.parseFloat(doseValue) || 0,
      doseUnit,
      doseCount,
      frequencyId,
      windowDays,
    });
  }, [doseCount, doseUnit, doseValue, frequencyId, selectedCompound, windowDays]);

  const applyCompound = (compound: Compound) => {
    setSelectedCompoundId(compound.id);
    const units = getHalfLifeDoseUnits(compound);
    setDoseUnit(units.includes(compound.defaultDoseUnit) ? compound.defaultDoseUnit : units[0]);
    const preset = getDosePresetsForPeptide(compound.id)[0];
    if (preset) {
      setDoseValue(String(preset.doseValue));
      setDoseUnit(preset.doseUnit);
    }
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
                  <Waves className="h-3.5 w-3.5" />
                  Simulator
                </div>
                <h2 className="mt-4 max-w-[13rem] text-2xl font-black leading-[0.95] tracking-normal">Model a curve before you log.</h2>
              </div>
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] border border-primary/25 bg-background/70 text-primary shadow-sm">
                <Activity className="h-7 w-7" />
              </div>
            </div>
            <div className="relative mt-5 grid grid-cols-3 gap-2">
              <HeroMetric label="Now" value={formatEstimatedMg(simulation?.currentEstimatedMg ?? 0)} />
              <HeroMetric label="Peak" value={formatEstimatedMg(simulation?.peakEstimatedMg ?? 0)} />
              <HeroMetric label="Near zero" value={formatRelativeClearance(simulation?.clearsAt)} />
            </div>
          </div>
        </section>

        <HalfLifeGraph compound={selectedCompound} simulation={simulation} windowDays={windowDays} />

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="compound-search">Search compounds</Label>
              <Select
                value={selectedCompound?.id ?? ''}
                onValueChange={(compoundId) => {
                  const compound = pkCompounds.find((candidate) => candidate.id === compoundId);
                  if (compound) applyCompound(compound);
                }}
              >
                <SelectTrigger aria-label="Compound picker">
                  <SelectValue placeholder="Select compound" />
                </SelectTrigger>
                <SelectContent>
                  {pkCompounds.map((compound) => (
                    <SelectItem key={compound.id} value={compound.id}>
                      {compound.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="compound-search"
                  value={compoundSearch}
                  onChange={(event) => setCompoundSearch(event.target.value)}
                  placeholder={selectedCompound?.name ?? 'Search source-backed compounds'}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filteredCompounds.map((compound) => (
                  <button
                    key={compound.id}
                    type="button"
                    onClick={() => applyCompound(compound)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition',
                      compound.id === selectedCompound?.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-muted-foreground',
                    )}
                  >
                    {compound.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="dose-value">Dose amount</Label>
                <Input id="dose-value" inputMode="decimal" value={doseValue} onChange={(event) => setDoseValue(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={doseUnit} onValueChange={(value) => setDoseUnit(value as DoseUnit)}>
                  <SelectTrigger aria-label="Dose unit"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allowedUnits.map((unit) => <SelectItem key={unit} value={unit}>{unit === 'iu' ? 'IU' : unit}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dosePresets.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dosePresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => {
                      setDoseValue(String(preset.doseValue));
                      setDoseUnit(preset.doseUnit);
                    }}
                  >
                    {formatDose(preset.doseValue, preset.doseUnit)}
                  </Button>
                ))}
              </div>
            ) : null}

            <ChipGroup label="Frequency" icon={<CalendarDays className="h-3.5 w-3.5" />}>
              {halfLifeFrequencyOptions.map((option) => (
                <Chip key={option.id} active={option.id === frequencyId} onClick={() => setFrequencyId(option.id)}>
                  {option.label}
                </Chip>
              ))}
            </ChipGroup>

            <div className="space-y-2">
              <Label htmlFor="dose-count">Doses to model</Label>
              <Input
                id="dose-count"
                inputMode="numeric"
                type="number"
                min={1}
                max={maxDoseCount}
                value={doseCount}
                onChange={(event) => setDoseCount(clampDoseCount(event.target.value))}
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
              {doseCountOptions.map((count) => (
                <Chip key={count} active={count === doseCount} onClick={() => setDoseCount(count)}>
                  {count}
                </Chip>
              ))}
              </div>
            </div>

            <ChipGroup label="Window">
              {windowOptions.map((days) => (
                <Chip key={days} active={days === windowDays} onClick={() => setWindowDays(days)}>
                  {days}d
                </Chip>
              ))}
            </ChipGroup>
          </CardContent>
        </Card>

        <div className="rounded-[18px] border border-border bg-secondary p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Assumption</p>
            {selectedCompound?.pharmacokinetics?.evidenceTier ? <Badge variant="outline">{selectedCompound.pharmacokinetics.evidenceTier}</Badge> : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selectedCompound?.pharmacokinetics?.halfLifeSource ?? simulation?.unsupportedReason}</p>
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

function HalfLifeGraph({ compound, simulation, windowDays }: { compound?: Compound; simulation: ReturnType<typeof buildHalfLifeSimulation> | null; windowDays: number }) {
  const points = simulation?.points ?? [];
  const max = Math.max(...points.map((point) => point.estimatedRemainingMg), simulation?.peakEstimatedMg ?? 0, 0.001);
  const fallbackStart = 0;
  const start = points[0] ? new Date(points[0].sampledAt).getTime() : fallbackStart;
  const end = points.at(-1) ? new Date(points.at(-1)?.sampledAt ?? '').getTime() : fallbackStart + windowDays * 24 * 60 * 60 * 1000;
  const path = buildGraphPath(points, max, start, end);
  const area = path ? closeGraphArea(path) : '';
  const gradientId = `half-life-fill-${compound?.id?.replace(/[^a-z0-9_-]/gi, '-') ?? 'empty'}`;

  return (
    <section className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold">{compound?.name ?? 'Select a compound'}</h2>
          <p className="text-xs text-muted-foreground">Estimated remaining amount · {windowDays} days</p>
        </div>
        <Badge variant="secondary">{simulation?.events.length ?? 0} doses</Badge>
      </div>
      <div className="relative px-2 py-3">
        <svg viewBox="0 0 320 178" className="h-56 w-full" role="img" aria-label={`${compound?.name ?? 'Compound'} estimated remaining amount curve`}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.48" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <path d="M20 146 H300" stroke="var(--border)" strokeWidth="1" />
          <path d="M20 104 H300" stroke="var(--border)" strokeOpacity="0.55" strokeWidth="1" />
          <path d="M20 62 H300" stroke="var(--border)" strokeOpacity="0.55" strokeWidth="1" />
          <path d="M20 20 H300" stroke="var(--border)" strokeOpacity="0.45" strokeWidth="1" />
          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {path ? <path d={path} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {(simulation?.events ?? []).map((event) => {
            const x = 20 + ((new Date(event.occurredAt).getTime() - start) / Math.max(end - start, 1)) * 280;
            if (x < 20 || x > 300) return null;
            return <rect key={event.id} x={x - 3.5} y="149" width="7" height="7" rx="2.5" fill="var(--primary)" />;
          })}
        </svg>
        {points.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{simulation?.unsupportedReason ?? 'Select a compound and dose to draw the curve.'}</p>
          </div>
        ) : null}
      </div>
    </section>
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

function buildGraphPath(points: Array<{ sampledAt: string; estimatedRemainingMg: number }>, max: number, start: number, end: number) {
  if (points.length === 0) return '';
  const timeline = Math.max(end - start, 1);
  return points.map((point, index) => {
    const x = 20 + ((new Date(point.sampledAt).getTime() - start) / timeline) * 280;
    const y = 146 - (point.estimatedRemainingMg / max) * 126;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${Math.max(20, y).toFixed(1)}`;
  }).join(' ');
}

function closeGraphArea(path: string) {
  const matches = Array.from(path.matchAll(/[ML] ([\d.]+) [\d.]+/g));
  const firstX = matches[0]?.[1] ?? '20';
  const lastX = matches.at(-1)?.[1] ?? '300';
  return `${path} L ${lastX} 146 L ${firstX} 146 Z`;
}

function formatEstimatedMg(value: number) {
  if (value <= 0) return '—';
  if (value < 0.01) return '<0.01 mg';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: value >= 1 ? 1 : 2 })} mg`;
}

function formatRelativeClearance(value?: string | null) {
  if (!value) return '—';
  const diffDays = Math.max(0, Math.round((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  if (diffDays === 0) return '<1d';
  if (diffDays < 14) return `${diffDays}d`;
  return `${Math.round(diffDays / 7)}w`;
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
