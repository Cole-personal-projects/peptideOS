"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronRight,
  FlaskConical,
  PackageCheck,
  Play,
  Settings,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import { QuickConfirmDoseDialog } from '@/components/dashboard/quick-confirm-dose-dialog';
import { AdherenceCard } from '@/components/dashboard/adherence-card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { buildDashboardBriefing } from '@/lib/dashboard-summary';
import { formatDose } from '@/lib/dose-helpers';
import { buildProtocolCockpitSummary, type ProtocolTimelineEvent } from '@/lib/protocol-timeline';
import { cn } from '@/lib/utils';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function progressForStack(startDate: string, durationDays: number, status: string) {
  if (status === 'planned') return 0;
  if (status === 'completed') return 100;
  const start = new Date(startDate);
  const elapsed = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.min(Math.max(Math.round((elapsed / durationDays) * 100), 0), 100);
}

function daysRemaining(startDate: string, durationDays: number) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + durationDays);
  return Math.max(Math.ceil((end.getTime() - Date.now()) / 86_400_000), 0);
}

function statusClasses(event: ProtocolTimelineEvent) {
  if (event.status === 'overdue' || event.urgency === 'critical') return 'border-destructive/40 bg-destructive/10 text-destructive';
  if (event.status === 'taken' || event.status === 'completed') return 'border-chart-3/40 bg-chart-3/10 text-chart-3';
  if (event.status === 'skipped' || event.status === 'missed') return 'border-muted-foreground/30 bg-secondary text-muted-foreground';
  return 'border-primary/40 bg-primary/10 text-primary';
}

function eventStatusLabel(event: ProtocolTimelineEvent) {
  if (event.status === 'taken' || event.status === 'completed') return 'Taken today';
  if (event.status === 'skipped') return 'Skipped';
  if (event.status === 'missed') return 'Missed';
  if (event.status === 'overdue') return 'Overdue';
  return 'Due';
}

function ScoreRing({ value }: { value: number | null }) {
 const radius = 72;
 const circumference = 2 * Math.PI * radius;
 const normalizedValue = value ?? 0;
 const offset = circumference - (normalizedValue / 100) * circumference;

  return (
<div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full -rotate-90">
        <defs>
          <linearGradient id="dashboard-score-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-light)" />
            <stop offset="55%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent-deep)" />
          </linearGradient>
          <filter id="dashboard-score-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="88" cy="88" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="10" />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          filter="url(#dashboard-score-glow)"
          stroke="url(#dashboard-score-gradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
        />
      </svg>
      <div className="relative z-10 text-center">
<p className="text-3xl font-bold leading-none tracking-normal">{value === null ? '--' : value}</p>
<p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{value === null ? 'No data yet' : 'Today'}</p>
      </div>
    </div>
  );
}

function ProtocolChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-secondary px-3 py-2 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full bg-chart-3" />
      <span className="max-w-[150px] truncate">{label}</span>
    </span>
  );
}

function AdherenceBars({ completed, total }: { completed: number; total: number }) {
const percent = total === 0 ? null : Math.round((completed / total) * 100);
const filledBars = percent === null ? 0 : Math.round((percent / 100) * 7);

  return (
    <section className="rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Weekly adherence</h3>
        <span className={cn('text-lg font-bold', percent === null ? 'text-muted-foreground' : 'text-chart-3')}>
          {percent === null ? '--' : `${percent}%`}
        </span>
      </div>
      <div className="mt-3 flex h-2 gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex-1 rounded-sm',
              index < filledBars ? 'bg-chart-3' : 'border border-border bg-secondary',
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{completed} completed today</span>
        <span>{total === 0 ? 'No scheduled doses' : `${total} scheduled`}</span>
      </div>
    </section>
  );
}

