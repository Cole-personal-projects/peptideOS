"use client";

import { useState } from 'react';
import Link from 'next/link';
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
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { getEmptyStateContent } from '@/lib/empty-states';
import { cn } from '@/lib/utils';

const statusConfig = {
  active: { icon: Play, label: 'Active', className: 'bg-primary/20 text-primary' },
  planned: { icon: Clock, label: 'Planned', className: 'bg-chart-4/20 text-chart-4' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'bg-chart-3/20 text-chart-3' },
  paused: { icon: Pause, label: 'Paused', className: 'bg-muted text-muted-foreground' },
};

export default function StacksPage() {
  const { data } = useApp();
  const [newStackOpen, setNewStackOpen] = useState(false);
  const [aiStackOpen, setAiStackOpen] = useState(false);
  const stacks = data.stacks;
  const emptyState = getEmptyStateContent('stacks-empty');
  const trackableCompounds = getTrackableCompounds(data);

  const getProgressPercentage = (startDate: string, durationDays: number, status: string) => {
    if (status === 'planned') return 0;
    if (status === 'completed') return 100;
    const start = new Date(startDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max((elapsed / durationDays) * 100, 0), 100);
  };

  return (
    <AppShell>
      <PageHeader 
        title="Stacks" 
        rightElement={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-primary"
              onClick={() => setAiStackOpen(true)}
              aria-label="Peppi protocol assistant"
            >
              <Sparkles className="w-4 h-4 mr-1" /> AI
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary"
              onClick={() => setNewStackOpen(true)}
              aria-label="New stack"
            >
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-3">
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

            return (
              <Link key={stack.id} href={`/stacks/${stack.id}`}>
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold truncate">{stack.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                          {stack.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className={cn("flex-shrink-0 text-xs", config.className)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-3">
                      {stack.peptides.map((sp) => {
                        const compound = trackableCompounds.find((candidate) => candidate.id === sp.peptideId);
                        return (
                          <Badge key={sp.peptideId} variant="outline" className="text-xs">
                            {compound?.name ?? sp.peptideId}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stack.durationDays} days total</span>
                        <span>{Math.round(progress)}% complete</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
      <NewStackSheet open={newStackOpen} onOpenChange={setNewStackOpen} />
      <AiStackSheet open={aiStackOpen} onOpenChange={setAiStackOpen} />
    </AppShell>
  );
}
