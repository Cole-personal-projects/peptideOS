'use client';

import { ArrowRight, CheckCircle2, Github, Loader2, MessageSquarePlus, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { APP_VERSION } from '@/lib/app-metadata';
import {
  feedbackCategories,
  feedbackCategoryLabel,
  feedbackSeverities,
  feedbackSeverityLabel,
  type FeedbackCategory,
  type FeedbackSeverity,
} from '@/lib/feedback';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string; issueUrl?: string }
  | { status: 'error'; message: string };

export default function FeedbackPage() {
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [severity, setSeverity] = useState<FeedbackSeverity>('minor');
  const [screen, setScreen] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [expected, setExpected] = useState('');
  const [steps, setSteps] = useState('');
  const [email, setEmail] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const route = typeof window === 'undefined' ? '' : window.location.pathname;
  const canSubmit = summary.trim().length >= 4 && details.trim().length >= 8 && submitState.status !== 'submitting';
  const diagnosticPreview = useMemo(() => {
    if (typeof window === 'undefined') return `v${APP_VERSION}`;
    return `v${APP_VERSION} - ${window.innerWidth}x${window.innerHeight}`;
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitState({ status: 'submitting' });

    const diagnostics = includeDiagnostics
      ? {
          appVersion: APP_VERSION,
          route,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      : undefined;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          severity,
          screen,
          summary,
          details,
          expected,
          steps,
          email,
          includeDiagnostics,
          diagnostics,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string; issueUrl?: string };
      if (!response.ok || !payload.ok) {
        setSubmitState({ status: 'error', message: payload.error || 'Feedback could not be submitted.' });
        return;
      }
      setSubmitState({ status: 'success', message: payload.message || 'Feedback sent.', issueUrl: payload.issueUrl });
      setSummary('');
      setDetails('');
      setExpected('');
      setSteps('');
    } catch {
      setSubmitState({ status: 'error', message: 'Feedback could not be submitted. Check your connection and try again.' });
    }
  }

  return (
    <AppShell>
      <PageHeader title="Send Feedback" backHref="/more" />
      <main className="space-y-5 p-4 pb-32">
        <section className="rounded-[18px] border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-primary/10 text-primary">
              <MessageSquarePlus className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Help shape the beta</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Send bugs, requests, rough edges, or comments. We only attach lightweight app diagnostics when you allow it.
              </p>
            </div>
          </div>
        </section>

        {submitState.status === 'success' ? (
          <Alert className="border-chart-2/40 bg-chart-2/10">
            <CheckCircle2 className="h-4 w-4 text-chart-2" />
            <AlertDescription className="space-y-2">
              <p>{submitState.message}</p>
              {submitState.issueUrl ? (
                <a href={submitState.issueUrl} className="inline-flex items-center gap-1 font-medium text-primary">
                  View issue <ArrowRight className="size-3.5" />
                </a>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {submitState.status === 'error' ? (
          <Alert variant="destructive">
            <AlertDescription>{submitState.message}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="feedback-category">Category</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as FeedbackCategory)}>
                    <SelectTrigger id="feedback-category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackCategories.map((value) => (
                        <SelectItem key={value} value={value}>
                          {feedbackCategoryLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-severity">Severity</Label>
                  <Select value={severity} onValueChange={(value) => setSeverity(value as FeedbackSeverity)}>
                    <SelectTrigger id="feedback-severity" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackSeverities.map((value) => (
                        <SelectItem key={value} value={value}>
                          {feedbackSeverityLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-summary">Short summary</Label>
                <Input
                  id="feedback-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  maxLength={140}
                  placeholder="Example: Lab PDF import shows the wrong date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-details">What happened?</Label>
                <Textarea
                  id="feedback-details"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  rows={5}
                  placeholder="Tell us what you saw. Avoid entering lab values, protocol details, or other health information unless needed."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="feedback-expected">Expected result</Label>
                  <Textarea
                    id="feedback-expected"
                    value={expected}
                    onChange={(event) => setExpected(event.target.value)}
                    rows={3}
                    placeholder="What should have happened?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-steps">Steps to reproduce</Label>
                  <Textarea
                    id="feedback-steps"
                    value={steps}
                    onChange={(event) => setSteps(event.target.value)}
                    rows={3}
                    placeholder="1. Open... 2. Tap... 3. See..."
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="feedback-screen">Screen or area</Label>
                  <Input
                    id="feedback-screen"
                    value={screen}
                    onChange={(event) => setScreen(event.target.value)}
                    placeholder={route || '/more/feedback'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-email">Contact email</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={includeDiagnostics}
                  onCheckedChange={(checked) => setIncludeDiagnostics(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-6">
                  Include app version, route, device/browser, viewport, and timezone.
                  <span className="mt-1 block text-xs text-muted-foreground">{diagnosticPreview}</span>
                </span>
              </label>
              <div className="flex items-start gap-2 rounded-[14px] bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                No protocol, lab, inventory, signal, or health records are attached automatically.
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="h-12 w-full" disabled={!canSubmit}>
            {submitState.status === 'submitting' ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
            Send Feedback
          </Button>
        </form>
      </main>
    </AppShell>
  );
}
