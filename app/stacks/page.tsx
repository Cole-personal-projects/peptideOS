"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ChevronRight, Plus, Play, Pause, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { NewStackSheet } from '@/components/navigation/new-stack-sheet';
import { AiStackSheet } from '@/components/navigation/ai-stack-sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useApp } from '@/lib/context';
import { isAssistantAction, PEPPI_PROTOCOL_DRAFT_STORAGE_KEY } from '@/lib/assistant-actions';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { getEmptyStateContent } from '@/lib/empty-states';
import { cn } from '@/lib/utils';
import type { AppData, Stack } from '@/lib/types';

const statusConfig = {
  active: { icon: Play, label: 'Active', className: 'bg-primary/20 text-primary' },
  planned: { icon: Clock, label: 'Planned', className: 'bg-chart-4/20 text-chart-4' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'bg-chart-3/20 text-chart-3' },
  paused: { icon: Pause, label: 'Paused', className: 'bg-muted text-muted-foreground' },
};

type StackOperationalSummary = {
  nextLabel: string;
  completionLabel: string;
  inventoryLabel: string;
  hasInventoryGap: boolean;
};

export default function StacksPage() {
  const { data } = useApp();
  const searchParams = useSearchParams();
  const [newStackOpen, setNewStackOpen] = useState(() => searchParams.get('add') === 'protocol');
  const [aiStackOpen, setAiStackOpen] = useState(false);
  const [peppiDraft, setPeppiDraft] = useState<Omit<Stack, 'id'> | null>(null);
  const initialCompoundId = searchParams.get('compound') ?? undefined;
  const stacks = data.stacks.filter((stack) => !stack.deletedAt);
  const emptyState = getEmptyStateContent('stacks-empty');
  const trackableCompounds = getTrackableCompounds(data);

  useEffect(() => {
    if (searchParams.get('draft') !== 'peppi') return;

    const storedDraft = window.sessionStorage.getItem(PEPPI_PROTOCOL_DRAFT_STORAGE_KEY);
    if (!storedDraft) return;

    try {
      const parsedDraft = JSON.parse(storedDraft);
      const action = { id: 'peppi-builder-draft', type: 'create_stack_from_protocol', payload: parsedDraft };
      if (isAssistantAction(action) && action.type === 'create_stack_from_protocol') {
        setPeppiDraft(action.payload);
        setNewStackOpen(true);
      }
    } finally {
      window.sessionStorage.removeItem(PEPPI_PROTOCOL_DRAFT_STORAGE_KEY);
    }
  }, [searchParams]);

const getProgressPercentage = (startDate: string, durationDays: number, status: string) => {
if (status === 'planned') return 0;
if (status === 'completed') return 100;
const start = new Date(startDate);
const now = new Date();
const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
return Math.min(Math.max((elapsed / durationDays) * 100, 0), 100);
};

const getStackDay = (stack: Stack) => {
if (stack.status === 'planned') return 'Not started';
const start = new Date(stack.startDate);
const now = new Date();
const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
return `Day ${Math.min(Math.max(elapsed, 1), stack.durationDays)}`;
};

  const getCompoundName = (compoundId: string) => (
    trackableCompounds.find((candidate) => candidate.id === compoundId)?.name ?? compoundId
  );

  const getOperationalSummary = (stack: Stack): StackOperationalSummary => (
    getStackOperationalSummary(stack, data)
  );

  return (
<AppShell>
      <PageHeader
        title="Protocols"
        rightElement={
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-[10px] border-border bg-card text-primary"
              onClick={() => setAiStackOpen(true)}
              aria-label="Peppi protocol assistant"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-primary to-[hsl(var(--chart-5))] text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/0.28)]"
              onClick={() => setNewStackOpen(true)}
              aria-label="New protocol"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-2.5">
        {stacks.length === 0 ? (
          <Empty className="bg-secondary/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>{emptyState.title}</EmptyTitle>
              <EmptyDescription>{emptyState.description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={() => setNewStackOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> {emptyState.actionLabel}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          stacks.map((stack) => {
            const config = statusConfig[stack.status];
            const StatusIcon = config.icon;
            const progress = getProgressPercentage(stack.startDate, stack.durationDays, stack.status);
            const circumference = 2 * Math.PI * 22;
            const dashOffset = circumference - (progress / 100) * circumference;
            const isPlanned = stack.status === 'planned';
            const summary = getOperationalSummary(stack);

            return (
              <Link key={stack.id} href={`/stacks/${stack.id}`} className="block">
                <Card className={cn(
                  "overflow-hidden rounded-[22px] border-border bg-card transition-colors hover:bg-secondary/30",
                  isPlanned && "border-dashed opacity-70",
                )}>
                  <CardContent className="flex items-start gap-3.5 p-3.5">
                    <div className="relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center">
                      {isPlanned ? (
                        <div className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-muted-foreground/45 bg-background/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <svg viewBox="0 0 52 52" className="h-11 w-11" aria-hidden="true">
                          <circle cx="26" cy="26" r="22" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4.5" />
                          <circle
                            cx="26"
                            cy="26"
                            r="22"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeLinecap="round"
                            strokeWidth="4.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 26 26)"
                          />
                        </svg>
                      )}
                      {!isPlanned && <span className="absolute text-[10px] font-bold text-foreground">{Math.round(progress)}</span>}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-bold leading-tight text-foreground">{stack.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getStackDay(stack)} · {stack.durationDays} days
                          </p>
                        </div>
                        <Badge variant="secondary" className={cn("shrink-0 text-[11px]", config.className)}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                        <span className="truncate rounded-[6px] bg-secondary/55 px-2 py-1 text-muted-foreground">{summary.nextLabel}</span>
                        <span className="truncate rounded-[6px] bg-secondary/55 px-2 py-1 text-muted-foreground">{summary.completionLabel}</span>
                        <span className={cn('truncate rounded-[6px] px-2 py-1', summary.hasInventoryGap ? 'bg-destructive/10 text-destructive' : 'bg-secondary/55 text-muted-foreground')}>
                          {summary.hasInventoryGap && <AlertTriangle className="mr-1 inline h-3 w-3 align-[-2px]" />}
                          {summary.inventoryLabel}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {stack.peptides.slice(0, 4).map((sp) => (
                          <Badge key={sp.id ?? sp.peptideId} variant="outline" className="border-border bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                            {getCompoundName(sp.peptideId)}
                          </Badge>
                        ))}
                        {stack.peptides.length > 4 && (
                          <Badge variant="outline" className="border-border bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                            +{stack.peptides.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
<NewStackSheet
        key={peppiDraft ? `peppi-${peppiDraft.name}` : initialCompoundId ?? 'manual-stack'}
        open={newStackOpen}
        onOpenChange={setNewStackOpen}
        initialCompoundId={initialCompoundId}
        initialDraft={peppiDraft ?? undefined}
      />
      <AiStackSheet open={aiStackOpen} onOpenChange={setAiStackOpen} />
    </AppShell>
  );
}

function getStackOperationalSummary(stack: Stack, data: AppData): StackOperationalSummary {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const stackLogs = data.scheduleLogs.filter((log) => log.stackId === stack.id);
  const pendingLogs = stackLogs
    .filter((log) => log.status === 'pending')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const overdueCount = pendingLogs.filter((log) => new Date(log.dueAt).getTime() < now.getTime()).length;
  const nextLog = pendingLogs[0];
  const todayLogs = stackLogs.filter((log) => log.dueAt.slice(0, 10) === todayKey);
  const completedToday = todayLogs.filter((log) => log.status === 'taken').length;
  const decidedToday = todayLogs.filter((log) => log.status === 'taken' || log.status === 'skipped' || log.status === 'missed').length;
  const stackCompoundIds = new Set(stack.peptides.map((peptide) => peptide.peptideId));
  const coveredCompoundIds = new Set(
    data.inventoryBatches
      .filter((batch) => stackCompoundIds.has(batch.peptideId) && batch.vialCount > 0)
      .map((batch) => batch.peptideId),
  );
  const missingInventory = stack.peptides.filter((peptide) => !coveredCompoundIds.has(peptide.peptideId)).length;

  return {
    nextLabel: overdueCount > 0
      ? `${overdueCount} overdue`
      : nextLog
        ? `Next ${formatShortTime(nextLog.dueAt)}`
        : stack.status === 'planned'
          ? 'Not scheduled'
          : 'No pending doses',
    completionLabel: todayLogs.length > 0 ? `${completedToday}/${todayLogs.length} done today` : `${decidedToday} logged today`,
    inventoryLabel: stack.peptides.length === 0
      ? 'No compounds'
      : missingInventory > 0
        ? `${missingInventory} inventory gap${missingInventory === 1 ? '' : 's'}`
        : 'Inventory linked',
    hasInventoryGap: missingInventory > 0,
  };
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
