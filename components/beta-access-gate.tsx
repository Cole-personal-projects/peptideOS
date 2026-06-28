"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { betaRedemptionMessage, isBetaGateEnabled, normalizeInviteCode, type BetaRedemptionResult } from '@/lib/beta-access';

const BETA_ACCESS_LOCAL_KEY = 'peptideos.betaAccessPassed';
const BETA_ACCESS_LOCAL_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 180;
const SUCCESS_HANDOFF_MS = 900;

interface LocalBetaAccessMarker {
  passed: true;
  expiresAt: number;
}

type GateStatus = 'checking' | 'locked' | 'submitting' | 'success' | 'unlocked';

function getLocalBetaAccessMarker() {
  if (typeof window === 'undefined') return false;

  try {
    const marker = JSON.parse(window.localStorage.getItem(BETA_ACCESS_LOCAL_KEY) ?? 'null') as
      | Partial<LocalBetaAccessMarker>
      | null;
    if (marker?.passed === true && typeof marker.expiresAt === 'number' && marker.expiresAt > Date.now()) return true;
  } catch {
    // Ignore malformed markers. Cookie verification remains the source of truth.
  }

  window.localStorage.removeItem(BETA_ACCESS_LOCAL_KEY);
  return false;
}

function setLocalBetaAccessMarker() {
  const marker: LocalBetaAccessMarker = {
    passed: true,
    expiresAt: Date.now() + BETA_ACCESS_LOCAL_MAX_AGE_MS,
  };
  window.localStorage.setItem(BETA_ACCESS_LOCAL_KEY, JSON.stringify(marker));
}

function clearLocalBetaAccessMarker() {
  window.localStorage.removeItem(BETA_ACCESS_LOCAL_KEY);
}

export function BetaAccessGate({ children }: { children: ReactNode }) {
  const enabled = isBetaGateEnabled();
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<GateStatus>(() => (enabled ? 'checking' : 'unlocked'));
  const [message, setMessage] = useState('');
  const [hadLocalHint] = useState(() => enabled && getLocalBetaAccessMarker());

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let handoffTimer: number | undefined;
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const hasConfirmedRedirect = params.get('beta') === 'confirmed';
    const betaError = params.get('beta_error');

    async function verifySession() {
      if (hasConfirmedRedirect) {
        setStatus('success');
        setMessage('Beta access confirmed. Opening PeptideOS.');
      } else if (betaError) {
        setStatus('locked');
        setMessage(betaRedemptionMessage({ ok: false, reason: betaError as BetaRedemptionResult['reason'] }));
      } else {
        setStatus('checking');
        setMessage(hadLocalHint ? 'Restoring beta access...' : '');
      }

      try {
        const response = await fetch('/api/beta/redeem', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = (await response.json()) as BetaRedemptionResult;
        if (cancelled) return;

        if (response.ok && payload.ok) {
          setLocalBetaAccessMarker();
          setStatus(hasConfirmedRedirect ? 'success' : 'unlocked');
          setMessage(hasConfirmedRedirect ? 'Beta access confirmed. Opening PeptideOS.' : '');
          window.history.replaceState({}, '', '/');
          if (hasConfirmedRedirect) {
            handoffTimer = window.setTimeout(() => setStatus('unlocked'), SUCCESS_HANDOFF_MS);
          }
          return;
        }

        clearLocalBetaAccessMarker();
        window.history.replaceState({}, '', '/');
        setStatus('locked');
        if (!betaError) setMessage('');
      } catch {
        if (cancelled || controller.signal.aborted) return;
        clearLocalBetaAccessMarker();
        setStatus('locked');
        setMessage('Could not verify beta access right now.');
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
      controller.abort();
      if (handoffTimer) window.clearTimeout(handoffTimer);
    };
  }, [enabled, hadLocalHint]);

  const unlockAfterSuccess = () => {
    setLocalBetaAccessMarker();
    setStatus('success');
    setMessage('Beta access confirmed. Opening PeptideOS.');
    window.setTimeout(() => {
      window.history.replaceState({}, '', '/');
      setStatus('unlocked');
    }, SUCCESS_HANDOFF_MS);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = emailRef.current?.value.trim().toLowerCase() ?? '';
    const inviteCode = normalizeInviteCode(codeRef.current?.value ?? '');

    if (!email || !inviteCode) {
      setMessage('Enter your email and beta key.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, inviteCode }),
      });

      if (response.ok) {
        unlockAfterSuccess();
        return;
      }

      const payload = await readBetaRedemptionPayload(response);
      setMessage(payload.message ?? betaRedemptionMessage(payload));
      setStatus('locked');
    } catch {
      setMessage('Could not unlock beta access right now.');
      setStatus('locked');
    }
  };

  if (status === 'unlocked') return <>{children}</>;

  return (
    <main className="fixed inset-0 z-[2147483647] overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-primary text-primary-foreground">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">PeptideOS</p>
              <p className="text-xs text-muted-foreground">Private beta</p>
            </div>
          </div>
          <div className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Invite only
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Ten-seat beta
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal">Enter beta access.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Use your email and beta key. After access is confirmed, PeptideOS opens in local mode.
            </p>
          </div>

          {status === 'checking' ? (
            <section
              role="status"
              aria-live="polite"
              className="rounded-[18px] border border-border bg-card/95 p-6 text-center shadow-xl"
            >
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Loader2 className="size-7 animate-spin" />
              </div>
              <h2 className="text-2xl font-semibold">Checking beta access.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {message || 'Verifying this device before opening PeptideOS.'}
              </p>
            </section>
          ) : status === 'success' ? (
            <section
              role="status"
              aria-live="polite"
              className="rounded-[18px] border border-primary/40 bg-card/95 p-6 text-center shadow-xl"
            >
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="text-2xl font-semibold">Beta access confirmed.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Opening PeptideOS. The app starts in local mode unless you choose cloud sync later.
              </p>
            </section>
          ) : (
            <form
              action="/api/beta/redeem"
              method="post"
              className="space-y-5 rounded-[18px] border border-border bg-card/95 p-5 shadow-xl"
              onSubmit={handleSubmit}
            >
              <div className="grid gap-2">
                <Label htmlFor="beta-email">Email</Label>
                <Input
                  ref={emailRef}
                  id="beta-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="beta-invite">Beta key</Label>
                <Input
                  ref={codeRef}
                  id="beta-invite"
                  name="inviteCode"
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Paste or type beta key"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full transition-transform active:scale-[0.98]"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Checking beta key...
                  </>
                ) : (
                  <>
                    Enter PeptideOS
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              {message ? (
                <div role="status" className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                  {message}
                </div>
              ) : null}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

async function readBetaRedemptionPayload(response: Response): Promise<BetaRedemptionResult> {
  try {
    return (await response.json()) as BetaRedemptionResult;
  } catch {
    return { ok: false, message: 'Could not unlock beta access right now.' };
  }
}
