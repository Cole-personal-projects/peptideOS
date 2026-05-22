"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, List, ChevronLeft, ChevronRight, Filter, Map } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/lib/context';
import { formatDose } from '@/lib/dose-helpers';
import { buildDoseTimelineGroups } from '@/lib/dose-timeline';
import { getEmptyStateContent } from '@/lib/empty-states';
import { cn } from '@/lib/utils';

export default function LogPage() {
  const { data, getDosesByDate, getPeptide } = useApp();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterPeptide, setFilterPeptide] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  // Get dose counts per day for the current month
  const doseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.doses.forEach(dose => {
      if (!dose.completed) return;
      if (filterPeptide !== 'all' && dose.peptideId !== filterPeptide) return;
      const dateKey = new Date(dose.dateTime).toDateString();
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [data.doses, filterPeptide]);

  const selectedDoses = useMemo(() => {
    let doses = getDosesByDate(selectedDate);
    if (filterPeptide !== 'all') {
      doses = doses.filter(d => d.peptideId === filterPeptide);
    }
    return doses;
  }, [selectedDate, filterPeptide, getDosesByDate]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const timelineGroups = useMemo(
    () => buildDoseTimelineGroups(data.doses, filterPeptide),
    [data.doses, filterPeptide],
  );
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
                <Map className="w-4 h-4" />
                <span className="sr-only">Site map</span>
              </Link>
            </Button>
            <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
              <TabsList className="h-8">
                <TabsTrigger value="calendar" className="h-6 px-2" aria-label="Calendar view">
                  <CalendarDays className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="h-6 px-2" aria-label="List view">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterPeptide} onValueChange={setFilterPeptide}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All peptides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All peptides</SelectItem>
              {data.peptides.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view === 'calendar' ? (
          <>
            {/* Calendar */}
            <Card>
              <CardContent className="p-4">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-xs text-muted-foreground py-1">{day}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, i) => {
                    if (!date) {
                      return <div key={i} className="aspect-square" />;
                    }
                    const count = doseCounts[date.toDateString()] || 0;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors",
                          isSelected(date) && "bg-primary text-primary-foreground",
                          isToday(date) && !isSelected(date) && "border-2 border-primary",
                          !isSelected(date) && "hover:bg-secondary"
                        )}
                      >
                        {date.getDate()}
                        {count > 0 && (
                          <div className={cn(
                            "flex gap-0.5 mt-0.5",
                            isSelected(date) && "opacity-80"
                          )}>
                            {Array.from({ length: Math.min(count, 4) }).map((_, j) => (
                              <div 
                                key={j} 
                                className={cn(
                                  "w-1 h-1 rounded-full",
                                  isSelected(date) ? "bg-primary-foreground" : "bg-primary"
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected day doses */}
            <div>
              <h3 className="font-semibold mb-2">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedDoses.length === 0 ? (
                <Empty className="bg-secondary/40 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDays className="w-5 h-5" />
                    </EmptyMedia>
                    <EmptyTitle>{dayEmptyState.title}</EmptyTitle>
                    <EmptyDescription>{dayEmptyState.description}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {selectedDoses.map((dose) => {
                    const peptide = getPeptide(dose.peptideId);
                    return (
                      <Card key={dose.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{peptide?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(dose.dateTime)} · {dose.route.toUpperCase()} · {dose.site.replace(/-/g, ' ')}
                            </p>
                            <Badge variant={dose.completed ? 'secondary' : 'outline'} className="mt-1">
                              {dose.completed ? 'Completed' : 'Planned'}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{formatDose(dose.doseValue, dose.doseUnit)}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* List view */
          <div className="space-y-4">
            {timelineGroups.length === 0 ? (
              <Empty className="bg-secondary/40">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <List className="w-5 h-5" />
                  </EmptyMedia>
                  <EmptyTitle>{timelineEmptyState.title}</EmptyTitle>
                  <EmptyDescription>{timelineEmptyState.description}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              timelineGroups.slice(0, 30).map((group) => (
                <div key={group.dateKey}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {group.dateLabel}
                  </h3>
                  <div className="space-y-2">
                    {group.doses.map((dose) => {
                      const peptide = getPeptide(dose.peptideId);
                      return (
                        <Card key={dose.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{peptide?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {dose.timeLabel} · {dose.route.toUpperCase()} · {dose.siteLabel}
                              </p>
                              <Badge variant={dose.completed ? 'secondary' : 'outline'} className="mt-1">
                                {dose.statusLabel}
                              </Badge>
                            </div>
                            <Badge variant="secondary">{dose.doseLabel}</Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
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
