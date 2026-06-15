"use client";

import { useMemo, useState } from 'react';
import { Activity, Plus, Save } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';

function clampNumber(value: string, min: number, max: number) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
}

export default function SignalsPage() {
  const { data, addSignalCheckIn } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [energy, setEnergy] = useState('5');
  const [sleepHours, setSleepHours] = useState('7');
  const [notes, setNotes] = useState('');

  const sortedSignals = useMemo(() => (
    [...data.signalCheckIns].sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
  ), [data.signalCheckIns]);

  const saveSignal = () => {
    addSignalCheckIn({
      checkedAt: new Date().toISOString(),
      energy: clampNumber(energy, 0, 10),
      sleepHours: clampNumber(sleepHours, 0, 24),
      notes: notes.trim(),
    });
    setEnergy('5');
    setSleepHours('7');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Signals"
        backHref="/more"
        rightElement={
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4" />
            Add Signal
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {isAdding && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Signal check-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signal-energy">Energy</Label>
                  <Input
                    id="signal-energy"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={10}
                    value={energy}
                    onChange={(event) => setEnergy(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signal-sleep">Sleep</Label>
                  <Input
                    id="signal-sleep"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={24}
                    step={0.25}
                    value={sleepHours}
                    onChange={(event) => setSleepHours(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signal-notes">Notes</Label>
                <Textarea
                  id="signal-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="What changed, what you noticed, or what Haiku should remember"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={saveSignal}>
                  <Save className="w-4 h-4" />
                  Save Signal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sortedSignals.length === 0 ? (
          <Empty className="bg-secondary/40 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>No signal check-ins yet</EmptyTitle>
              <EmptyDescription>
                Capture energy, sleep, and notes so future insights can compare how protocols line up with outcomes.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3" aria-label="Signal check-ins">
            {sortedSignals.map((signal) => (
              <Card key={signal.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {new Date(signal.checkedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(signal.checkedAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-md bg-secondary px-2 py-1">Energy {signal.energy}/10</span>
                    <span className="rounded-md bg-secondary px-2 py-1">Sleep {signal.sleepHours} hr</span>
                  </div>
                  {signal.notes && (
                    <p className="text-sm text-muted-foreground">{signal.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
