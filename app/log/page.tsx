"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, Filter, List, Map } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusDot } from '@/components/ui/visual-primitives';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { useApp } from '@/lib/context';
import { formatDose } from '@/lib/dose-helpers';
import { buildDoseTimelineGroups } from '@/lib/dose-timeline';
import { getEmptyStateContent } from '@/lib/empty-states';
import { cn } from '@/lib/utils';
import type { Dose, Schedule, ScheduleLog } from '@/lib/types';

type DaySignal = 'planned' | 'done' | 'skipped' | 'missed' | 'overdue';

const signalTone: Record<DaySignal, 'primary' | 'success' | 'warning' | 'danger' | 'muted'> = {
  planned: 'primary',
  done: 'success',
  skipped: 'warning',
  missed: 'danger',
  overdue: 'danger',
};

export default function LogPage() {
  const { data, getDosesByDate } = useApp();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterPeptide, setFilterPeptide] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const trackableCompounds = getTrackableCompounds(data);
  const [nowMs] = useState(() => Date.now());

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
    return days;
  }, [currentMonth]);

  const daySignals = useMemo(() => {
    const signals: Record<string, Set<DaySignal>> = {};
    const add = (dateValue: string, signal: DaySignal) => {
      const key = new Date(dateValue).toDateString();
      signals[key] ??= new Set<DaySignal>();
      signals[key].add(signal);
    };

    data.doses
      .filter((dose) => filterPeptide === 'all' || dose.peptideId === filterPeptide)
      .forEach((dose) => add(dose.dateTime, dose.completed ? 'done' : 'planned'));

    data.scheduleLogs
      .filter((log) => filterPeptide === 'all' || log.peptideId === filterPeptide)
      .forEach((log) => {
        if (log.status === 'taken') add(log.takenAt ?? log.dueAt, 'done');
        else if (log.status === 'skipped') add(log.skippedAt ?? log.dueAt, 'skipped');
        else if (log.status === 'missed') add(log.missedAt ?? log.dueAt, 'missed');
        else add(log.dueAt, new Date(log.dueAt).getTime() < nowMs ? 'overdue' : 'planned');
      });

    return signals;
  }, [data.doses, data.scheduleLogs, filterPeptide, nowMs]);

  const selectedDoses = useMemo(() => {
    let doses = getDosesByDate(selectedDate);
    if (filterPeptide !== 'all') doses = doses.filter((dose) => dose.peptideId === filterPeptide);
    return doses;
  }, [selectedDate, filterPeptide, getDosesByDate]);

  const selectedScheduleLogs = useMemo(() => {
    return data.scheduleLogs
      .filter((log) => filterPeptide === 'all' || log.peptideId === filterPeptide)
      .filter((log) => isSameDay(new Date(log.takenAt ?? log.skippedAt ?? log.missedAt ?? log.dueAt), selectedDate))
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [data.scheduleLogs, filterPeptide, selectedDate]);

  const timelineGroups = useMemo(() => buildDoseTimelineGroups(data.doses, filterPeptide), [data.doses, filterPeptide]);
  const dayEmptyState = getEmptyStateContent('log-day-empty');
  const timelineEmptyState = getEmptyStateContent('log-timeline-empty');

  return (
    <AppShell>
      <PageHeader
        title="Dose Log"
        rightElement={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/log/site-map">
                <Map className="h-4 w-4" />
                <span className="sr-only">Site map</span>
              </Link>
            </Button>
            <Tabs value={view} onValueChange={(value) => setView(value as 'calendar' | 'list')}>
              <TabsList className="h-8">
                <TabsTrigger value="calendar" className="h-6 px-2" aria-label="Calendar view">
                  <CalendarDays className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="h-6 px-2" aria-label="List view">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      />

      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPeptide} onValueChange={setFilterPeptide}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All compounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All compounds</SelectItem>
              {trackableCompounds.map((compound) => (
                <SelectItem key={compound.id} value={compound.id}>{compound.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view === 'calendar' ? (
          <>
            <Card className="rounded-[20px]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-sm font-bold">{currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                    <div key={day} className="py-1 text-[11px] font-bold uppercase text-muted-foreground">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
                    const signals = Array.from(daySignals[date.toDateString()] ?? []);
                    const selected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'relative flex aspect-square flex-col items-center justify-center rounded-[12px] border text-sm transition-colors',
                          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent hover:bg-secondary',
                          isSameDay(date, new Date()) && !selected && 'border-primary/50',
                        )}
                      >
                        <span>{date.getDate()}</span>
                        {signals.length > 0 && (
                          <span className="mt-1 flex gap-0.5">
                            {signals.slice(0, 4).map((signal) => (
                              <span
                                key={signal}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  selected && 'bg-primary-foreground',
                                  !selected && signal === 'done' && 'bg-chart-3',
                                  !selected && signal === 'planned' && 'bg-primary',
                                  !selected && signal === 'skipped' && 'bg-chart-4',
                                  !selected && (signal === 'missed' || signal === 'overdue') && 'bg-destructive',
                                )}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] font-semibold text-muted-foreground">
                  {(['planned', 'done', 'skipped', 'missed'] as DaySignal[]).map((signal) => (
                    <span key={signal} className="inline-flex items-center gap-1 capitalize">
                      <StatusDot tone={signalTone[signal]} className="h-2 w-2" /> {signal === 'done' ? 'Done' : signal}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <section>
              <h3 className="mb-2 text-sm font-bold">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedScheduleLogs.length === 0 && selectedDoses.length === 0 ? (
                <Empty className="bg-secondary/40 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDays className="h-5 w-5" />
                    </EmptyMedia>
                    <EmptyTitle>{dayEmptyState.title}</EmptyTitle>
                    <EmptyDescription>{dayEmptyState.description}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {selectedScheduleLogs.map((log) => (
                    <ScheduleLogRow key={log.id} log={log} compounds={trackableCompounds} schedules={data.schedules} nowMs={nowMs} />
                  ))}
                  {selectedDoses.filter((dose) => !dose.scheduleLogId).map((dose) => (
                    <DoseRow key={dose.id} dose={dose} compounds={trackableCompounds} />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="space-y-4">
            {timelineGroups.length === 0 ? (
              <Empty className="bg-secondary/40">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <List className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>{timelineEmptyState.title}</EmptyTitle>
                  <EmptyDescription>{timelineEmptyState.description}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              timelineGroups.slice(0, 30).map((group) => (
                <div key={group.dateKey}>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">{group.dateLabel}</h3>
                  <div className="space-y-2">
                    {group.doses.map((dose) => (
                      <DoseRow key={dose.id} dose={dose} compounds={trackableCompounds} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DoseRow({ dose, compounds }: { dose: Dose; compounds: ReturnType<typeof getTrackableCompounds> }) {
  const compound = compounds.find((candidate) => candidate.id === dose.peptideId);
  return (
    <Card className="rounded-[16px]">
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <StatusDot tone="success" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{compound?.name ?? dose.peptideId}</p>
            <p className="text-xs text-muted-foreground">{formatTime(dose.dateTime)} · {dose.route.toUpperCase()} · {dose.site ? dose.site.replace(/-/g, ' ') : 'site not set'}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Badge variant="secondary">{formatDose(dose.doseValue, dose.doseUnit)}</Badge>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{dose.completed ? 'Completed' : 'Planned'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleLogRow({ log, compounds, schedules, nowMs }: { log: ScheduleLog; compounds: ReturnType<typeof getTrackableCompounds>; schedules: Schedule[]; nowMs: number }) {
  const compound = compounds.find((candidate) => candidate.id === log.peptideId);
  const schedule = schedules.find((candidate) => candidate.id === log.scheduleId);
  const status = getLogSignal(log, nowMs);
  return (
    <Card className="rounded-[16px]">
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <StatusDot tone={signalTone[status]} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{compound?.name ?? log.peptideId}</p>
            <p className="text-xs text-muted-foreground">{formatTime(log.dueAt)} · scheduled</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {schedule && <Badge variant="secondary">{formatDose(schedule.doseValue, schedule.doseUnit)}</Badge>}
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{status === 'done' ? 'Completed' : status}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getLogSignal(log: ScheduleLog, nowMs: number): DaySignal {
  if (log.status === 'taken') return 'done';
  if (log.status === 'skipped') return 'skipped';
  if (log.status === 'missed') return 'missed';
  return new Date(log.dueAt).getTime() < nowMs ? 'overdue' : 'planned';
}

function formatTime(dateTime: string) {
  return new Date(dateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
