"use client";

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Calculator, RotateCcw, Syringe } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { buildProtocolTemplateSchedulePreview, protocolTemplateToStackDraft } from '@/lib/protocol-templates';

export default function ProtocolPreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params);
  const router = useRouter();
  const { data, addStack } = useApp();
  const match = data.compounds.reduce<{
    compound: (typeof data.compounds)[number];
    template: NonNullable<(typeof data.compounds)[number]['protocolTemplates']>[number];
  } | null>((found, compound) => {
    if (found) return found;
    const template = compound.protocolTemplates?.find((candidate) => candidate.id === templateId);
    return template ? { compound, template } : null;
  }, null);
  const [selectedDose, setSelectedDose] = useState(() => match?.template.defaultDose);
  const schedulePreview = useMemo(() => {
    if (!match || !selectedDose) {
      return { phases: [], events: [] };
    }

    return buildProtocolTemplateSchedulePreview({
      compound: match.compound,
      template: match.template,
      doseValue: selectedDose.value,
      doseUnit: selectedDose.unit,
      startDate: new Date().toISOString(),
    });
  }, [match, selectedDose]);

  if (!match || !selectedDose) return null;

  const { compound, template } = match;
  const previewEvents = schedulePreview.events.slice(0, 8);

  const saveStack = () => {
    addStack(protocolTemplateToStackDraft({
      compound,
      template,
      doseValue: selectedDose.value,
      doseUnit: selectedDose.unit,
    }));
    router.push('/stacks');
  };

  return (
    <AppShell>
      <PageHeader title="Protocol Preview" backHref={`/library/setup/${compound.id}`} />
      <div className="space-y-4 p-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="space-y-3 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{template.category.replace(/-/g, ' ')}</Badge>
              <Badge variant="outline" className="capitalize">{template.difficulty}</Badge>
              <Badge variant="outline">Single Medication</Badge>
            </div>
            <h2 className="text-xl font-semibold leading-tight">{template.name}</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{template.summary}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-secondary/35">
          <CardHeader className="pb-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold leading-none">
              <Syringe className="h-5 w-5 text-primary" />
              {compound.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedDose.value} {selectedDose.unit} · {template.schedule.frequency}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{template.titration.length > 0 ? 'Dose ladder' : 'Dosage'}</h2>
                <span className="text-sm text-muted-foreground">
                  {template.titration.length > 0 ? `${schedulePreview.phases.length} phases` : `${selectedDose.value} ${selectedDose.unit}`}
                </span>
              </div>
              {template.titration.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {schedulePreview.phases.map((phase) => (
                    <Badge key={phase.id} variant="secondary">{phase.doseValue} {phase.doseUnit}</Badge>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {template.doseChips.map((chip) => {
                    const selected = chip.value === selectedDose.value && chip.unit === selectedDose.unit;
                    return (
                      <Button
                        key={`${chip.value}-${chip.unit}`}
                        type="button"
                        variant={selected ? 'default' : 'secondary'}
                        aria-pressed={selected}
                        onClick={() => setSelectedDose({ value: chip.value, unit: chip.unit })}
                      >
                        {chip.label} {chip.unit}
                      </Button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div>
                <h2 className="text-base font-semibold">Injection Volume</h2>
                <Button type="button" variant="secondary" className="mt-2 w-full justify-start">
                  <Calculator className="h-4 w-4" />
                  Calculator
                </Button>
              </div>
              <div>
                <h2 className="text-base font-semibold">Time</h2>
                <p className="mt-2 rounded-lg bg-background/70 px-3 py-2 text-sm">{template.schedule.timesOfDay[0]}</p>
              </div>
            </section>

            {template.titration.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Phase preview</h2>
                  <Badge variant="outline">{schedulePreview.events.length} planned events</Badge>
                </div>
                <div className="space-y-2">
                  {schedulePreview.phases.map((phase) => (
                    <div key={phase.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{phase.label}</p>
                          <p className="text-xs text-muted-foreground">{phase.durationDays} days · {phase.scheduleSummary}</p>
                        </div>
                        <Badge variant="secondary">{phase.doseValue} {phase.doseUnit}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {previewEvents.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Next scheduled events</h2>
                  <Badge variant="outline">Preview</Badge>
                </div>
                <div className="grid gap-2">
                  {previewEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl bg-background/70 px-3 py-2">
                      <span className="text-sm font-medium">{event.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <Button type="button" variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </Button>
          </CardContent>
        </Card>

        <Card className="border-chart-4/30 bg-chart-4/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-chart-4">
              <AlertTriangle className="h-4 w-4" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[...template.warnings, ...template.importantNotes].map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button type="button" className="w-full" onClick={saveStack}>
          Save planned protocol
        </Button>
      </div>
    </AppShell>
  );
}