function FirstProtocolSetupCard() {
  return (
    <section className="mt-2 rounded-[18px] border border-primary/25 bg-card p-4 shadow-[0_16px_40px_hsl(var(--primary)/0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">First protocol</p>
          <h2 className="mt-1 text-lg font-extrabold tracking-normal">Build the loop once.</h2>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-primary/10 text-primary">
          <Play className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1.5" aria-label="First protocol setup path">
        {[
          { label: 'Pick', active: true },
          { label: 'Dose', active: true },
          { label: 'Stock', active: false },
          { label: 'Log', active: false },
        ].map((step) => (
          <div key={step.label} className="space-y-1">
            <div className={cn('h-2 rounded-full', step.active ? 'bg-primary' : 'bg-secondary')} />
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{step.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Button asChild className="h-11 justify-between rounded-[14px] px-4">
          <Link href="/stacks?add=protocol">
            Start protocol
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="h-11 w-11 rounded-[14px]" aria-label="Add stock">
          <Link href="/more/inventory?add=stock">
            <PackageCheck className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function CarbonDashboard() {
  const { data, getPeptide, getRecentDoses } = useApp();
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const briefing = useMemo(() => buildDashboardBriefing(data), [data]);
  const summary = useMemo(() => buildProtocolCockpitSummary(data), [data]);
  const activeStacks = data.stacks.filter((stack) => stack.status === 'active');
  const hasAnyProtocol = data.stacks.length > 0;
  const recentDoses = getRecentDoses(4);
  const todayEvents = summary.events.filter((event) => event.kind === 'due-dose').slice(0, 3);
  const score = briefing.scheduledToday === 0 ? null : Math.round(briefing.completionPercent);
  const insight = summary.mostUrgentInventoryRisk ?? summary.nextAction ?? summary.latestSignal;
  const insightHref = insight?.href ?? '/stacks?add=protocol';
  const primaryStack = activeStacks[0];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3" aria-label="Dashboard">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_18px_rgb(240_116_52_/_0.14)]">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
<h1 className="text-xl font-bold tracking-normal text-primary">PeptideOS</h1>
        </Link>
        <Button asChild size="icon" variant="ghost" className="h-10 w-10 rounded-[10px] text-muted-foreground">
          <Link href="/more/settings" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      <div className="px-4 pb-8 pt-4">
        <section className="flex flex-col items-center gap-3 py-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today</h2>
          <ScoreRing value={score} />
          <div className="flex gap-8">
            <Metric label="Due" value={summary.dueCount} tone={summary.overdueCount > 0 ? 'danger' : 'warning'} />
            <div className="w-px bg-border" />
            <Metric label="Completed" value={summary.completedTodayCount} tone="success" />
          </div>
          <div className="mt-1 flex max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar">
            {activeStacks.length === 0 ? (
              <ProtocolChip label="No active protocol" />
            ) : (
              activeStacks.slice(0, 3).map((stack) => <ProtocolChip key={stack.id} label={stack.name} />)
            )}
          </div>
      </section>

      {!hasAnyProtocol && <FirstProtocolSetupCard />}

      <Link
          href={insightHref}
          className={cn(
'relative mt-2 flex items-start gap-3 overflow-hidden rounded-[14px] border border-border bg-card p-3.5',
            insight?.urgency === 'critical' ? 'border-destructive/40 bg-destructive/10' : '',
          )}
        >
          <div className={cn('absolute bottom-0 left-0 top-0 w-1', insight?.urgency === 'critical' ? 'bg-destructive' : 'bg-chart-4')} />
<AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', insight?.urgency === 'critical' ? 'text-destructive' : 'text-chart-4')} />
          <div className="min-w-0 flex-1">
<p className="truncate text-sm font-bold">{insight?.label ?? 'No urgent protocol signals'}</p>
<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {insight?.detail ?? 'Start with one protocol, then connect stock, labs, and logs.'}
            </p>
<span className="mt-3 inline-flex rounded-[10px] border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
              {insight ? 'Review' : 'Build protocol'}
            </span>
          </div>
        </Link>

        <Link
          href="/log"
className="ember-gradient ember-glow mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold text-primary-foreground active:scale-[0.99]"
        >
          <Syringe className="h-5 w-5" />
          Quick Log
        </Link>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
<h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Today</h2>
            <Link href="/log" className="flex items-center text-xs font-bold text-primary">
              Timeline <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {todayEvents.length === 0 ? (
            <Link href="/stacks?add=protocol" className="flex items-center gap-3 rounded-[14px] border border-border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/10 text-primary">
                  <Syringe className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Build your first protocol</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Add peptides and dosing times in one guided flow.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ) : (
              todayEvents.map((event) => {
                const scheduleLogId = event.id.startsWith('schedule-log:') ? event.id.replace('schedule-log:', '') : null;
                return (
                  <div key={event.id} className="rounded-[14px] border border-border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-[10px] border', statusClasses(event))}>
                        <Syringe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{event.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                          </div>
<span className={cn('shrink-0 rounded-[8px] border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em]', statusClasses(event))}>
                            {eventStatusLabel(event)}
                          </span>
                        </div>
                        {scheduleLogId && event.status !== 'taken' && event.status !== 'skipped' && event.status !== 'missed' && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button asChild size="sm" variant="outline" className="h-9 rounded-[10px]">
                              <Link href={event.href ?? '/log'}>Details</Link>
                            </Button>
                            <Button size="sm" className="h-9 rounded-[10px] ember-gradient text-primary-foreground" onClick={() => setActiveLogId(scheduleLogId)}>
                              Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {primaryStack && (
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
<h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Active protocol</h2>
              <Link href="/stacks" className="flex items-center text-xs font-bold text-primary">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <Link href={`/stacks/${primaryStack.id}`} className="block rounded-[14px] border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{primaryStack.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Day {Math.max(primaryStack.durationDays - daysRemaining(primaryStack.startDate, primaryStack.durationDays), 0)} / {primaryStack.durationDays}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{progressForStack(primaryStack.startDate, primaryStack.durationDays, primaryStack.status)}%</p>
<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Progress</p>
                </div>
              </div>
              <div className="mt-4 flex h-7 items-end gap-1">
                {Array.from({ length: 14 }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'flex-1 rounded-sm',
                      index < 9 ? 'bg-chart-3' : index === 9 ? 'bg-primary shadow-[0_0_10px_rgb(240_116_52_/_0.5)]' : 'border border-border bg-secondary',
                    )}
                    style={{ height: `${index % 4 === 0 ? 28 : index % 3 === 0 ? 22 : 16}px` }}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-2">
                {primaryStack.peptides.slice(0, 2).map((item) => {
                  const peptide = getPeptide(item.peptideId);
                  return (
                    <div key={item.id ?? item.peptideId} className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-secondary px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{peptide?.name ?? item.peptideId}</p>
<p className="text-xs text-muted-foreground">{formatDose(item.doseValue, item.doseUnit)} · {item.timing}</p>
                      </div>
<span className="rounded-[8px] border border-chart-3/40 bg-chart-3/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-chart-3">Active</span>
                    </div>
                  );
                })}
              </div>
            </Link>
          </section>
        )}

        <div className="mt-5">
<AdherenceBars completed={summary.completedTodayCount} total={Math.max(briefing.scheduledToday, summary.completedTodayCount)} />
</div>

<div className="mt-3">
<AdherenceCard />
</div>

<section className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/more/inventory" className="rounded-[14px] border border-border bg-card p-4">
            <FlaskConical className="h-5 w-5 text-chart-4" />
<p className="mt-3 text-xl font-bold leading-none">{data.vials.filter((vial) => vial.status === 'active').length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Stock Room</p>
          </Link>
          <Link href="/labs" className="rounded-[14px] border border-border bg-card p-4">
            <CalendarClock className="h-5 w-5 text-primary" />
<p className="mt-3 text-xl font-bold leading-none">{data.labReports.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Labs</p>
          </Link>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
<h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Recent activity</h2>
            <Link href="/log" className="flex items-center text-xs font-bold text-primary">
              Log <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-2">
            {recentDoses.length === 0 ? (
              <div className="px-2 py-5 text-sm text-muted-foreground">No recent dose activity.</div>
            ) : (
              recentDoses.map((dose) => {
                const peptide = getPeptide(dose.peptideId);
                return (
                  <div key={dose.id} className="flex items-center justify-between gap-3 rounded-[12px] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{peptide?.name ?? dose.peptideId}</p>
                      <p className="text-xs text-muted-foreground">{formatShortDate(dose.dateTime)} · {formatTime(dose.dateTime)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-muted-foreground">{formatDose(dose.doseValue, dose.doseUnit)}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <QuickConfirmDoseDialog
        logId={activeLogId}
        open={Boolean(activeLogId)}
        onOpenChange={(open) => !open && setActiveLogId(null)}
        title="Complete scheduled dose"
        description="Confirm the vial and details for this scheduled item."
        confirmLabel="Complete dose"
      />
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' }) {
  const toneClass = {
    success: 'text-chart-3',
    warning: 'text-chart-4',
    danger: 'text-destructive',
  }[tone];

  return (
    <div className="flex flex-col items-center">
      <span className={cn('text-xl font-bold leading-none', toneClass)}>{value}</span>
<span className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
    </div>
  );
}
