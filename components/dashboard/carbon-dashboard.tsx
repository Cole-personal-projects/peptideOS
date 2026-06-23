"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  FlaskConical,
  Layers,
  MessageSquareText,
  Plus,
  Syringe,
} from 'lucide-react';
import { QuickConfirmDoseDialog } from '@/components/dashboard/quick-confirm-dose-dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { formatDose } from '@/lib/dose-helpers';
import { buildDashboardBriefing } from '@/lib/dashboard-summary';
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

function getProgressPercentage(startDate: string, durationDays: number, status: string) {
  if (status === 'planned') return 0;
  if (status === 'completed') return 100;
  const start = new Date(startDate);
  const elapsed = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.min(Math.max((elapsed / durationDays) * 100, 0), 100);
}

function getDaysRemaining(startDate: string, durationDays: number) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + durationDays);
  return Math.max(Math.ceil((end.getTime() - Date.now()) / 86_400_000), 0);
}

function ScoreRing({ value }: { value: number }) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-[196px] w-[196px] items-center justify-center">
      <svg viewBox="0 0 196 196" className="absolute inset-0 h-full w-full -rotate-90">
        <defs>
          <linearGradient id="protocol-score-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-light)" />
            <stop offset="55%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent-deep)" />
          </linearGradient>
          <filter id="protocol-score-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="98" cy="98" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="9" />
        <circle
          cx="98"
          cy="98"
          r={radius}
          fill="none"
          filter="url(#protocol-score-glow)"
          stroke="url(#protocol-score-gradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="9"
        />
      </svg>
      <div className="text-center">
        <p className="text-[54px] font-bold leading-none tracking-[-0.055em]">{value}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Protocol score</p>
      </div>
    </div>
  );
}

function statusClasses(event: ProtocolTimelineEvent) {
  if (event.status === 'overdue' || event.urgency === 'critical') return 'border-destructive/40 bg-destructive/10 text-destructive';
  if (event.status === 'taken' || event.status === 'completed') return 'border-chart-3/40 bg-chart-3/10 text-chart-3';
  if (event.status === 'skipped' || event.status === 'missed') return 'border-muted-foreground/30 bg-secondary text-muted-foreground';
  return 'border-primary/40 bg-primary/10 text-primary';
}

function eventIcon(event: ProtocolTimelineEvent) {
  if (event.kind === 'inventory') return <FlaskConical className="h-4 w-4" />;
  if (event.kind === 'signal') return <MessageSquareText className="h-4 w-4" />;
  if (event.status === 'taken' || event.status === 'completed') return <Check className="h-4 w-4" />;
  return <Syringe className="h-4 w-4" />;
}

function eventStatusLabel(event: ProtocolTimelineEvent) {
  if (event.status === 'taken' || event.status === 'completed') return 'Taken today';
  if (event.status === 'skipped') return 'Skipped';
  if (event.status === 'missed') return 'Missed';
  if (event.status === 'overdue') return 'Overdue';
  return 'Due';
}

