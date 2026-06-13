"use client";

import { useState } from 'react';
import { AlertTriangle, Check, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { formatDose } from '@/lib/dose-helpers';
import { getScheduleSummary } from '@/lib/schedules';
import { parsedProtocolToStackDraft, type ParsedProtocol, type ProtocolCompoundInput, type StackDraftResult } from '@/lib/ai-protocol';

interface AiStackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const examplePrompts = [
  'BPC-157 250mcg twice daily and TB-500 2.5mg twice weekly for 8 weeks',
  'Ipamorelin 300mcg before bed, weekdays only, for 12 weeks',
  'HGH 2 IU at night, 5 days on 2 days off, for 16 weeks',
  'BPC-157 250mcg every other day for 6 weeks',
  'Semaglutide 0.25mg once weekly on Sundays',
];

export function AiStackSheet({ open, onOpenChange }: AiStackSheetProps) {
  const { data, addStack } = useApp();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StackDraftResult | null>(null);
  const [created, setCreated] = useState(false);

  const trackableCompounds = getTrackableCompounds(data);
  const compoundNameById = new Map(trackableCompounds.map((compound) => [compound.id, compound.name]));

  const resetState = () => {
    setDescription('');
    setLoading(false);
    setError(null);
    setResult(null);
    setCreated(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const handleParse = async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const compounds: ProtocolCompoundInput[] = trackableCompounds.map((compound) => ({
      id: compound.id,
      name: compound.name,
      defaultRoute: compound.defaultRoute,
      supportedRoutes: compound.supportedRoutes,
      defaultDoseUnit: compound.defaultDoseUnit,
    }));

    try {
      const response = await fetch('/api/ai/parse-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), compounds }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? 'AI assistant request failed. Try again.');
        return;
      }

      const parsed = payload?.protocol as ParsedProtocol | undefined;
      if (!parsed) {
        setError('AI assistant returned an unexpected response. Try again.');
        return;
      }

      setResult(parsedProtocolToStackDraft(parsed, compounds));
    } catch {
      setError('Could not reach the AI assistant. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!result?.draft) return;
    addStack(result.draft);
    setCreated(true);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Protocol Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {created ? (
            <div className="rounded-lg border border-border p-6 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold">Stack created</p>
              <p className="text-sm text-muted-foreground">
                &ldquo;{result?.draft?.name}&rdquo; was added as a planned stack. Open it to review and activate the schedules.
              </p>
              <div className="flex gap-2 justify-center pt-1">
                <Button variant="outline" size="sm" onClick={resetState}>
                  <RotateCcw className="w-4 h-4 mr-1" /> New protocol
                </Button>
                <Button size="sm" onClick={() => handleOpenChange(false)}>Done</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-protocol-description">Describe your protocol</Label>
                <Textarea
                  id="ai-protocol-description"
                  rows={4}
                  placeholder="e.g. BPC-157 250mcg twice daily and TB-500 2.5mg twice weekly for 8 weeks"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={loading}
                />
                <div className="flex flex-wrap gap-1.5">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="text-[11px] text-muted-foreground bg-secondary rounded-full px-2.5 py-1 hover:bg-secondary/70 text-left"
                      onClick={() => setDescription(prompt)}
                      disabled={loading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="button" className="w-full" onClick={handleParse} disabled={!description.trim() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building schedule…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Build schedule
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
                  {error}
                </div>
              )}

              {result && (
                <section className="space-y-3">
                  {result.unmatchedCompounds.length > 0 && (
                    <div className="rounded-lg border border-chart-4/50 bg-chart-4/10 p-3 space-y-1">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Not in your library
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.unmatchedCompounds.join(', ')} — add them as custom compounds in the Library first, then try again.
                      </p>
                    </div>
                  )}

                  {result.issues.length > 0 && (
                    <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1">
                      {result.issues.map((issue) => (
                        <p key={issue} className="text-xs text-muted-foreground">• {issue}</p>
                      ))}
                    </div>
                  )}

                  {result.draft ? (
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Stack</p>
                        <p className="font-semibold">{result.draft.name}</p>
                        {result.draft.description && (
                          <p className="text-sm text-muted-foreground mt-1">{result.draft.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{result.draft.durationDays} days</p>
                      </div>
                      <div className="space-y-2">
                        {result.draft.peptides.map((stackPeptide) => (
                          <div key={stackPeptide.peptideId} className="rounded-md bg-secondary/50 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">
                                {compoundNameById.get(stackPeptide.peptideId) ?? stackPeptide.peptideId}
                              </p>
                              <p className="text-sm">
                                {formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)} · {stackPeptide.route.toUpperCase()}
                              </p>
                            </div>
                            {stackPeptide.schedule && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {getScheduleSummary(stackPeptide.schedule)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button type="button" className="w-full" onClick={handleCreate}>
                        <Check className="w-4 h-4 mr-1" /> Create stack
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Review every dose and schedule before activating. This assistant only structures what you wrote — it does not give dosing advice.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      Nothing could be scheduled from that description. Mention at least one compound from your library.
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
