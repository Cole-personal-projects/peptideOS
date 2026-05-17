"use client";

import { use } from 'react';
import { notFound } from 'next/navigation';
import { Calendar, AlertTriangle, Clock, Play, Pause, CheckCircle2, Syringe } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/lib/context';
import { formatDose } from '@/lib/dose-helpers';
import { cn } from '@/lib/utils';
import type { StackStatus } from '@/lib/types';

const statusConfig = {
  active: { icon: Play, label: 'Active', className: 'bg-primary/20 text-primary' },
  planned: { icon: Clock, label: 'Planned', className: 'bg-chart-4/20 text-chart-4' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'bg-chart-3/20 text-chart-3' },
  paused: { icon: Pause, label: 'Paused', className: 'bg-muted text-muted-foreground' },
};

export default function StackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getStack, getPeptide, updateStack } = useApp();
  const stack = getStack(id);

  if (!stack) {
    notFound();
  }

  const config = statusConfig[stack.status];
  const StatusIcon = config.icon;

  const startDate = new Date(stack.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + stack.durationDays);

  const getProgressPercentage = () => {
    if (stack.status === 'planned') return 0;
    if (stack.status === 'completed') return 100;
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max((elapsed / stack.durationDays) * 100, 0), 100);
  };

  const progress = getProgressPercentage();

  const handleStatusChange = (newStatus: StackStatus) => {
    updateStack(stack.id, { status: newStatus });
  };

  // Mock conflict warnings
  const conflicts = [
    { type: 'timing', message: 'CJC-1295 and Ipamorelin should be taken together for synergy' },
  ];

  return (
    <AppShell>
      <PageHeader title={stack.name} backHref="/stacks" />

      <div className="p-4 space-y-4">
        {/* Status and Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className={cn("text-sm", config.className)}>
                <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                {config.label}
              </Badge>
              <div className="flex gap-2">
                {stack.status === 'planned' && (
                  <Button size="sm" onClick={() => handleStatusChange('active')}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Start
                  </Button>
                )}
                {stack.status === 'active' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange('paused')}>
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange('completed')}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                    </Button>
                  </>
                )}
                {stack.status === 'paused' && (
                  <Button size="sm" onClick={() => handleStatusChange('active')}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Resume
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{stack.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="protocol" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="protocol" className="flex-1">Protocol</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="protocol" className="mt-4 space-y-3">
            {stack.peptides.map((sp) => {
              const peptide = getPeptide(sp.peptideId);
              return (
                <Card key={sp.peptideId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{peptide?.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {peptide?.category}
                        </Badge>
                      </div>
                      <Syringe className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Dose</p>
                        <p className="font-medium">{formatDose(sp.doseValue, sp.doseUnit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Frequency</p>
                        <p className="font-medium">{sp.frequency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Route</p>
                        <p className="font-medium uppercase">{sp.route}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Timing</p>
                        <p className="font-medium">{sp.timing}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Protocol Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-muted-foreground py-1">{day}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dayNum = i - startDate.getDay() + 1;
                    const isInRange = dayNum > 0 && dayNum <= stack.durationDays;
                    const isToday = dayNum === Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-md text-xs",
                          isInRange && "bg-secondary",
                          isToday && "bg-primary text-primary-foreground font-bold",
                          !isInRange && "text-muted-foreground/30"
                        )}
                      >
                        {isInRange ? dayNum : ''}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {stack.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{stack.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes added</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <Card className="border-chart-4/50 bg-chart-4/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-chart-4">
                <AlertTriangle className="w-4 h-4" />
                Protocol Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {conflicts.map((conflict, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  {conflict.message}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