export function CarbonDashboard() {
  const { data, getPeptide, getRecentDoses } = useApp();
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const briefing = useMemo(() => buildDashboardBriefing(data), [data]);
  const summary = useMemo(() => buildProtocolCockpitSummary(data), [data]);
  const recentDoses = getRecentDoses(4);
  const activeStacks = data.stacks.filter((stack) => stack.status === 'active');
  const todayEvents = summary.events
    .filter((event) => event.kind === 'due-dose')
    .slice(0, 3);
  const score = briefing.scheduledToday === 0
    ? Math.min(100, 72 + activeStacks.length * 6)
    : Math.round(briefing.completionPercent);
  const urgentSignal = summary.nextAction ?? summary.mostUrgentInventoryRisk ?? summary.latestSignal;
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const greeting = now.getHours() < 12 ? 'Morning' : now.getHours() < 18 ? 'Afternoon' : 'Evening';

  return (
    <>
      <div className="px-5 pb-8 pt-5">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{dateLabel}</p>
            <h1 className="mt-1 text-[28px] font-bold leading-none tracking-[-0.02em]">{greeting}</h1>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-border bg-card text-muted-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </header>

        <section className="carbon-panel rounded-[22px] px-5 py-6">
          <ScoreRing value={score} />
          <div className="mt-5 grid grid-cols-4 gap-2">
            <Metric label="Due" value={summary.dueCount} tone={summary.overdueCount > 0 ? 'danger' : 'primary'} />
            <Metric label="Done" value={summary.completedTodayCount} tone="success" />
            <Metric label="Stacks" value={summary.activeStackCount} tone="neutral" />
            <Metric label="Stock" value={summary.inventoryRiskCount} tone={summary.inventoryRiskCount > 0 ? 'warning' : 'neutral'} />
          </div>
        </section>

        {urgentSignal && (
          <Link
            href={urgentSignal.href ?? '/log'}
            className={cn(
              'mt-3 flex items-start gap-3 rounded-[17px] border p-3 transition-colors',
              urgentSignal.urgency === 'critical'
                ? 'border-destructive/40 bg-destructive/10'
                : urgentSignal.urgency === 'warning'
                  ? 'border-chart-4/40 bg-chart-4/10'
                  : 'border-primary/30 bg-primary/10',
            )}
          >
            <div className="mt-0.5 text-primary">{urgentSignal.kind === 'inventory' ? <AlertTriangle className="h-4 w-4 text-chart-4" /> : eventIcon(urgentSignal)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Next signal</p>
              <p className="mt-0.5 truncate text-sm font-semibold">{urgentSignal.label}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{urgentSignal.detail}</p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
          </Link>
        )}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold uppercase tracking-[0.08em]">Today</h2>
            <Link href="/log" className="flex items-center text-xs font-semibold text-primary">
              Log <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {todayEvents.length === 0 ? (
              <EmptyAction href="/stacks" title="No scheduled doses waiting" body="Create or activate a stack to populate today." />
            ) : (
              todayEvents.map((event) => {
                const scheduleLogId = event.id.startsWith('schedule-log:') ? event.id.replace('schedule-log:', '') : null;

                return (
                  <div key={event.id} className="carbon-panel rounded-[17px] p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-[10px] border', statusClasses(event))}>
                        {eventIcon(event)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold">{event.label}</p>
                              <span className={cn('rounded-[8px] border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]', statusClasses(event))}>
                                {eventStatusLabel(event)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-muted-foreground">{formatTime(event.occurredAt)}</p>
                        </div>
                        {scheduleLogId && event.status !== 'taken' && event.status !== 'skipped' && event.status !== 'missed' && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button asChild size="sm" variant="outline" className="h-9 rounded-[12px]">
                              <Link href={event.href ?? '/log'}>Details</Link>
                            </Button>
                            <Button size="sm" className="h-9 rounded-[12px] ember-gradient text-primary-foreground" onClick={() => setActiveLogId(scheduleLogId)}>
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

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold uppercase tracking-[0.08em]">Active stacks</h2>
            <Link href="/stacks" className="flex items-center text-xs font-semibold text-primary">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {activeStacks.length === 0 ? (
            <EmptyAction href="/stacks" title="No active stack" body="Start with one protocol, then connect inventory and logs." />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {activeStacks.slice(0, 4).map((stack) => {
                const progress = getProgressPercentage(stack.startDate, stack.durationDays, stack.status);
                const daysRemaining = getDaysRemaining(stack.startDate, stack.durationDays);

                return (
                  <Link key={stack.id} href={`/stacks/${stack.id}`} className="carbon-panel block min-w-[238px] rounded-[22px] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{stack.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Day {Math.max(stack.durationDays - daysRemaining, 0)} / {stack.durationDays}</p>
                      </div>
                      <MiniRing value={progress} label={`${daysRemaining}d`} />
                    </div>
                    <div className="mt-4 flex h-6 items-end gap-1">
                      {Array.from({ length: 14 }, (_, index) => (
                        <div
                          key={index}
                          className={cn(
                            'flex-1 rounded-[3px]',
                            index < 10 ? 'bg-chart-3' : index === 10 ? 'bg-primary shadow-[0_0_10px_rgb(240_116_52_/_0.55)]' : 'bg-[var(--text-faint)]',
                          )}
                          style={{ height: `${index % 3 === 0 ? 24 : index % 2 === 0 ? 18 : 12}px` }}
                        />
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {stack.peptides.slice(0, 2).map((item) => {
                        const peptide = getPeptide(item.peptideId);
                        return (
                          <div key={item.id ?? item.peptideId} className="carbon-inset flex items-center justify-between gap-2 rounded-[12px] px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold">{peptide?.name ?? item.peptideId}</p>
                              <p className="text-[11px] text-muted-foreground">{formatDose(item.doseValue, item.doseUnit)} · {item.timing}</p>
                            </div>
                            <span className="rounded-[8px] border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Active</span>
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/more/inventory" className="carbon-panel rounded-[17px] p-4">
            <FlaskConical className="h-5 w-5 text-chart-4" />
            <p className="mt-3 text-2xl font-bold leading-none">{data.vials.filter((vial) => vial.status === 'active').length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active inventory</p>
          </Link>
          <Link href="/labs" className="carbon-panel rounded-[17px] p-4">
            <CalendarClock className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold leading-none">{data.labReports.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Lab reports</p>
          </Link>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold uppercase tracking-[0.08em]">Recent</h2>
            <Link href="/log" className="flex items-center text-xs font-semibold text-primary">
              Timeline <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="carbon-panel rounded-[17px] p-2">
            {recentDoses.length === 0 ? (
              <div className="px-2 py-5 text-sm text-muted-foreground">No recent dose activity.</div>
            ) : (
              recentDoses.map((dose) => {
                const peptide = getPeptide(dose.peptideId);
                return (
                  <div key={dose.id} className="flex items-center justify-between gap-3 rounded-[12px] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{peptide?.name ?? dose.peptideId}</p>
                      <p className="text-xs text-muted-foreground">{formatShortDate(dose.dateTime)} · {formatTime(dose.dateTime)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-muted-foreground">{formatDose(dose.doseValue, dose.doseUnit)}</p>
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

function Metric({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' }) {
  const toneClass = {
    primary: 'text-primary',
    success: 'text-chart-3',
    warning: 'text-chart-4',
    danger: 'text-destructive',
    neutral: 'text-foreground',
  }[tone];

  return (
    <div className="carbon-inset rounded-[13px] p-2 text-center">
      <p className={cn('text-xl font-bold leading-none tracking-[-0.03em]', toneClass)}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniRing({ value, label }: { value: number; label: string }) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-[52px] w-[52px] items-center justify-center">
      <svg viewBox="0 0 52 52" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="4.5" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="4.5"
        />
      </svg>
      <span className="text-[10px] font-bold text-primary">{label}</span>
    </div>
  );
}

function EmptyAction({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="carbon-panel flex items-center gap-3 rounded-[17px] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-primary/30 bg-primary/10 text-primary">
        <Plus className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
