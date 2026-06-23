"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Play, Pause, Clock, CheckCircle2, Sparkles } from 'lucide-react';
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
import type { Stack } from '@/lib/types';

const statusConfig = {
  active: { icon: Play, label: 'Active', className: 'bg-primary/20 text-primary' },
  planned: { icon: Clock, label: 'Planned', className: 'bg-chart-4/20 text-chart-4' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'bg-chart-3/20 text-chart-3' },
  paused: { icon: Pause, label: 'Paused', className: 'bg-muted text-muted-foreground' },
};

export default function StacksPage() {
  const { data } = useApp();
  const searchParams = useSearchParams();
  const [newStackOpen, setNewStackOpen] = useState(() => searchParams.get('add') === 'protocol');
  const [aiStackOpen, setAiStackOpen] = useState(false);
  const [peppiDraft, setPeppiDraft] = useState<Omit<Stack, 'id'> | null>(null);
  const initialCompoundId = searchParams.get('compound') ?? undefined;
  const stacks = data.stacks;
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

  return (
<AppShell>
      <PageHeader
        title="Stacks"
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
              aria-label="New stack"
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

            return (
              <Link key={stack.id} href={`/stacks/${stack.id}`} className="block">
                <Card className={cn(
                  "overflow-hidden rounded-[22px] border-border bg-card transition-colors hover:bg-secondary/30",
                  isPlanned && "border-dashed opacity-70",
                )}>
                  <CardContent className="flex items-center gap-3.5 p-3.5">
                    <div className="relative grid h-[52px] w-[52px] shrink-0 place-items-center">
                      {isPlanned ? (
                        <div className="grid h-[52px] w-[52px] place-items-center rounded-full border border-dashed border-muted-foreground/45 bg-background/50">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <svg viewBox="0 0 52 52" className="h-[52px] w-[52px]" aria-hidden="true">
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
                      {!isPlanned && <span className="absolute text-[11px] font-bold text-foreground">{Math.round(progress)}</span>}
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

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
